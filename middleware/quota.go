package middleware

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/ctxkey"
	"github.com/songquanpeng/one-api/common/logger"
	"github.com/songquanpeng/one-api/model"
)

// QuotaCheck 熔断检查中间件 - 在 TokenAuth 之后、Distribute 之前
// 检查用户级熔断 + 指定渠道的渠道级熔断
func QuotaCheck() func(c *gin.Context) {
	return func(c *gin.Context) {
		userId := c.GetInt(ctxkey.Id)
		if userId == 0 {
			c.Next()
			return
		}

		// 用户级熔断检查
		if common.IsUserBlocked(userId) {
			currentUsage, _ := common.GetUserQuota(userId)
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{
					"message": fmt.Sprintf("本月额度已用尽（已使用 %.2f 元），请联系管理员", currentUsage),
					"type":    "quota_exceeded",
					"code":    "quota_exceeded",
				},
			})
			c.Abort()
			return
		}

		// 渠道级熔断检查：仅当指定了具体渠道时
		channelIdStr, ok := c.Get(ctxkey.SpecificChannelId)
		if ok {
			channelId, err := strconv.Atoi(channelIdStr.(string))
			if err == nil {
				// 检查渠道是否被 Redis 熔断
				if common.IsChannelBlocked(channelId) {
					c.JSON(http.StatusTooManyRequests, gin.H{
						"error": gin.H{
							"message": fmt.Sprintf("渠道 #%d 已被熔断，请稍后重试", channelId),
							"type":    "channel_blocked",
							"code":    "channel_blocked",
						},
					})
					c.Abort()
					return
				}

				// 检查渠道计费状态（预充值/包月/免费）
				checkChannelBilling(c, channelId)
			}
		}

		c.Next()
	}
}

// checkChannelBilling 检查渠道计费状态，必要时熔断
func checkChannelBilling(c *gin.Context, channelId int) {
	channel, err := model.GetChannelById(channelId, true)
	if err != nil {
		return
	}

	// 从 Redis 获取当月调用次数
	callCount, _ := common.GetChannelUsage(channelId)
	// 同时考虑 DB 中的 call_count（取较大值）
	if channel.CallCount > callCount {
		callCount = channel.CallCount
	}

	var result common.ChannelAlertResult

	// BillingType: 0=预充值, 1=月结, 2=包月
	// 月结模式单独处理
	if channel.BillingType == 1 {
		result = common.CheckMonthlyAlert(channel.MonthlyBudget, channel.MonthlyUsed)
	} else {
		result = common.CheckChannelAlert(
			channel.BillingMode,
			channel.CallLimit,
			callCount,
			channel.Balance,
			channel.RechargeAmount,
			channel.CurrentBalance,
			channel.MonthlyBudget,
			channel.MonthlyUsed,
		)
	}

	if result.Blocked {
		logger.SysError(fmt.Sprintf("CHANNEL_BLOCKED: channel #%d, mode=%d, %s",
			channelId, channel.BillingMode, result.Message))
		// 熔断渠道写入 Redis
		common.BlockChannel(channelId, 0)

		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": gin.H{
				"message": "渠道不可用：" + result.Message,
				"type":    "channel_blocked",
				"code":    "channel_blocked",
			},
		})
		c.Abort()
	} else if result.Message != "" {
		logger.SysLog(fmt.Sprintf("CHANNEL_ALERT: channel #%d, level=%d, %s",
			channelId, result.Level, result.Message))
	}
}
