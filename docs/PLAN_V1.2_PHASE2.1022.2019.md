# ATR V1.2 阶段 2 改造方案 — 计费精简与口径统一

> **版本**: v1.0
> **日期**: 2026-10-22 20:19
> **依据**: [REQUIREMENTS.md](REQUIREMENTS.md) v2.4 §10.2 + [TECH_DESIGN.1020.1840.md](TECH_DESIGN.1020.1840.md) §3.2 + 阶段2盘点报告
> **状态**: 待用户确认后开工

---

## 📋 修订历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-10-22 | 初版：三项用户决策落地（¥/M 口径统一、图片音频统一、遗留业务全删） |

---

## 0. 用户决策（2026-10-22 确认）

1. **计费口径统一为 ¥/M token** —— 梳理所有矛盾点，全部改成 ¥/百万 token
2. **图片/音频统一到同一体系** —— 虽当前无实际使用，但渠道中可能存在图片/音频模型，价格来源与文本统一
3. **遗留业务全部删除** —— 兑换码、邀请、用户充值全部移除

---

## 1. 计费口径统一（核心）

### 1.1 现状矛盾（实测数据）

| 位置 | 语义 | 证据 |
|------|------|------|
| `model/channel.go:52-53` 字段注释 | `price_in/price_out` = **元/千 token** | 注释明文 |
| `model/channel.go:277` `GetModelPrice` fallback | 直接返回 `PriceIn/PriceOut`，无单位换算 | 代码 |
| `relay/controller/helper.go:113` 计费 | 按 **¥/M token** 用（`tokens × price / 1e6`） | 代码 |
| `channels.model_prices` JSON | 按 **¥/M token**（如 `{"deepseek-v4-pro":{"input":3,"output":6}}`） | v1.1.29 实测验证 |

**实测存量值**：

| 渠道 | price_in | price_out | 按元/千解读 | 按 ¥/M 解读 | DeepSeek 官方参考 |
|------|---------:|----------:|------------|------------|------------------|
| DeepSeek V3 | 0.001 | 0.002 | ¥1 / ¥2 per M ✅ | ¥0.001 / ¥0.002 per M ❌ | ¥1 / ¥2 per M |
| 千问 Qwen-Max | 0.02 | 0.06 | ¥20 / ¥60 per M | ¥0.02 / ¥0.06 per M | ¥2.4 / ¥9.6 per M |
| Kimi K3 | 0.04 | 0.12 | ¥40 / ¥120 per M | ¥0.04 / ¥0.12 per M | ¥15~60 / M |

**结论**：存量 `price_in/price_out` 是**元/千 token**，但代码按 ¥/M 使用 → **实际少收 1000 倍**。这是真实计费缺陷。

### 1.2 统一目标

```
唯一计费口径：¥ / 百万 token (¥/M token)
存储字段：channels.price_in / channels.price_out / channels.model_prices.* 全部为 ¥/M
计算：quota = ceil(prompt_tokens × input_price / 1e6 + completion_tokens × output_price / 1e6)
内部单位：1e6 quota = ¥1（不变）
```

### 1.3 代码改动清单

| # | 文件:行号 | 改动 |
|:-:|-----------|------|
| 1 | `model/channel.go:52-53` | 注释 `元/千token` → `元/百万token (¥/M token)` |
| 2 | `model/channel.go:277` | `GetModelPrice` 注释补充「返回值单位为 ¥/M token」，逻辑不变 |
| 3 | `relay/billing/ratio/model.go:12-17` | `USD2RMB/USD/MILLI_USD/RMB` 常数随倍率表一并移除 |
| 4 | `relay/controller/helper.go:113` | 已是 ¥/M 口径，仅补注释 |
| 5 | `common/utils.go` `LogQuota` | 已是 `¥%.2f ÷ 1e6`，不变 |
| 6 | 前端 `web/default/src/components/EditChannel.js` | 价格标签/提示统一「元/百万 token」（v1.1.0 后 price_in/out 已隐藏，主要核对 model_prices 表格的标签） |

### 1.4 数据迁移（关键，含回滚）

```sql
-- 【必须先备份】
CREATE TABLE channels_bak_1022 AS SELECT * FROM channels;

-- 【迁移】元/千token → 元/百万token（×1000）
UPDATE channels
SET price_in  = price_in  * 1000,
    price_out = price_out * 1000
WHERE price_in > 0 OR price_out > 0;

-- 【校验】迁移后应与官方价量级一致
SELECT id, name, price_in, price_out FROM channels;

-- 【回滚】
-- UPDATE channels c JOIN channels_bak_1022 b ON c.id=b.id
--   SET c.price_in=b.price_in, c.price_out=b.price_out;
```

**执行顺序（严格）**：
```
① 停服务 → ② 备份 + 迁移数据 → ③ 部署新代码 → ④ 启动 → ⑤ 验证计费
```
⚠️ 顺序错会多收或少收 1000 倍：
- 先改代码后迁移 → 存量数据被当 ¥/M → **少收 1000 倍**
- 先迁移后留旧代码 → 存量数据变大 1000 倍仍按旧式 → **多收 1000 倍**

---

## 2. 图片 / 音频统一（无实际使用，但需口径一致）

### 2.1 现状

| 类型 | 文件:行号 | 当前计算 |
|------|-----------|----------|
| 图片 | `relay/controller/image.go:171-182` | `quota = int64(modelRatio × groupRatio × imageCostRatio × 1000) × N` |
| 音频预扣 | `relay/controller/audio.go:57-67` | `preConsumedQuota = len(input) × modelRatio × groupRatio` |
| 音频结算 | `relay/controller/audio.go:219` → `billing.PostConsumeQuota` | 同上，日志「倍率：a × b」 |

两者完全不经过 `model_prices`，100% 依赖硬编码 `ModelRatio` 表。

### 2.2 改造目标

价格来源统一为 `channel.GetModelPrice(model)`（¥/M token），移除对 `ModelRatio/GroupRatio` 的依赖。

| 类型 | 新计算方式 | 说明 |
|------|-----------|------|
| **图片** | `imageTokens = f(尺寸, 质量, N)`；`quota = ceil(imageTokens × inputPrice / 1e6)` | `ImageSizeRatios`（尺寸系数）保留用于估算 imageTokens，不删 |
| **音频 TTS** | `inputTokens ≈ len(text)`；`quota = ceil(inputTokens × inputPrice / 1e6)` | 保守近似（无真实 usage 时） |
| **音频 Whisper** | 优先用响应里的 usage；无则按 `minutes × inputPrice` 折算 | — |

**保留**：`relay/billing/ratio/image.go` 的 `ImageSizeRatios`（尺寸系数表，非倍率体系，见盘点 §E.4-1）。
**移除**：`billing.PostConsumeQuota` 的 `modelRatio/groupRatio` 入参 → 改传 `quota`。

### 2.3 风险

图片/音频当前无实际使用 → 改造后只要**不 panic、能编译、价格来源正确**即达标。测试用例按「配置存在 + 不报错 + 扣费非负」验证即可，不做精细金额核对。

---

## 3. 遗留业务删除

### 3.1 删除清单（用户确认全删）

| # | 业务 | 后端 | 路由 | 前端 |
|:-:|------|------|------|------|
| 1 | **兑换码** | `model/redemption.go`（全 126 行）、`controller/redemption.go`（全 195 行） | `router/api.go:106-115`（6 接口） | `pages/Redemption/`、`components/RedemptionsTable.js`（375 行）、`App.js` 路由 |
| 2 | **用户充值** | `controller/user.go:912-938` `TopUp` | `router/api.go:50` `/api/user/topup` | `pages/TopUp/index.js`（253 行）、`App.js` 路由 |
| 3 | **邀请奖励** | `model/user.go:139-150`（InviterId/Invitee 赠送块） | `router/api.go:45` `/api/user/aff` | `RegisterForm.js:35-37,88-91` 的 `?aff=` 读取 |
| 4 | **充值链接配置** | `config.TopUpLink`、`option.go:73,232-233`、`controller/misc.go:37` | — | `TopUp/index.js` 内 `openTopUpLink` |
| 5 | **设置页邀请奖励项** | — | — | `OperationSetting.js:189-238` 的「邀请奖励」两项 + i18n |

### 3.2 保留项（明确不动）

| 项 | 原因 |
|----|------|
| `AdminTopUp`（`controller/user.go:940-972`，`/api/user/topup/admin`） | 内部唯一「管理员调额度」手段，仅文案改为「调整额度」 |
| `QuotaForNewUser` | 新用户初始额度仍用（管理员建号时显式传值） |
| `users.inviter_id` 字段 | 避免 schema 迁移风险，仅删除赠送逻辑 |
| `redemptions` 表 | 本地 0 行，保留表结构不删（无副作用） |
| `logs` 表 type=2 历史数据 | 存量充值日志，保留 |

### 3.3 删除后影响

- 前端菜单**本来就没有**兑换/充值的入口（`Header.js` 无对应项），删除后仅影响 URL 直达 → 用户无感知
- `redemptions` 本地 0 行，无数据丢失

---

## 4. 倍率链路移除（配合 1~3 步）

按盘点报告 §E.3 的 9 步顺序执行，本方案合并为 5 个批次：

| 批次 | 内容 | 涉及文件 | 可独立验证 |
|:--:|------|----------|:--:|
| **P1** | 前端删倍率设置 UI + i18n | `OperationSetting.js`、`translation.json`（zh/en） | ✅ 页面无空壳 |
| **P2** | 计费口径代码统一 + 数据迁移 | `model/channel.go`、迁移 SQL | ✅ 计费金额正确 |
| **P3** | 图片/音频接入 model_prices | `image.go`、`audio.go`、`billing.go` | ✅ 编译 + 不 panic |
| **P4** | 删倍率数据与配置 + 解耦隐式依赖 | `ratio/model.go`、`ratio/group.go`、`option.go`、`controller/group.go:11`、`relay/adaptor/openai/token.go:38` | ✅ 编译通过 |
| **P5** | 删遗留业务 | 见 §3.1 | ✅ 编译 + 页面正常 |

**P4 的前置解耦**（否则编译失败）：
1. `controller/group.go:11` 遍历 `billingratio.GroupRatio` → 改为 `SELECT DISTINCT group FROM abilities` 或保留一个精简的分组枚举
2. `relay/adaptor/openai/token.go:38` 遍历 `billingratio.ModelRatio` 初始化 tiktoken encoder → 改为按模型名前缀判断（`gpt-4*/gpt-3.5*/o1*`）

---

## 5. 测试用例更新计划（开工前先定稿）

### 5.1 需修订的现有用例

| TC 编号 | 修订内容 |
|---------|----------|
| `TC-CH-02` 添加渠道 | 价格字段单位改为「元/百万 token」，预期值同步调整 |
| `TC-CH-04` 编辑渠道 | 同上 |
| `TC-SET-02` 运营设置—倍率设置 | **改为「倍率设置已移除」验证**：页面无该区块 |
| `TC-SET-03` QuotaPerUnit | 保持（金额制不变），补充与 ¥/M 口径的关系说明 |
| `TC-API-01~05` 模型调用 | 补充计费金额断言（按 ¥/M 计算后的期望值） |
| `TC-FOOT-*` / `TC-MENU-*` | 菜单项数量可能变化（若删了菜单项） |

### 5.2 需新增的用例

| TC 编号 | 描述 |
|---------|------|
| `TC-BILL-01` | 计费金额正确性：调用 N tokens，核对扣费 = tokens × ¥/M ÷ 1e6 |
| `TC-BILL-02` | `price_in/price_out` 单位验证：渠道配 ¥3/M，1M token 应扣 ¥3 |
| `TC-BILL-03` | `model_prices` 优先级：配了 model_prices 时忽略 price_in/out |
| `TC-BILL-04` | `model_prices` fallback：未配时用 price_in/out（同为 ¥/M） |
| `TC-BILL-05` | 免费渠道（billing_mode=2）不计费 |
| `TC-BILL-06` | 未知模型不再按 modelRatio=30 静默高估（应报错或按 0 处理） |
| `TC-IMG-01` | 图片模型价格来源为 model_prices（不报错、扣费非负） |
| `TC-AUD-01` | 音频模型价格来源为 model_prices（不报错、扣费非负） |
| `TC-DEL-01` | 兑换码 API/页面已移除（404 或路由不存在） |
| `TC-DEL-02` | 用户充值页已移除（URL 直达 404） |
| `TC-DEL-03` | `/api/user/aff` 已移除 |
| `TC-SET-05` | 设置页无「倍率设置」区块、无「邀请奖励」项 |
| `TC-ADMIN-01` | `AdminTopUp` 保留可用（管理员调额度） |

**合计**：修订 6+ 例，新增 13 例。

---

## 6. 风险与回滚

| 风险 | 等级 | 缓解 |
|------|:--:|------|
| 口径迁移顺序错 → 计费差 1000 倍 | 🔴 | 严格按「停服务→备份迁移→部署→启动」；迁移前 `CREATE TABLE channels_bak` |
| 删除倍率 → 图片/音频计费失效 | 🟡 | P3 先接入 model_prices 再 P4 删倍率 |
| `controller/group.go` / `token.go` 隐式依赖 | 🟡 | P4 前先解耦，编译器兜底 |
| 遗留业务删除涉及前端多处 | 🟡 | 分批删 + 每批 `npm run build` 验证 |
| 生产渠道未配 model_prices | 🟡 | 部署前先核对生产 `channels` 表 |

**整体回滚**：`git revert` 到 `2f0e68e` + `channels` 表从 `channels_bak_1022` 恢复。

---

## 7. 实施顺序（建议）

```
P1（前端删倍率UI，零风险）
  ↓
P2（口径统一 + 数据迁移，需停服窗口）
  ↓
P3（图片音频接入）
  ↓
P4（删倍率 + 解耦）
  ↓
P5（删遗留业务）
  ↓
测试用例全量回归 + 部署
```

每批次完成后 `go build ./...` + `npm run build` 验证，P2 之后必须跑 `TC-BILL-*` 用例核对金额。
