# #ATR 渠道熔断 + 缓存计费 + 按模型定价 实施计划

> **For Hermes:** Use atr-testing-methodology — 三agent并行 + 浏览器必测 + 循环修复。
> 里程碑版本: `v1.1.0`

**目标:** 渠道级预警熔断（预充值/月结）、缓存命中计费折扣、渠道按模型细分定价。

**架构:** Channel 扩展 pricing JSON + Usage 补齐缓存字段 + QuotaCheck 改渠道状态检查 + trackUsageForQuota 改按模型取价。

**技术栈:** Go (Gin/GORM) + React (Semantic UI) + MySQL + Redis

---

## Phase 1: 数据模型（后端，零界面影响）

### Task 1.1: Usage 结构体加缓存字段

**文件:** `relay/model/misc.go`

```go
type Usage struct {
    PromptTokens     int `json:"prompt_tokens"`
    CompletionTokens int `json:"completion_tokens"`
    TotalTokens      int `json:"total_tokens"`
    CompletionTokensDetails *CompletionTokensDetails `json:"completion_tokens_details,omitempty"`
    PromptTokensDetails     *PromptTokensDetails     `json:"prompt_tokens_details,omitempty"` // 新增
}

type PromptTokensDetails struct {  // 新增
    CachedTokens int `json:"cached_tokens"`
}
```

**验证:** `go build ./...` 无编译错误。

### Task 1.2: Channel 模型加熔断+定价字段

**文件:** `model/channel.go`

```go
// 新增计费类型常量
const (
    BillingPrePaid  = 0 // 预充值
    BillingPostPaid = 1 // 月结
    BillingFlatRate = 2 // 包月
)

// Channel 新增字段
type Channel struct {
    // ... 现有字段保留 ...

    BillingType    int     `json:"billing_type" gorm:"type:int;default:0"`     // 新增: 0=预充值,1=月结,2=包月
    MonthlyBudget  float64 `json:"monthly_budget" gorm:"default:0"`           // 新增: 月结额度上限(元)
    MonthlyUsed    float64 `json:"monthly_used" gorm:"default:0"`             // 新增: 本月已用(元)
    WarningPct     int     `json:"warning_pct" gorm:"default:80"`             // 新增: 预警阈值%
    AutoDisable    bool    `json:"auto_disable" gorm:"default:true"`          // 新增: 耗尽自动禁用
    ModelPrices    string  `json:"model_prices" gorm:"type:text"`             // 新增: JSON, {"model":{"input":1,"output":2,"cache_input":0.1}}
    
    // 以下旧字段保留兼容
    PriceIn        float64 `json:"price_in" gorm:"default:0"`
    PriceOut       float64 `json:"price_out" gorm:"default:0"`
    BillingMode    int     `json:"billing_mode" gorm:"default:1"`
}
```

**验证:** `go build ./...` + MySQL 自动加列（AutoMigrate）。

### Task 1.3: ModelPrices JSON 辅助方法

**文件:** `model/channel.go`（同文件新增方法）

```go
type ModelPrice struct {
    Input      float64 `json:"input"`        // 元/百万token
    Output     float64 `json:"output"`       // 元/百万token
    CacheInput float64 `json:"cache_input"`  // 缓存命中 元/百万token
}

// GetModelPrice 获某模型定价，找不到回退到 channel.PriceIn/PriceOut
func (c *Channel) GetModelPrice(model string) (input, output, cache float64) {
    if c.ModelPrices == "" {
        return c.PriceIn, c.PriceOut, 0
    }
    var prices map[string]ModelPrice
    if err := json.Unmarshal([]byte(c.ModelPrices), &prices); err != nil {
        return c.PriceIn, c.PriceOut, 0
    }
    if p, ok := prices[model]; ok {
        return p.Input, p.Output, p.CacheInput
    }
    // 没找到该模型的定价 → 取该渠道所有模型的平均价
    var sumIn, sumOut, sumCache float64
    var count int
    for _, p := range prices {
        sumIn += p.Input
        sumOut += p.Output
        sumCache += p.CacheInput
        count++
    }
    if count > 0 {
        return sumIn/float64(count), sumOut/float64(count), sumCache/float64(count)
    }
    return c.PriceIn, c.PriceOut, 0
}
```

**验证:** 单元测试 `model/channel_test.go`。

---

## Phase 2: 渠道熔断核心逻辑

### Task 2.1: 渠道配额 Redis 操作

**文件:** `common/quota.go`（新增函数）

```go
const ChannelBlockedKeyPrefix = "blocked_channel:%d"
const ChannelUsageKeyPrefix = "channel_usage:%d:%s" // channel_usage:<id>:<YYYY-MM>

func IsChannelBlocked(channelId int) bool { /* 同 IsUserBlocked 模式 */ }
func BlockChannel(channelId int) error    { /* 45天TTL */ }
func IncrChannelUsage(channelId int, yearMonth string, cost float64) (float64, error) { /* INCRBYFLOAT */ }
```

### Task 2.2: 渠道告警

**文件:** `common/alert.go`（新增函数）

```go
func CheckChannelAlert(channelId int, billingType int, currentUsage float64, budget float64, balance float64) {
    switch billingType {
    case BillingPrePaid:
        // 余额为0 → 自动禁用
        // 余额 < 预警值 → 告警
    case BillingPostPaid:
        // 80% → 预警
        // 90% → 严重
        // 100% → 熔断+禁用
    case BillingFlatRate:
        // 无需操作
    }
}
```

### Task 2.3: QuotaCheck 中间件扩展

**文件:** `middleware/quota.go`

在现有用户检查后，加渠道检查：
```go
channelId := c.GetInt(ctxkey.ChannelId)  // Distribute 已设置
if channelId > 0 && common.IsChannelBlocked(channelId) {
    c.JSON(503, "channel_unavailable")
    c.Abort()
    return
}
```

### Task 2.4: Distribute 中间件跳过熔断渠道

**文件:** `middleware/distributor.go`

选渠道时排除 status=3（自动禁用）的渠道。

### Task 2.5: trackUsageForQuota 改造 — 按模型定价 + 缓存折价

**文件:** `relay/controller/helper.go`

```go
func trackUsageForQuota(meta *meta.Meta, usage *relaymodel.Usage, promptTokens int, completionTokens int) {
    // 1. 获取数据
    channel, _ := model.GetChannelById(meta.ChannelId, false)
    model := meta.RequestModel
    
    // 2. 取模型定价
    inputPrice, outputPrice, cachePrice := channel.GetModelPrice(model)
    
    // 3. 计算缓存折扣后的有效token
    cachedTokens := 0
    if usage.PromptTokensDetails != nil {
        cachedTokens = usage.PromptTokensDetails.CachedTokens
    }
    uncachedPrompt := promptTokens - cachedTokens
    effectiveTokens := float64(uncachedPrompt)*(inputPrice/inputPrice) + 
                       float64(cachedTokens)*(cachePrice/inputPrice) +
                       float64(completionTokens)*(outputPrice/inputPrice)
    
    // 4. 折算金额
    cost := effectiveTokens / 1000000 * inputPrice
    
    // 5. Redis累计 + 告警
    currentUsage, _ := common.IncrUserQuota(userId, cost)
    common.IncrChannelUsage(channelId, month, cost)
    common.CheckAndAlert(userId, currentUsage, quotaLimit)
    common.CheckChannelAlert(channelId, channel.BillingType, channelUsage, ...)
}
```

### Task 2.6: 月度重置 goroutine 扩展

**文件:** `main.go`

在现有每日重置 token `used_quota_this_month` 的 goroutine 中，加渠道 `monthly_used` 重置。

---

## Phase 3: 前端界面

### Task 3.1: 渠道编辑页 — 模型定价表

**文件:** `web/default/src/pages/Channel/EditChannel.js`

在表单底部（模型列表下方）新增"模型定价"区块：
- 动态表格，行=模型列表中的模型名，列=输入单价/输出单价/缓存价/操作
- `model_prices` JSON 在提交时序列化
- 渠道列表选完模型后自动生成定价行
- 每个输入框默认值从全局设置读取

### Task 3.2: 渠道编辑页 — 计费与熔断区块

**文件:** `web/default/src/pages/Channel/EditChannel.js`

在表单底部新增"计费与熔断"区块：
- `billing_type` 下拉：预充值/月结/包月
- `monthly_budget` 数字输入（billing_type=月结时显示）
- `warning_pct` 数字输入，默认80
- `auto_disable` 开关，默认开启

### Task 3.3: 渠道列表页 — 新增列

**文件:** `web/default/src/components/ChannelsTable.js`

新增列：
- 「计费类型」：预充值/月结/包月
- 「健康」：正常/预警/严重/熔断（带颜色标记）
- 「余额/用量」：预充显示余额，月结显示 `已用/上限`
- Status 列增加 "自动禁用" 状态

### Task 3.4: 日志页—缓存命中列

**文件:** `web/default/src/pages/Log/LogTable.js`

- 新增 "缓存Token" 列
- 模型名和缓存命中率并排显示

---

## Phase 4: 测试案例更新 + 验证

### Task 4.0: 更新测试案例文档

**文件:** `Docs/TEST_CASES.md`

在现有 13 大分类后，新增「**十四、渠道熔断与定价**」：

| # | 用例 | 验证方法 |
|:--:|------|:--:|
| 14-01 | 预充值渠道余额正常时正常路由 | API |
| 14-02 | 预充值渠道余额耗尽自动禁用 | API |
| 14-03 | 预充值渠道余额低于阈值触发告警 | API+日志 |
| 14-04 | 月结渠道用量 80% 触发预警 | API |
| 14-05 | 月结渠道用量 90% 触发严重告警 | API |
| 14-06 | 月结渠道用量 100% 自动禁用 | API |
| 14-07 | 包月渠道不触发任何告警 | API |
| 14-08 | 熔断渠道不可被 Distribute 选中 | API |
| 14-09 | 渠道编辑页显示模型定价表 | 浏览器 |
| 14-10 | 模型定价表正确保存/回显 JSON | 浏览器 |
| 14-11 | 旧渠道（无 model_prices）回退到 price_in/price_out | API |
| 14-12 | 渠道列表页显示计费类型+健康状态 | 浏览器 |
| 14-13 | 不同模型消耗不同单价（deepseek-chat vs reasoner） | API |
| 14-14 | 缓存命中 token 不计入全额费用 | API |
| 14-15 | 日志页显示缓存 token 数 | 浏览器 |
| 14-16 | 月度重置后 channel.monthly_used 归零 | API+DB |

### Task 4.1: 单元测试

- `model/channel_test.go`: GetModelPrice 各场景
- `common/alert_test.go`: CheckChannelAlert 预充/月结/包月

### Task 4.2: 集成测试

按 `atr-testing-methodology` 三agent并行：
- API Agent: 模拟预充余额耗尽→禁用+告警
- Admin Agent: 浏览器验证渠道编辑页定价表+熔断设置
- User Agent: 浏览器验证日志页缓存命中列

### Task 4.3: 部署

`scripts/build.sh` → 部署流水线 stop→copy→start

---

## 文件变更汇总

| 文件 | 操作 | 内容 |
|------|:--:|------|
| `relay/model/misc.go` | 改 | PromptTokensDetails |
| `model/channel.go` | 改 | 7个新字段 + GetModelPrice |
| `common/quota.go` | 改 | Channel 配额 Redis 操作 |
| `common/alert.go` | 改 | CheckChannelAlert |
| `middleware/quota.go` | 改 | 渠道熔断检查 |
| `middleware/distributor.go` | 改 | 跳过熔断渠道 |
| `relay/controller/helper.go` | 改 | 按模型定价+缓存折价 |
| `main.go` | 改 | 月度重置 goroutine |
| `web/.../EditChannel.js` | 改 | 模型定价表+熔断区块 |
| `web/.../ChannelsTable.js` | 改 | 新列+状态 |
| `web/.../LogTable.js` | 改 | 缓存列 |
| `model/log.go` | 改 | cached_tokens 字段 |

---

## 风险

| 风险 | 应对 |
|------|------|
| ModelPrices JSON 迁移导致旧渠道定价丢失 | GetModelPrice 回退到 price_in/price_out |
| 同时改 postConsumeQuota 和 trackUsageForQuota 双重计费 | 确认两者关系：前者扣 quota，后者记 cost |
| 前端表单复杂度大增 | 分段渐进，定价表默认折叠 |
