# asterisk-token-router 部署问题记录

> 更新日期: 2026-07-30

---

## 🐛 环境适配

| # | 问题 | 原因 | 修复 |
|:--:|------|------|------|
| 1 | MySQL 连不上 | 实际端口 **3307** 非 3306 | 更新 `.env` 和环境检测脚本 |
| 2 | Redis 连不上 | 实际端口 **6389** 非 6379，且非 systemd 管理 | 更新 `.env`，systemd 去掉 Requires |
| 3 | 端口 3000 已占用 | FastGPT Docker 容器占用 | Token Router 改用 **3001** |
| 4 | MySQL 5.6 兼容 | CentOS 7 自带 5.6.39 | `CGO_ENABLED=0` 静态编译已解决 |

---

## 🐛 服务端 Bug

| # | 问题 | 原因 | 修复 |
|:--:|------|------|------|
| 5 | 令牌额度创建后在 Redis 缓存未更新 | `user_quota:1` 缓存残留 | 手动 `redis-cli DEL` |
| 6 | 重启后旧进程通知频繁 | 多次 kill 导致 | 确认当前 PID |
| 7 | 健康检查全失败 | 使用 `/v1/models` 端点，部分厂商不支持 | 改用 `/v1/chat/completions` |
| 8 | 健康检查 Kimi 误报 | 用 Models[0]=\"gpt-3.5-turbo\" 测试 | 改为取 Models **最后一项** |
| 9 | 健康检查 400 误报失败 | 只认 2xx | 放宽为 `>=200 && <500` |
| 10 | 数据库损坏导致服务崩溃 | 误清空 abilities 表 | 重建数据库后重新迁移 |

---

## 🛠️ 功能修订

| # | 改动 | 说明 |
|:--:|------|------|
| 11 | **关闭默认令牌** | 新建用户不再自动创建 "default" 令牌 |
| 12 | **「我的令牌」页面** | 普通用户只读查看，含 BaseURL + Key |
| 13 | **令牌列表用户列** | fetch 用户列表映射显示 |
| 14 | **令牌创建分组选择** | 选分组自动填充该组下所有模型 |
| 15 | **测试按钮模型修复** | 改用渠道 Models 最后一项，跳过默认 OpenAI 模型 |
| 16 | **额度 1:1** | `quota_per_unit=1`，额度=元 |
| 17 | **$ → ¥** | 中文界面所有货币符号改为 ¥ |
| 18 | **品牌更新** | One API → Asterisk Token Router，页脚/版本/系统名 |
| 19 | **版本号格式** | `A.B.C build MMdd.HHMM`，VERSION 文件 + 构建脚本 |
| 20 | **构建脚本** | `./scripts/build.sh linux`，自动 npm build + 编译 |
| 21 | **auto 路由** | basic→qwen-max，advanced→qwen-max |
| 22 | **菜单调整** | 令牌管理 admin:true，充值→额度申请 |
| 23 | **部署用户** | `deploy-tr`，sudo 免密 systemctl，免密 SSH |

---

## 🔧 部署流程

| # | 问题 | 解决方案 |
|:--:|------|------|
| 24 | SCP 被 VPN 阻断 | 暂停 LetsVPN → 传输 → 恢复 |
| 25 | deploy-tr sudo 被拒 | `!requiretty` + `sudoers.d/deploy-tr` |
| 26 | 直接启动不读 .env | 必须用 systemd 启动 |
| 27 | 前端改动不生效 | 必须 `npm run build` 后编译二进制 |
| 28 | SCP 锁文件 | 先 `systemctl stop` 再传 |
| 29 | SSH 管道传文件 | `cat binary \| ssh "cat > target"` 绕过 SCP |

---

## ⚠️ 已知待解决

| # | 问题 |
|:--:|------|
| 1 | 普通用户登录后仍跳到 `/token`（应为 `/mytoken`） |
| 2 | qwen/DeepSeek 渠道 base_url 为空，健康检查跳过 |
| 3 | Kimi 渠道健康检查取模型 gpt-3.5-turbo（待新版验证修复） |
