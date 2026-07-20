package notifier

// Notifier 通知接口，支持多渠道扩展
type Notifier interface {
	Send(userId int, username string, level int, pct int, currentUsage float64, quotaLimit float64) error
}
