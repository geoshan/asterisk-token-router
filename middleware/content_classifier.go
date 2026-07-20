package middleware

import (
	"strings"

	relaymodel "github.com/songquanpeng/one-api/relay/model"
)

// ContentClassifier 内容分类器，根据消息内容判断任务类型
type ContentClassifier struct {
	// 办公日常关键词（匹配 → basic 组）
	OfficeKeywords []string
	// 高级推理关键词（匹配 → advanced 组）
	AdvancedKeywords []string
	// 短文本阈值（字符数，低于此值且无代码特征 → basic）
	ShortTextThreshold int
	// 长文本阈值（字符数，高于此值 → advanced）
	LongTextThreshold int
}

// NewContentClassifier 创建默认配置的分类器
func NewContentClassifier() *ContentClassifier {
	return &ContentClassifier{
		OfficeKeywords: []string{
			"翻译", "translate", "总结", "summary", "summarize",
			"周报", "邮件", "email", "请假", "通知", "公告",
			"文案", "copywriting", "写一", "帮我写",
			"什么是", "是什么", "如何", "怎么", "怎样",
			"介绍一下", "介绍一下", "解释", "explain",
		},
		AdvancedKeywords: []string{
			"代码", "code", "编程", "programming", "debug", "调试",
			"算法", "algorithm", "架构", "architecture", "architect",
			"设计模式", "design pattern", "重构", "refactor",
			"优化", "optimize", "性能", "performance",
			"微服务", "microservice", "分布式", "distributed",
			"数据库设计", "database design", "SQL", "sql",
			"机器学习", "machine learning", "深度学习", "deep learning",
			"神经网络", "neural network",
			"写一个", "实现一个", "implement",
			"分析", "analyze", "推理", "reason",
			"数学", "math", "证明", "proof",
			"并发", "concurrent", "并行", "parallel",
		},
		ShortTextThreshold: 100,
		LongTextThreshold:  2000,
	}
}

// Classify 对消息列表进行内容分类
// 返回 "basic" 或 "advanced"
func (c *ContentClassifier) Classify(messages []relaymodel.Message) string {
	// 提取最后一条 user 消息的文本内容
	content := c.extractLastUserContent(messages)
	if content == "" {
		return "basic"
	}

	// 1. 检测代码特征（代码块标记）
	if c.hasCodeBlock(content) {
		return "advanced"
	}

	// 2. 关键词匹配
	lowered := strings.ToLower(content)

	for _, kw := range c.AdvancedKeywords {
		if strings.Contains(lowered, strings.ToLower(kw)) {
			return "advanced"
		}
	}

	// 3. 长文本 + 非办公关键词 → advanced
	contentLen := len([]rune(content))
	if contentLen > c.LongTextThreshold {
		// 长文本检测是否含技术关键词
		hasOffice := false
		for _, kw := range c.OfficeKeywords {
			if strings.Contains(lowered, strings.ToLower(kw)) {
				hasOffice = true
				break
			}
		}
		if !hasOffice {
			return "advanced"
		}
	}

	// 4. 默认 → basic
	return "basic"
}

// extractLastUserContent 提取最后一条 user 角色消息的文本内容
func (c *ContentClassifier) extractLastUserContent(messages []relaymodel.Message) string {
	for i := len(messages) - 1; i >= 0; i-- {
		if messages[i].Role == "user" {
			return messages[i].StringContent()
		}
	}
	// fallback: 取最后一条消息
	if len(messages) > 0 {
		return messages[len(messages)-1].StringContent()
	}
	return ""
}

// hasCodeBlock 检测文本是否包含代码块标记
func (c *ContentClassifier) hasCodeBlock(content string) bool {
	// 检测 markdown 代码块
	if strings.Contains(content, "```") {
		return true
	}
	// 检测常见代码特征
	codeIndicators := []string{
		"def ", "func ", "class ", "import ",
		"function ", "const ", "let ", "var ",
		"public ", "private ", "package ",
		"#include", "using namespace",
	}
	lowered := strings.ToLower(content)
	for _, indicator := range codeIndicators {
		if strings.Contains(lowered, indicator) {
			return true
		}
	}
	return false
}

// ContentCategory 返回分类对应的模型组名
func ContentCategory(category string) string {
	switch category {
	case "advanced":
		return "advanced"
	default:
		return "basic"
	}
}
