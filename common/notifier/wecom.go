package notifier

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/songquanpeng/one-api/common/logger"
)

// WeComNotifier 企业微信通知器
type WeComNotifier struct {
	WebhookURL string
	HTTPClient *http.Client
}

// NewWeComNotifier 创建企业微信通知器
func NewWeComNotifier(webhookURL string) *WeComNotifier {
	return &WeComNotifier{
		WebhookURL: webhookURL,
		HTTPClient: &http.Client{Timeout: 10 * time.Second},
	}
}

// WeComMarkdownMessage 企业微信 Markdown 消息格式
type WeComMarkdownMessage struct {
	MsgType  string              `json:"msgtype"`
	Markdown WeComMarkdown       `json:"markdown"`
}

type WeComMarkdown struct {
	Content string `json:"content"`
}

// Send 发送告警通知
func (w *WeComNotifier) Send(userId int, username string, level int, pct int, currentUsage float64, quotaLimit float64) error {
	if w.WebhookURL == "" {
		logger.SysLog("WeComNotifier: webhook URL not configured, skipping notification")
		return nil
	}

	levelEmoji := "🟢"
	levelText := "预警通知"
	switch level {
	case 1:
		levelEmoji = "🟡"
		levelText = "用量预警 (80%)"
	case 2:
		levelEmoji = "🟠"
		levelText = "严重告警 (90%)"
	case 3:
		levelEmoji = "🔴"
		levelText = "额度耗尽 (100%) - 已自动暂停服务"
	}

	content := fmt.Sprintf(`## %s Token Router 用量告警

> 用户：**%s** (ID: %d)
> 告警级别：%s
> 当月用量：**%.2f** 元 / **%.2f** 元 (%d%%)
> 时间：%s

%s`,
		levelEmoji,
		username, userId,
		levelText,
		currentUsage, quotaLimit, pct,
		time.Now().Format("2006-01-02 15:04:05"),
		func() string {
			if level >= 3 {
				return "⚠️ 该用户服务已自动暂停。请管理员提升额度或手动恢复。"
			}
			return "请关注用量趋势，建议提前调整额度或与用户沟通。"
		}(),
	)

	msg := WeComMarkdownMessage{
		MsgType: "markdown",
		Markdown: WeComMarkdown{
			Content: content,
		},
	}

	body, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("marshal message: %w", err)
	}

	resp, err := w.HTTPClient.Post(w.WebhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		logger.SysError(fmt.Sprintf("WeComNotifier: send failed: %v", err))
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		logger.SysError(fmt.Sprintf("WeComNotifier: unexpected status %d", resp.StatusCode))
		return fmt.Errorf("wecom returned status %d", resp.StatusCode)
	}

	logger.SysLog(fmt.Sprintf("WeComNotifier: alert sent for user %d, level %d", userId, level))
	return nil
}
