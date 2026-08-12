# 设计决策日志

## 2026-08-12 (周三)

### 【决策】用户额度升级为双字段模型（remain_quota + monthly_quota）

- **背景**: 令牌（Token）v1.1.4 已实现 `remain_quota` + `monthly_quota` 双字段额度模型并按时月度重置；用户（User）仍为单字段 `quota`，缺少月度额度控制。
- **决定**: 用户额度模型与令牌逻辑镜像——新增 `monthly_quota` 字段，`quota` 重命名为 `remain_quota`。月度额度 > 0 时每月1日自动重置 `remain_quota` 到 `monthly_quota`；monthly_quota = 0 表示不启用月度额度（仅总额度控制，兼容旧行为）。
- **影响**: model/user.go 重命名字段+新增字段；PreConsumeTokenQuota 新增用户月度额度检查；前端用户编辑页新增 monthly_quota 输入；数据库需 RENAME COLUMN + ADD COLUMN 迁移。
- **文档**: [USER_QUOTA_DESIGN.md](./USER_QUOTA_DESIGN.md)

---

## 2026-07-31 (周五)

（暂无）
