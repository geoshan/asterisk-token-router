package middleware

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/songquanpeng/one-api/common"
	"github.com/songquanpeng/one-api/common/ctxkey"
)

// QuotaCheck 熔断检查中间件 - 在 TokenAuth 之后、Distribute 之前
func QuotaCheck() func(c *gin.Context) {
	return func(c *gin.Context) {
		userId := c.GetInt(ctxkey.Id)
		if userId == 0 {
			c.Next()
			return
		}

		if common.IsUserBlocked(userId) {
			// 获取用量信息用于提示
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
		c.Next()
	}
}
