package common

import (
	"github.com/songquanpeng/one-api/common/notifier"
)

// GlobalNotifier 全局通知器实例
var GlobalNotifier notifier.Notifier

// SetNotifier 设置通知器（由初始化代码调用）
func SetNotifier(n notifier.Notifier) {
	GlobalNotifier = n
}

// NotifyAlert 发送告警通知（不依赖 model 层）
func NotifyAlert(userId int, username string, level int, pct int, currentUsage float64, quotaLimit float64) {
	if GlobalNotifier != nil {
		go func() {
			GlobalNotifier.Send(userId, username, level, pct, currentUsage, quotaLimit)
		}()
	}
}
