# #ATR 执行报告

> 版本: v1.0.0 build 0808.0319 · 日期: 2026-08-07~08

---

## 一、测试覆盖

| 分类 | 总数 | 通过 |
|------|:--:|:--:|
| API 模型调用 | 13 | 13 |
| 登录鉴权 | 8 | 8 |
| 菜单权限 | 6 | 6 |
| 渠道管理 | 11 | 11 |
| 令牌管理 | 12 | 12 |
| 我的令牌 | 7 | 7 |
| 额度计费 | 8 | 8 |
| 额度审批 | 9 | 9 |
| 用户管理 | 8 | 8 |
| 总览/日志/设置/其他 | 8 | 8 |
| **合计** | **90** | **90** |

## 二、缺陷修复

| # | 缺陷 | 修复 |
|:--:|------|------|
| 1 | 版本通知弹窗重复 | localStorage 前置设置 |
| 2 | 令牌创建名称未保存 | user_id parseInt + 后端校验 |
| 3 | PreConsumedQuota 500 过粗 | 降为 5 |
| 4 | ¥/百万token 换算未同步 | USD=36 基准重设 |
| 5 | 默认用户额度 0 | QuotaForNewUser=1000000 |
| 6 | 用户额度字段 JSON 类型 | parseInt |
| 7 | 名称校验阻塞 PUT 操作 | 校验仅限 POST |
| 8 | ModelRatio 未适配新基准 | qwen/deepseek 倍率更新 |
| 9 | ctxkey.Role 未注入 | middleware/auth.go |
| 10 | testuser 密码 SHA256→bcrypt | DB 重置脚本修复 |
| 11 | PUT 覆盖 expired_time | 条件赋值 |
| 12 | 前端路由无权限检查 | AdminRoute 组件 |
| 13 | /channel 漏加 AdminRoute | 补全所有 admin 路由 |

## 三、基础设施

| 项目 | 状态 |
|------|:--:|
| SESSION_SECRET 固定 | ✅ deb64cc0... |
| Logo v19 | ✅ 已部署 |
| 多 agent 并行 | ✅ delegation 3 并发 |
| 部署流水线 | ✅ stop→copy→start 三步 |
| Tavily 搜索 | ✅ API key |
| 测试方法论 | ✅ atr-testing-methodology |
| 部署技能 | ✅ asterisk-token-router-deploy |
| Archify 架构 | ✅ 新技能 |
| #ESG 项目 | ✅ 市场调研完成 |
| Hermes 更新 | ⏳ 待用户 approve |

## 四、测试循环统计

| 轮次 | API | 浏览器 | 缺陷 | 部署 |
|:--:|:--:|:--:|:--:|:--:|
| 1 | 7/7 | 9/10 | #12 | 1 |
| 2 | 7/7 | 4/5 | #13 | 1 |
| 3 | 7/7 | 5/5 | 0 | 1 |
