package controller

import (
	"context"
	"errors"
	"fmt"
	"math"
	"net/http"
	"strings"

	"github.com/songquanpeng/one-api/common/helper"
	"github.com/songquanpeng/one-api/relay/constant/role"

	"github.com/gin-gonic/gin"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
	"github.com/songquanpeng/one-api/relay/adaptor/openai"
	"github.com/songquanpeng/one-api/relay/channeltype"
	"github.com/songquanpeng/one-api/relay/controller/validator"
	"github.com/songquanpeng/one-api/relay/meta"
	relaymodel "github.com/songquanpeng/one-api/relay/model"
	"github.com/songquanpeng/one-api/relay/relaymode"
)

func getAndValidateTextRequest(c *gin.Context, relayMode int) (*relaymodel.GeneralOpenAIRequest, error) {
	textRequest := &relaymodel.GeneralOpenAIRequest{}
	err := common.UnmarshalBodyReusable(c, textRequest)
	if err != nil {
		return nil, err
	}
	if relayMode == relaymode.Moderations && textRequest.Model == "" {
		textRequest.Model = "text-moderation-latest"
	}
	if relayMode == relaymode.Embeddings && textRequest.Model == "" {
		textRequest.Model = c.Param("model")
	}
	err = validator.ValidateTextRequest(textRequest, relayMode)
	if err != nil {
		return nil, err
	}
	return textRequest, nil
}

func getPromptTokens(textRequest *relaymodel.GeneralOpenAIRequest, relayMode int) int {
	switch relayMode {
	case relaymode.ChatCompletions:
		return openai.CountTokenMessages(textRequest.Messages, textRequest.Model)
	case relaymode.Completions:
		return openai.CountTokenInput(textRequest.Prompt, textRequest.Model)
	case relaymode.Moderations:
		return openai.CountTokenInput(textRequest.Input, textRequest.Model)
	}
	return 0
}

// getPreConsumedQuota 返回预扣额度。
// asterisk-token-router V1.2 阶段2：金额制（¥/M token）下预扣固定为 0，
// 不再按倍率乘算（倍率体系已移除）。
func getPreConsumedQuota() int64 {
	return 0
}

func preConsumeQuota(ctx context.Context, meta *meta.Meta) (int64, *relaymodel.ErrorWithStatusCode) {
	preConsumedQuota := getPreConsumedQuota()
	userQuota, err := model.CacheGetUserQuota(ctx, meta.UserId)
	if err != nil {
		return preConsumedQuota, openai.ErrorWrapper(err, "get_user_quota_failed", http.StatusInternalServerError)
	}
	if userQuota <= 0 {
		return preConsumedQuota, openai.ErrorWrapper(errors.New("user quota is not enough"), "insufficient_user_quota", http.StatusForbidden)
	}
	if preConsumedQuota == 0 {
		// 金额制下预扣为 0，仅校验余额
		return 0, nil
	}
	err = model.CacheDecreaseUserQuota(meta.UserId, preConsumedQuota)
	if err != nil {
		return preConsumedQuota, openai.ErrorWrapper(err, "decrease_user_quota_failed", http.StatusInternalServerError)
	}
	if preConsumedQuota > 0 {
		err := model.PreConsumeTokenQuota(meta.TokenId, preConsumedQuota)
		if err != nil {
			return preConsumedQuota, openai.ErrorWrapper(err, "pre_consume_token_quota_failed", http.StatusForbidden)
		}
	}
	return preConsumedQuota, nil
}

func postConsumeQuota(ctx context.Context, usage *relaymodel.Usage, meta *meta.Meta, textRequest *relaymodel.GeneralOpenAIRequest, preConsumedQuota int64, systemPromptReset bool) {
	if usage == nil {
		logger.Error(ctx, "usage is nil, which is unexpected")
		return
	}
	var quota int64
	promptTokens := usage.PromptTokens
	completionTokens := usage.CompletionTokens
	// asterisk-token-router V1.2 阶段2：计费统一 ¥/M token 口径，价格来源 model_prices（fallback price_in/price_out），倍率体系移除
	var logContent string
	channel, chErr := model.GetChannelById(meta.ChannelId, false)
	if chErr != nil || channel == nil {
		quota = 0
		logContent = "渠道查询失败，按免费处理"
		logger.SysError(fmt.Sprintf("结算时查询渠道 %d 失败，按免费处理", meta.ChannelId))
	} else {
		switch channel.BillingMode {
		case model.BillingModePerToken:
			inputPrice, outputPrice, _ := channel.GetModelPrice(textRequest.Model)
			if inputPrice > 0 || outputPrice > 0 {
				// quota 单位换算：1e6 quota = ¥1，故 quota = tokens × (¥/M 价格)
				quota = int64(math.Ceil(float64(promptTokens)*inputPrice + float64(completionTokens)*outputPrice))
				logContent = fmt.Sprintf("价格：输入¥%.2f/M 输出¥%.2f/M", inputPrice, outputPrice)
			} else {
				// TC-BILL-06：未知/未配置价格的模型不再回落倍率静默高估，按免费处理并告警
				quota = 0
				logContent = "未配置价格，按免费处理"
				logger.SysError(fmt.Sprintf("渠道 %d 模型 %s 未配置价格，按免费处理", meta.ChannelId, textRequest.Model))
			}
		case model.BillingModeFree:
			// 免费渠道不计费
			quota = 0
			logContent = "免费渠道"
		default:
			// 包月渠道：不计费到用户额度
			quota = 0
			logContent = "包月渠道"
		}
	}
	totalTokens := promptTokens + completionTokens
	if totalTokens == 0 {
		// in this case, must be some error happened
		// we cannot just return, because we may have to return the pre-consumed quota
		quota = 0
	}
	quotaDelta := quota - preConsumedQuota
	err := model.PostConsumeTokenQuota(meta.TokenId, quotaDelta)
	if err != nil {
		logger.Error(ctx, "error consuming token remain quota: "+err.Error())
	}
	err = model.CacheUpdateUserQuota(ctx, meta.UserId)
	if err != nil {
		logger.Error(ctx, "error update user quota cache: "+err.Error())
	}
	// asterisk-token-router: usage tracking for quota monitoring
	go trackUsageForQuota(meta, usage, promptTokens, completionTokens)
	model.RecordConsumeLog(ctx, &model.Log{
		UserId:            meta.UserId,
		ChannelId:         meta.ChannelId,
		PromptTokens:      promptTokens,
		CompletionTokens:  completionTokens,
		ModelName:         textRequest.Model,
		TokenName:         meta.TokenName,
		Quota:             int(quota),
		Content:           logContent,
		IsStream:          meta.IsStream,
		ElapsedTime:       helper.CalcElapsedTime(meta.StartTime),
		SystemPromptReset: systemPromptReset,
	})
	model.UpdateUserUsedQuotaAndRequestCount(meta.UserId, quota)
	model.UpdateChannelUsedQuota(meta.ChannelId, quota)
}

func getMappedModelName(modelName string, mapping map[string]string) (string, bool) {
	if mapping == nil {
		return modelName, false
	}
	mappedModelName := mapping[modelName]
	if mappedModelName != "" {
		return mappedModelName, true
	}
	return modelName, false
}

func isErrorHappened(meta *meta.Meta, resp *http.Response) bool {
	if resp == nil {
		if meta.ChannelType == channeltype.AwsClaude {
			return false
		}
		return true
	}
	if resp.StatusCode != http.StatusOK &&
		// replicate return 201 to create a task
		resp.StatusCode != http.StatusCreated {
		return true
	}
	if meta.ChannelType == channeltype.DeepL {
		// skip stream check for deepl
		return false
	}

	if meta.IsStream && strings.HasPrefix(resp.Header.Get("Content-Type"), "application/json") &&
		// Even if stream mode is enabled, replicate will first return a task info in JSON format,
		// requiring the client to request the stream endpoint in the task info
		meta.ChannelType != channeltype.Replicate {
		return true
	}
	return false
}

func setSystemPrompt(ctx context.Context, request *relaymodel.GeneralOpenAIRequest, prompt string) (reset bool) {
	if prompt == "" {
		return false
	}
	if len(request.Messages) == 0 {
		return false
	}
	if request.Messages[0].Role == role.System {
		request.Messages[0].Content = prompt
		logger.Infof(ctx, "rewrite system prompt")
		return true
	}
	request.Messages = append([]relaymodel.Message{{
		Role:    role.System,
		Content: prompt,
	}}, request.Messages...)
	logger.Infof(ctx, "add system prompt")
	return true
}


// asterisk-token-router: track usage and check quota thresholds
func trackUsageForQuota(meta *meta.Meta, usage *relaymodel.Usage, promptTokens int, completionTokens int) {
	if usage == nil {
		return
	}
	userId := meta.UserId
	channelId := meta.ChannelId
	
	// Get channel billing info
	channel, err := model.GetChannelById(channelId, false)
	if err != nil || channel == nil {
		return
	}
	
	// Calculate cost（价格来源与主计费同源：channel.GetModelPrice，¥/M token）
	var cost float64
	if channel.BillingMode == model.BillingModePerToken {
		inputPrice, outputPrice, _ := channel.GetModelPrice(meta.ActualModelName)
		cost = (float64(promptTokens)/1000000)*inputPrice + (float64(completionTokens)/1000000)*outputPrice
	} else {
		cost = 0 // subscription/free models don't count toward quota
	}
	
	// Update Redis usage counter
	currentUsage, err := common.IncrUserQuota(userId, cost)
	if err != nil {
		return
	}
	
	// Get user quota limit from token
	token, err := model.GetTokenById(meta.TokenId)
	if err != nil || token == nil {
		return
	}
	quotaLimit := float64(token.RemainQuota) + float64(token.UsedQuota)
	if token.UnlimitedQuota {
		return // unlimited quota, skip check
	}
	
	// Check thresholds
	common.CheckAndAlert(userId, currentUsage, quotaLimit)
}
