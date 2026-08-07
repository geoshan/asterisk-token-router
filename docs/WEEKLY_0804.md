# #ATR 本周工作总结

> 2026-08-04 · 版本 `v1.0.0 build 0804.1808`

---

## 测试

| 指标 | 数据 |
|------|:--:|
| 测试案例 | 90 项 |
| 已验证 | 86 项 |
| 发现 Bug | 9 个 |
| 遗留缺陷 | 6 个（今天新发现） |

---

## 已修复 (9)

| Bug | 修复 |
|------|------|
| Session 重启掉线 | `SESSION_SECRET` 环境变量固定，代码从 `os.Getenv` 读取 |
| 用户表头误显"渠道组" | 翻译键 `channel.table.group` 单独改为"渠道组"，`group` 恢复"分组" |
| 我的令牌无接入信息 | 去掉条件判断，常显 Base URL + 端点 |
| root 改密码后跳到 `/mytoken` | `LoginForm.js` 按 `role>=10` 判断跳转 `/dashboard` |
| `ctxkey.Role` 始终为 0 | `middleware/auth.go` 从 DB 查 `user.Role` 并注入上下文 |
| admin 删除他人令牌失败 | `DeleteTokenById` 支持 `userId=0` 时按 admin 处理 |
| "注销"→"登出" | `Header.js` toast 提示文字同步修改 |
| 月度额度 JSON 类型错误 | 前端 `parseInt(monthly_quota)` |
| PUT 覆盖 `expired_time=0` | 仅当请求包含该字段时才更新 |

---

## 待修 (6)

| # | 问题 | 严重度 |
|:--:|------|:--:|
| 1 | 版本通知弹窗重复出现（`showNotice` 不支持回调） | 🟡 |
| 2 | 令牌创建名称未保存（前端 name 未传入） | 🟡 |
| 3 | 创建用户无额度字段（默认 ¥999,998 由谁设置待查） | 🟡 |
| 4 | 预消费粒度太粗：`PreConsumedQuota=500` 远超实际消耗 | 🔴 |
| 5 | ¥/百万token 换算比例未同步 | 🟡 |
| 6 | modelRatio 基准仍为 `$0.002/千token`，未调到 ¥/百万token | 🟡 |

---

## 基础设施

| 项目 | 状态 |
|------|:--:|
| Logo v19 绿蓝芯片路由 | ✅ 已部署 |
| 多 agent 并行 (Orca) | ✅ delegation 3 并发 |
| 部署流水线 (LoopX) | ✅ stop→copy→start 三步 |
| Tavily 搜索 | ✅ API key |
| Archify 架构技能 | ✅ |
| 部署经验沉淀 | ✅ `asterisk-token-router-deploy` 技能 |
| 数据库重置脚本 | ✅ |

---

## 新项目

`#ESG` — ESG 智能评级与服务平台已启动市场调研和商业模式设计（`Docs/ESG_PLAN.md`）。
