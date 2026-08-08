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

// ChannelAlertLevel 渠道告警级别
const (
	ChannelAlertWarning  = 1 // 预充值余额不足预警
	ChannelAlertCritical = 2 // 预充值余额严重不足
	ChannelAlertBlock    = 3 // 渠道熔断
)

// ChannelBillingMode 渠道计费模式（引用 model 常量，避免循环导入）
const (
	BillingModeSubscription = 0 // 包月
	BillingModePerToken     = 1 // 按量/预充值
	BillingModeFree          = 2 // 免费
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

// ========== 渠道计费告警 ==========

// ChannelAlertResult 渠道告警检查结果
type ChannelAlertResult struct {
	Blocked bool   // 是否应阻断请求
	Level   int    // 告警级别
	Message string // 告警/阻断原因
}

// CheckChannelAlert 检查渠道计费状态，处理预充值/包月/免费三种模式
//
// billingMode: 0=包月, 1=按量(预充值), 2=免费
// callLimit:   包月调用上限（billingMode=0 时有效，0=不限）
// callCount:   当月已调用次数
// balance:     预充值余额（billingMode=1 时有效）
// 返回告警结果，Blocked=true 时应阻断请求
func CheckChannelAlert(billingMode int, callLimit int64, callCount int64, balance float64) ChannelAlertResult {
	switch billingMode {
	case BillingModeSubscription:
		return checkSubscriptionAlert(callLimit, callCount)
	case BillingModePerToken:
		return checkPrepaidAlert(balance)
	case BillingModeFree:
		return ChannelAlertResult{Blocked: false} // 免费模式永不阻断
	default:
		// 默认按量计费模式
		return checkPrepaidAlert(balance)
	}
}

// checkSubscriptionAlert 包月模式：检查调用次数是否超限
func checkSubscriptionAlert(callLimit int64, callCount int64) ChannelAlertResult {
	if callLimit <= 0 {
		// 不限调用次数
		return ChannelAlertResult{Blocked: false}
	}

	pct := float64(callCount) / float64(callLimit)

	if pct >= 1.0 {
		return ChannelAlertResult{
			Blocked: true,
			Level:   ChannelAlertBlock,
			Message: fmt.Sprintf("包月渠道调用次数已用尽 (%d/%d)", callCount, callLimit),
		}
	}
	if pct >= 0.9 {
		return ChannelAlertResult{
			Blocked: false,
			Level:   ChannelAlertCritical,
			Message: fmt.Sprintf("包月渠道调用次数即将用尽 (%d/%d, %.0f%%)", callCount, callLimit, pct*100),
		}
	}
	if pct >= 0.8 {
		return ChannelAlertResult{
			Blocked: false,
			Level:   ChannelAlertWarning,
			Message: fmt.Sprintf("包月渠道调用次数使用 %.0f%% (%d/%d)", pct*100, callCount, callLimit),
		}
	}
	return ChannelAlertResult{Blocked: false}
}

// checkPrepaidAlert 预充值/按量模式：检查余额
func checkPrepaidAlert(balance float64) ChannelAlertResult {
	if balance <= 0 {
		return ChannelAlertResult{
			Blocked: true,
			Level:   ChannelAlertBlock,
			Message: fmt.Sprintf("预充值渠道余额已用尽 (%.2f 元)", balance),
		}
	}
	if balance <= 1.0 {
		return ChannelAlertResult{
			Blocked: false,
			Level:   ChannelAlertCritical,
			Message: fmt.Sprintf("预充值渠道余额严重不足 (%.2f 元)", balance),
		}
	}
	if balance <= 5.0 {
		return ChannelAlertResult{
			Blocked: false,
			Level:   ChannelAlertWarning,
			Message: fmt.Sprintf("预充值渠道余额不足 (%.2f 元)", balance),
		}
	}
	return ChannelAlertResult{Blocked: false}
}
