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

// ChannelAlertLevel 渠道告警级别（两级：预警 + 熔断）
const (
	ChannelAlertWarning = 1 // 预警
	ChannelAlertBlock   = 2 // 熔断
)

// HealthStatus 渠道健康状态
type HealthStatus string

const (
	HealthNormal   HealthStatus = "normal"
	HealthWarning  HealthStatus = "warning"
	HealthCritical HealthStatus = "critical"
	HealthDisabled HealthStatus = "disabled"
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
	Blocked      bool         // 是否应阻断请求
	Level        int          // 告警级别
	Message      string       // 告警/阻断原因
	HealthStatus HealthStatus // 渠道健康状态
}

// CheckChannelAlert 检查渠道计费状态（两级告警：预警 + 熔断）
//
// billingMode:    0=包月, 1=按量(预充值), 2=免费
// callLimit:      包月调用上限（billingMode=0 时有效，0=不限）
// callCount:      当月已调用次数
// balance:        预充值余额（billingMode=1 时有效，兼容旧逻辑）
// rechargeAmount: 预充值单次充值金额
// currentBalance: 预充值当前余额
// monthlyBudget:  月结预算额度
// monthlyUsed:    月结已使用额度
func CheckChannelAlert(
	billingMode int,
	callLimit int64, callCount int64,
	balance float64,
	rechargeAmount float64, currentBalance float64,
	monthlyBudget float64, monthlyUsed float64,
) ChannelAlertResult {
	switch billingMode {
	case BillingModeSubscription:
		return checkSubscriptionAlert(callLimit, callCount)
	case BillingModePerToken:
		return checkPrepaidAlert(rechargeAmount, currentBalance, balance)
	case BillingModeFree:
		return ChannelAlertResult{
			Blocked:      false,
			HealthStatus: HealthNormal,
		} // 免费模式永不阻断
	default:
		// 默认按量计费模式
		return checkPrepaidAlert(rechargeAmount, currentBalance, balance)
	}
}

// checkSubscriptionAlert 包月模式：检查调用次数是否超限（两级：预警 + 熔断）
func checkSubscriptionAlert(callLimit int64, callCount int64) ChannelAlertResult {
	if callLimit <= 0 {
		// 不限调用次数
		return ChannelAlertResult{HealthStatus: HealthNormal}
	}

	pct := float64(callCount) / float64(callLimit)

	// ≥ 90%: 熔断
	if pct >= 0.9 {
		return ChannelAlertResult{
			Blocked:      true,
			Level:        ChannelAlertBlock,
			HealthStatus: HealthCritical,
			Message:      fmt.Sprintf("包月渠道调用次数已超过90%% (%d/%d, %.0f%%)，已熔断", callCount, callLimit, pct*100),
		}
	}

	// > 80%: 预警
	if pct > 0.8 {
		return ChannelAlertResult{
			Blocked:      false,
			Level:        ChannelAlertWarning,
			HealthStatus: HealthWarning,
			Message:      fmt.Sprintf("包月渠道调用次数使用 %.0f%% (%d/%d)，已达预警线", pct*100, callCount, callLimit),
		}
	}

	return ChannelAlertResult{HealthStatus: HealthNormal}
}

// checkPrepaidAlert 预充值模式：检查余额（两级：预警 + 熔断）
// CurrentBalance < RechargeAmount * 0.2 → 预警
// CurrentBalance <= 0 → 熔断（金额用完）
func checkPrepaidAlert(rechargeAmount float64, currentBalance float64, legacyBalance float64) ChannelAlertResult {
	// 确定实际余额：优先使用 CurrentBalance，fallback 到 Balance
	effectiveBalance := currentBalance
	if effectiveBalance <= 0 && rechargeAmount <= 0 {
		// 兼容旧逻辑：无预充值配置时使用 Balance
		effectiveBalance = legacyBalance
		return checkLegacyBalanceAlert(effectiveBalance)
	}

	// 预充值模式：基于 RechargeAmount 的阈值判断
	if rechargeAmount <= 0 {
		// 有余额但没有充值基数，使用绝对值判断
		if effectiveBalance <= 0 {
			return ChannelAlertResult{
				Blocked:      true,
				Level:        ChannelAlertBlock,
				HealthStatus: HealthCritical,
				Message:      fmt.Sprintf("预充值渠道余额已用尽 (%.2f 元)", effectiveBalance),
			}
		}
		return ChannelAlertResult{HealthStatus: HealthNormal}
	}

	// CurrentBalance <= 0 → 熔断（金额用完即熔断）
	if effectiveBalance <= 0 {
		return ChannelAlertResult{
			Blocked:      true,
			Level:        ChannelAlertBlock,
			HealthStatus: HealthCritical,
			Message:      fmt.Sprintf("预充值渠道余额已用尽 (%.2f 元)，已熔断", effectiveBalance),
		}
	}

	// CurrentBalance < RechargeAmount * 0.2 → 预警
	if effectiveBalance < rechargeAmount*0.2 {
		return ChannelAlertResult{
			Blocked:      false,
			Level:        ChannelAlertWarning,
			HealthStatus: HealthWarning,
			Message:      fmt.Sprintf("预充值渠道余额不足 (%.2f 元 < 充值额 %.2f 的 20%%)", effectiveBalance, rechargeAmount),
		}
	}

	return ChannelAlertResult{HealthStatus: HealthNormal}
}

// checkLegacyBalanceAlert 旧版余额告警（无 RechargeAmount 时使用绝对值）
func checkLegacyBalanceAlert(balance float64) ChannelAlertResult {
	if balance <= 0 {
		return ChannelAlertResult{
			Blocked:      true,
			Level:        ChannelAlertBlock,
			HealthStatus: HealthCritical,
			Message:      fmt.Sprintf("预充值渠道余额已用尽 (%.2f 元)", balance),
		}
	}
	if balance <= 5.0 {
		return ChannelAlertResult{
			Blocked:      false,
			Level:        ChannelAlertWarning,
			HealthStatus: HealthWarning,
			Message:      fmt.Sprintf("预充值渠道余额不足 (%.2f 元)", balance),
		}
	}
	return ChannelAlertResult{HealthStatus: HealthNormal}
}

// CheckMonthlyAlert 月结模式检查：MonthlyUsed / MonthlyBudget 超 0.8 预警，超 0.98 熔断
func CheckMonthlyAlert(monthlyBudget float64, monthlyUsed float64) ChannelAlertResult {
	if monthlyBudget <= 0 {
		return ChannelAlertResult{HealthStatus: HealthNormal}
	}

	pct := monthlyUsed / monthlyBudget

	// > 98%: 熔断（考虑平台计算误差）
	if pct > 0.98 {
		return ChannelAlertResult{
			Blocked:      true,
			Level:        ChannelAlertBlock,
			HealthStatus: HealthCritical,
			Message:      fmt.Sprintf("月结渠道已使用 %.1f%% (%.2f/%.2f)，已超过98%%熔断线", pct*100, monthlyUsed, monthlyBudget),
		}
	}

	// > 80%: 预警
	if pct > 0.8 {
		return ChannelAlertResult{
			Blocked:      false,
			Level:        ChannelAlertWarning,
			HealthStatus: HealthWarning,
			Message:      fmt.Sprintf("月结渠道已使用 %.0f%% (%.2f/%.2f)，已达80%%预警线", pct*100, monthlyUsed, monthlyBudget),
		}
	}

	return ChannelAlertResult{HealthStatus: HealthNormal}
}
