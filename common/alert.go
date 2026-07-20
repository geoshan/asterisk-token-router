package common

import (
	"fmt"

	"github.com/songquanpeng/one-api/common/logger"
)

// AlertLevel 告警级别
const (
	AlertLevelWarning  = 1 // 80% - 预警
	AlertLevelCritical = 2 // 90% - 严重
	AlertLevelBlock    = 3 // 100% - 熔断
)

// AlertRecorder 告警记录回调，由 model 层在初始化时注册
var AlertRecorder func(userId int, level int, pct int)

// CheckAndAlert 检查用量阈值，必要时触发告警或熔断
// 返回 true 表示已触发熔断
func CheckAndAlert(userId int, currentUsage float64, quotaLimit float64) bool {
	if quotaLimit <= 0 {
		return false
	}

	pct := currentUsage / quotaLimit

	// 100%: 熔断
	if pct >= 1.0 {
		if !IsUserBlocked(userId) {
			BlockUser(userId)
			recordAlert(userId, AlertLevelBlock, int(pct*100))
			logger.SysError(fmt.Sprintf("USER BLOCKED: user %d, usage %.2f/%.2f (%.0f%%)",
				userId, currentUsage, quotaLimit, pct*100))
			return true
		}
		return true
	}

	// 90%: 严重告警
	if pct >= 0.9 {
		if !IsAlertSent(userId, AlertLevelCritical) {
			recordAlert(userId, AlertLevelCritical, int(pct*100))
			MarkAlertSent(userId, AlertLevelCritical)
		}
		return false
	}

	// 80%: 预警
	if pct >= 0.8 {
		if !IsAlertSent(userId, AlertLevelWarning) {
			recordAlert(userId, AlertLevelWarning, int(pct*100))
			MarkAlertSent(userId, AlertLevelWarning)
		}
		return false
	}

	return false
}

// recordAlert 通过回调写入告警记录
func recordAlert(userId int, level int, pct int) {
	if AlertRecorder != nil {
		AlertRecorder(userId, level, pct)
	}
}

// AlertLevelDesc 返回告警级别描述
func AlertLevelDesc(level int) string {
	switch level {
	case AlertLevelWarning:
		return "预警 (80%)"
	case AlertLevelCritical:
		return "严重 (90%)"
	case AlertLevelBlock:
		return "熔断 (100%)"
	default:
		return "未知"
	}
}
