# ATR 用户额度双字段设计

> **版本**: v1.1.4  
> **状态**: 设计中（待实现）  
> **最后更新**: 2026-08-12

---

## 1. 概述

当前 ATR（asterisk-token-router）v1.1.4 中，**令牌（Token）** 已实现双字段额度模型——`remain_quota`（总额度）+ `monthly_quota`（月度额度，每月1日重置）。**用户（User）** 目前仅有单字段 `quota`（总额度）和 `used_quota`（已用额度），缺少月度额度维度。

本设计将用户额度模型升级为与令牌额度**逻辑镜像**的双字段模型。

---

## 2. 设计目标

### 2.1 用户额度模型

```
用户额度 = 总额度(remain_quota) + 月度额度(monthly_quota, 每月1日重置)
```

| 字段 | 语义 | 0 值含义 | 原有字段 |
|------|------|----------|----------|
| `remain_quota` | 用户总额度，持久化，充值递增 | 无总额度（不能消费） | `quota`（重命名） |
| `monthly_quota` | 用户月度额度，每月1日重置 `remain_quota` 到此值 | 不限（月度额度不生效，仅总额度控制） | **新增** |
| `used_quota` | 用户已用额度 (累计) | — | 已有 |

### 2.2 约束关系

| 约束 | 表达式 |
|------|--------|
| 总额度约束 | `user.remain_quota ≥ SUM(所有令牌消费)` |
| 月度额度约束 | `user.monthly_quota ≥ SUM(所有令牌月度消费)` |

> **说明**: 用户额度是其下所有令牌消费的总闸。用户总额度不足 → 所有令牌拒绝消费；用户月度额度不足 → 当月所有令牌拒绝消费，下月自动恢复。

---

## 3. 与令牌额度的逻辑镜像

令牌（Token）已有的双字段模型：

```go
// model/token.go — 已有
type Token struct {
    RemainQuota    int64  `json:"remain_quota" gorm:"bigint;default:0"`   // 总额度
    MonthlyQuota   int64  `json:"monthly_quota" gorm:"bigint;default:0"`  // 月度额度，0=不限
    UnlimitedQuota bool   `json:"unlimited_quota" gorm:"default:false"`   // 无限额度
    UsedQuota      int64  `json:"used_quota" gorm:"bigint;default:0"`    // 已用额度
}
```

用户（User）目标模型：

```go
// model/user.go — 目标（重命名 quota → remain_quota，新增 monthly_quota）
type User struct {
    // ...existing fields...
    RemainQuota  int64 `json:"remain_quota" gorm:"bigint;default:0"`   // 总额度（原 quota）
    MonthlyQuota int64 `json:"monthly_quota" gorm:"bigint;default:0"`  // 月度额度，0=不限（新增）
    UsedQuota    int64 `json:"used_quota" gorm:"bigint;default:0"`     // 已用额度（已有）
    // ...
}
```

**镜像对应关系**:

| 概念 | 令牌 | 用户 |
|------|------|------|
| 总额度 | `tokens.remain_quota` | `users.remain_quota` |
| 月度额度 | `tokens.monthly_quota` | `users.monthly_quota` |
| 已用额度 | `tokens.used_quota` | `users.used_quota` |
| 月度重置 | `ResetMonthlyQuotas()` → 将 `remain_quota` 重置为 `monthly_quota` | 同上（共用同一 cron） |
| 预消费检查 | `token.RemainQuota >= quota` | `user.RemainQuota >= quota` |
| 消费扣减 | `DecreaseTokenQuota()` | `DecreaseUserQuota()` → 改为 `DecreaseUserRemainQuota()` |

---

## 4. 月度重置机制

### 4.1 已有机制（main.go 第106-115行）

```go
// asterisk-token-router: monthly quota auto-reset
go func() {
    for {
        now := time.Now()
        next := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
        time.Sleep(next.Sub(now))
        affected := model.ResetMonthlyQuotas()
        logger.SysLog(fmt.Sprintf("Monthly quota reset: %d tokens", affected))
    }
}()
```

### 4.2 扩展（用户月度重置）

`ResetMonthlyQuotas()` 扩展为同时重置用户额度：

```go
func ResetMonthlyQuotas() (tokenCount, userCount int64) {
    tokenCount = DB.Model(&Token{}).
        Where("monthly_quota > 0").
        Update("remain_quota", gorm.Expr("monthly_quota")).RowsAffected

    userCount = DB.Model(&User{}).
        Where("monthly_quota > 0").
        Update("remain_quota", gorm.Expr("monthly_quota")).RowsAffected

    return
}
```

---

## 5. 预消费检查流程（PreConsume）

### 5.1 当前流程

```
PreConsumeTokenQuota(tokenId, quota):
  1. Check token.RemainQuota >= quota  → "令牌额度不足"
  2. Check user.Quota >= quota         → "用户额度不足"
  3. DecreaseTokenQuota()              // 扣令牌
  4. DecreaseUserQuota()               // 扣用户
```

### 5.2 升级后流程

```
PreConsumeUserTokenQuota(userId, tokenId, quota):
  1. Check token.MonthlyQuota check:
     if token.monthly_quota > 0 && token.remain_quota < quota
        → "令牌月度额度不足"
     if token.monthly_quota == 0 && token.remain_quota < quota
        → "令牌总额度不足"（原有逻辑）
  
  2. Check user.MonthlyQuota check:
     if user.monthly_quota > 0 && user.remain_quota < quota
        → "用户月度额度不足"
     if user.monthly_quota == 0 && user.remain_quota < quota
        → "用户总额度不足，请充值"
  
  3. DecreaseTokenQuota(tokenId, quota)
  4. DecreaseUserQuota(userId, quota)  // 已改为扣 remain_quota
  5. Update UsedQuota on both
```

---

## 6. 实现清单

### 6.1 Model 层 (`model/user.go`)

| 变更 | 描述 |
|------|------|
| 重命名 `Quota` → `RemainQuota` | json/gorm tag 同步更新 |
| 新增 `MonthlyQuota int64` | `json:"monthly_quota" gorm:"bigint;default:0"` |
| `GetUserQuota()` | 适配 `remain_quota` 列名 |
| `IncreaseUserQuota()` | 更新 `remain_quota` 列 |
| `DecreaseUserQuota()` | 更新 `remain_quota` 列 |
| 新增 `ResetUserMonthlyQuotas()` | 或扩展已有的 `ResetMonthlyQuotas()` |
| `PreConsumeTokenQuota()` | 新增用户月度额度检查 |

### 6.2 Controller 层 (`controller/user.go`)

| 变更 | 描述 |
|------|------|
| `UpdateUser()` | 支持编辑 `monthly_quota` |
| `GetUser()` / `GetAllUsers()` | 返回 `monthly_quota` 和 `remain_quota` |

### 6.3 前端 (`web/default/`)

| 变更 | 描述 |
|------|------|
| 用户编辑页 | 新增 `monthly_quota` 输入框（参考令牌编辑页 `EditToken.js` 第361行） |
| 用户列表/详情 | 展示月度额度信息 |

### 6.4 数据库迁移

```sql
-- 重命名 quota → remain_quota
ALTER TABLE users RENAME COLUMN quota TO remain_quota;

-- 新增月度额度字段
ALTER TABLE users ADD COLUMN monthly_quota BIGINT NOT NULL DEFAULT 0;
```

---

## 7. 边界情况

| 场景 | 行为 |
|------|------|
| `monthly_quota = 0` | 月度额度不生效，仅 `remain_quota` 总额度控制（兼容旧行为） |
| `remain_quota` 不足但 `monthly_quota` 充足 | 拒绝消费 — 总额度是硬上限 |
| 月度重置时 `remain_quota` > `monthly_quota` | 重置为 `monthly_quota`（即余额可能"缩水"，月度额度是上限） |
| 用户被禁用 | 无论额度如何，一律拒绝消费 |

---

## 8. 与令牌的差异

| 维度 | 令牌 | 用户 |
|------|------|------|
| `UnlimitedQuota` 标志 | ✅ 有 | ❌ 无（通过 `monthly_quota=0` 且 `remain_quota` 足够大模拟） |
| 过期时间 | ✅ `ExpiredTime` | ❌ 通过 `Status=Disabled` 模拟 |
| 直接消费入口 | API Key 消费 | 不直接消费，是其下令牌的聚合闸门 |
