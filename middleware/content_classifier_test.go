package middleware

import (
	"testing"

	relaymodel "github.com/songquanpeng/one-api/relay/model"
)

func TestNewContentClassifier(t *testing.T) {
	cc := NewContentClassifier()

	if cc == nil {
		t.Fatal("NewContentClassifier returned nil")
	}
	if cc.ShortTextThreshold != 100 {
		t.Errorf("ShortTextThreshold = %d, want 100", cc.ShortTextThreshold)
	}
	if cc.LongTextThreshold != 2000 {
		t.Errorf("LongTextThreshold = %d, want 2000", cc.LongTextThreshold)
	}
	if len(cc.OfficeKeywords) == 0 {
		t.Error("OfficeKeywords should not be empty")
	}
	if len(cc.AdvancedKeywords) == 0 {
		t.Error("AdvancedKeywords should not be empty")
	}
}

func TestContentClassifier_Classify_CodeRequests(t *testing.T) {
	cc := NewContentClassifier()

	tests := []struct {
		name     string
		messages []relaymodel.Message
		want     string
	}{
		{
			name:     "Python写一个函数",
			messages: []relaymodel.Message{{Role: "user", Content: "写一个 Python 实现快速排序的函数"}},
			want:     "advanced",
		},
		{
			name:     "Debug Go报错",
			messages: []relaymodel.Message{{Role: "user", Content: "请帮我 debug 这个 Go 报错"}},
			want:     "advanced",
		},
		{
			name:     "英文代码请求",
			messages: []relaymodel.Message{{Role: "user", Content: "implement binary search algorithm in Rust"}},
			want:     "advanced",
		},
		{
			name:     "架构讨论",
			messages: []relaymodel.Message{{Role: "user", Content: "设计一个微服务的鉴权方案"}},
			want:     "advanced",
		},
		{
			name:     "实现一个函数",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我实现一个LRU缓存"}},
			want:     "advanced",
		},
		{
			name:     "算法问题",
			messages: []relaymodel.Message{{Role: "user", Content: "解释一下动态规划算法的原理"}},
			want:     "advanced",
		},
		{
			name:     "代码优化",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我优化这段代码的性能"}},
			want:     "advanced",
		},
		{
			name:     "并发编程",
			messages: []relaymodel.Message{{Role: "user", Content: "写一个并发安全的计数器"}},
			want:     "advanced",
		},
		{
			name:     "SQL查询",
			messages: []relaymodel.Message{{Role: "user", Content: "写一个SQL查询找出重复记录"}},
			want:     "advanced",
		},
		{
			name:     "数学证明",
			messages: []relaymodel.Message{{Role: "user", Content: "证明根号2是无理数"}},
			want:     "advanced",
		},
		{
			name:     "机器学习",
			messages: []relaymodel.Message{{Role: "user", Content: "用机器学习做文本分类"}},
			want:     "advanced",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cc.Classify(tt.messages)
			if got != tt.want {
				t.Errorf("Classify() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestContentClassifier_Classify_BasicRequests(t *testing.T) {
	cc := NewContentClassifier()

	tests := []struct {
		name     string
		messages []relaymodel.Message
		want     string
	}{
		{
			name:     "普通问答",
			messages: []relaymodel.Message{{Role: "user", Content: "今天天气怎么样？"}},
			want:     "basic",
		},
		{
			name:     "翻译请求",
			messages: []relaymodel.Message{{Role: "user", Content: "把这段中文翻译成英文"}},
			want:     "basic",
		},
		{
			name:     "办公文案-请假邮件",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我写一封请假邮件"}},
			want:     "basic",
		},
		{
			name:     "简单问候",
			messages: []relaymodel.Message{{Role: "user", Content: "你好"}},
			want:     "basic",
		},
		{
			name:     "周报",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我写一份本周的周报"}},
			want:     "basic",
		},
		{
			name:     "总结文档",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我总结一下这份文档"}},
			want:     "basic",
		},
		{
			name:     "写通知",
			messages: []relaymodel.Message{{Role: "user", Content: "帮我写一则公司通知"}},
			want:     "basic",
		},
		{
			name:     "解释概念",
			messages: []relaymodel.Message{{Role: "user", Content: "解释一下什么是区块链"}},
			want:     "basic",
		},
		{
			name:     "如何做某事",
			messages: []relaymodel.Message{{Role: "user", Content: "如何提高工作效率"}},
			want:     "basic",
		},
		{
			name:     "翻译英文",
			messages: []relaymodel.Message{{Role: "user", Content: "translate this to Chinese"}},
			want:     "basic",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := cc.Classify(tt.messages)
			if got != tt.want {
				t.Errorf("Classify() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestContentClassifier_Classify_EmptyMessages(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("空消息列表", func(t *testing.T) {
		got := cc.Classify([]relaymodel.Message{})
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})

	t.Run("空内容消息", func(t *testing.T) {
		got := cc.Classify([]relaymodel.Message{{Role: "user", Content: ""}})
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})

	t.Run("nil消息列表", func(t *testing.T) {
		got := cc.Classify(nil)
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})
}

func TestContentClassifier_Classify_OnlySystemPrompt(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("仅system消息", func(t *testing.T) {
		messages := []relaymodel.Message{
			{Role: "system", Content: "你是一个有帮助的助手"},
		}
		got := cc.Classify(messages)
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})

	t.Run("system+assistant无user", func(t *testing.T) {
		messages := []relaymodel.Message{
			{Role: "system", Content: "你是一个编程助手"},
			{Role: "assistant", Content: "我可以帮你写代码"},
		}
		got := cc.Classify(messages)
		// fallback: 取最后一条消息 (assistant)
		if got == "" {
			t.Error("Classify() should not return empty string")
		}
	})
}

func TestContentClassifier_Classify_MultiTurn(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("多轮对话-最后user决定分类", func(t *testing.T) {
		messages := []relaymodel.Message{
			{Role: "system", Content: "你是一个助手"},
			{Role: "user", Content: "帮我写一段Python代码实现快速排序"},
			{Role: "assistant", Content: "好的，这是快速排序的实现..."},
			{Role: "user", Content: "你好"},
		}
		got := cc.Classify(messages)
		// 最后一条 user 消息是"你好" → basic
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})

	t.Run("多轮对话-最后user是代码请求", func(t *testing.T) {
		messages := []relaymodel.Message{
			{Role: "user", Content: "你好"},
			{Role: "assistant", Content: "你好！有什么可以帮助你的？"},
			{Role: "user", Content: "帮我写一个Go的HTTP服务器"},
		}
		got := cc.Classify(messages)
		// 最后一条是代码请求 → advanced
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("多条user消息取最后一条", func(t *testing.T) {
		messages := []relaymodel.Message{
			{Role: "user", Content: "写一个Python脚本"},
			{Role: "user", Content: "翻译成英文"},
		}
		got := cc.Classify(messages)
		// 最后一条 "翻译成英文" → basic
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q", got, "basic")
		}
	})
}

func TestContentClassifier_Classify_CodeBlocks(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("markdown代码块", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role: "user",
			Content: "请帮我看看这段代码有什么问题：\n```\nfunc main() {\n    fmt.Println(\"hello\")\n}\n```",
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("内联代码def关键字", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role:    "user",
			Content: "这段代码 def my_function 有什么问题？",
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("内联代码func关键字", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role:    "user",
			Content: "这个 func hello() 的语法对吗？",
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("import语句", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role:    "user",
			Content: "这个 import numpy as np 导入了什么？",
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("include语句", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role:    "user",
			Content: "这个 #include <stdio.h> 是什么意思？",
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})
}

func TestContentClassifier_Classify_LongText(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("超长文本无办公关键词", func(t *testing.T) {
		// 构造一个超过2000字符的技术类长文本
		base := "请帮我分析以下技术方案的可行性。"
		for len([]rune(base)) < 2100 {
			base += "我们需要评估系统的可扩展性、性能瓶颈以及安全性方面的考量。"
		}
		messages := []relaymodel.Message{{Role: "user", Content: base}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("超长文本含办公关键词", func(t *testing.T) {
		// 构造一个超过2000字符但包含办公关键词的文本
		base := "请帮我总结一下这个项目的情况。"
		for len([]rune(base)) < 2100 {
			base += "项目的进展情况良好。"
		}
		// "总结" 在 OfficeKeywords 中
		messages := []relaymodel.Message{{Role: "user", Content: base}}
		got := cc.Classify(messages)
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q (长文本+办公关键词应返回basic)", got, "basic")
		}
	})

	t.Run("恰好2000字符", func(t *testing.T) {
		base := ""
		for len([]rune(base)) < 2000 {
			base += "测"
		}
		// 2000 字符，没有 > 2000，所以走默认 basic
		messages := []relaymodel.Message{{Role: "user", Content: base}}
		got := cc.Classify(messages)
		if got != "basic" {
			t.Errorf("Classify() = %q, want %q (恰好2000字符应返回basic)", got, "basic")
		}
	})
}

func TestContentClassifier_Classify_CustomConfig(t *testing.T) {
	t.Run("自定义关键词", func(t *testing.T) {
		cc := &ContentClassifier{
			OfficeKeywords:     []string{"办公"},
			AdvancedKeywords:   []string{"高级"},
			ShortTextThreshold: 50,
			LongTextThreshold:  500,
		}

		tests := []struct {
			name     string
			content  string
			want     string
		}{
			{"高级关键词", "这是一个高级任务", "advanced"},
			{"办公关键词", "这是一个办公任务", "basic"},
			{"长文本超500", "测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试测试", "advanced"},
			{"默认basic", "普通消息", "basic"},
		}

		for _, tt := range tests {
			t.Run(tt.name, func(t *testing.T) {
				got := cc.Classify([]relaymodel.Message{{Role: "user", Content: tt.content}})
				if got != tt.want {
					t.Errorf("Classify() = %q, want %q", got, tt.want)
				}
			})
		}
	})
}

func TestContentCategory(t *testing.T) {
	tests := []struct {
		name     string
		category string
		want     string
	}{
		{"advanced", "advanced", "advanced"},
		{"basic", "basic", "basic"},
		{"未识别", "unknown", "basic"},
		{"空字符串", "", "basic"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ContentCategory(tt.category)
			if got != tt.want {
				t.Errorf("ContentCategory(%q) = %q, want %q", tt.category, got, tt.want)
			}
		})
	}
}

// TestContentClassifier_Classify_MessageContentTypes 测试不同 Content 类型
func TestContentClassifier_Classify_MessageContentTypes(t *testing.T) {
	cc := NewContentClassifier()

	t.Run("Content为字符串数组-提取文本", func(t *testing.T) {
		// relaymodel.Message 的 Content 可以是 []any (多模态内容)
		messages := []relaymodel.Message{{
			Role: "user",
			Content: []any{
				map[string]any{"type": "text", "text": "写一段Python代码实现快速排序"},
			},
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})

	t.Run("Content为混合内容-提取文本部分", func(t *testing.T) {
		messages := []relaymodel.Message{{
			Role: "user",
			Content: []any{
				map[string]any{"type": "image_url", "image_url": map[string]any{"url": "https://example.com/img.png"}},
				map[string]any{"type": "text", "text": "帮我实现一个LRU缓存"},
			},
		}}
		got := cc.Classify(messages)
		if got != "advanced" {
			t.Errorf("Classify() = %q, want %q", got, "advanced")
		}
	})
}
