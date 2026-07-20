package middleware

import (
	"encoding/json"
	"strings"

	"github.com/gin-gonic/gin"
	relaymodel "github.com/songquanpeng/one-api/relay/model"

	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/logger"
)

// AutoRouteRequest 用于解析 auto 路由时的请求体
type AutoRouteRequest struct {
	Model    string             `json:"model"`
	Messages []relaymodel.Message `json:"messages"`
}

// DefaultAutoModels 默认的 auto 路由模型映射
var DefaultAutoModels = map[string]string{
	"basic":    "gpt-4o-mini",
	"advanced": "gpt-4o",
}

// resolveAutoModel 当 model="auto" 时，根据消息内容分类确定实际模型
func resolveAutoModel(c *gin.Context) string {
	ctx := c.Request.Context()

	// 读取请求体
	body, err := common.GetRequestBody(c)
	if err != nil {
		logger.Warnf(ctx, "auto router: failed to read body: %v", err)
		return DefaultAutoModels["basic"]
	}

	// 解析请求
	var req AutoRouteRequest
	if err := json.Unmarshal(body, &req); err != nil {
		logger.Warnf(ctx, "auto router: failed to parse body: %v", err)
		return DefaultAutoModels["basic"]
	}

	// 如果用户显式指定了非 auto 模型，直接使用（双重保护）
	if req.Model != "" && req.Model != "auto" && !strings.HasPrefix(req.Model, "auto") {
		return req.Model
	}

	// 如果无消息，使用 basic
	if len(req.Messages) == 0 {
		return DefaultAutoModels["basic"]
	}

	// 内容分类
	classifier := NewContentClassifier()
	category := classifier.Classify(req.Messages)

	logger.Infof(ctx, "auto router: classified as '%s', routing to '%s'", category, DefaultAutoModels[category])

	if model, ok := DefaultAutoModels[category]; ok {
		return model
	}
	return DefaultAutoModels["basic"]
}
