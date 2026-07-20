# asterisk-token-router

> 内部 AI 大模型 API 统一路由管理系统，基于 [One API](https://github.com/songquanpeng/one-api) (MIT) 二次开发。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?logo=go)](https://go.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-9.7-4479A1?logo=mysql)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-8.8-DC382D?logo=redis)](https://redis.io/)

---

## 功能特性

| 模块 | 功能 |
|------|------|
| 🔀 **智能路由** | 根据请求内容自动分类（办公日常 → 低成本模型 / 代码推理 → 顶级模型），用户也可显式指定模型 |
| 🔑 **多模型管理** | 统一管理 OpenAI、DeepSeek、Claude、豆包、通义千问、文心一言等 API Key，支持多渠道负载均衡 |
| 👥 **用户管理** | 用户 CRUD + 分级权限 + API Key 自动生成（`sk-` 格式），员工一个 Key 访问全部模型 |
| 💰 **计费区分** | 包月 / 按量 / 免费三种模式，按量模型实时计费，包月模型可设调用次数上限 |
| 📊 **用量监控** | 三级阈值告警（80%/90%/100%）+ 自动熔断 + 企业微信通知 |
| 🩺 **健康检查** | 渠道定时探测，3 次失败自动禁用，恢复后自动启用 |
| 🖥️ **管理后台** | Web 控制台：模型管理、用户管理、统计看板 |

---

## 快速开始

### 环境要求

- Go 1.20+
- MySQL 5.7+ 或 PostgreSQL 9.6+
- Redis 6.0+

### Docker 部署（推荐）

```bash
# 拉取镜像
docker pull geoshan/asterisk-token-router:latest

# 使用 MySQL
docker run -d --name token-router \
  -p 3000:3000 \
  -e SQL_DSN="root:password@tcp(host:3306)/asterisk_token_router?charset=utf8mb4&parseTime=True&loc=Local" \
  -e REDIS_CONN_STRING="redis://host:6379" \
  -e SESSION_SECRET="your-secret-key" \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  geoshan/asterisk-token-router:latest
```

### 本地开发

```bash
# 克隆项目
git clone git@github.com:geoshan/asterisk-token-router.git
cd asterisk-token-router

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置数据库和 Redis 连接

# 安装依赖 + 编译
go mod download
go build -o bin/asterisk-tr .

# 构建前端
cd web/default
npm install && npm run build
cd ../..

# 启动
./bin/asterisk-tr --port 3000 --log-dir ./logs
```

访问 `http://localhost:3000`，默认账号 `root` / `123456`。

### 首次配置

1. **登录后台** → 进入「渠道」→ 添加模型 API Key
2. **设置计费模式**：包月 / 按量 / 免费，按量模式需填写单价
3. **创建用户组**（普通员工 / 技术骨干 / AI 研究）
4. **创建用户** → 自动生成 `sk-` Key
5. **员工使用**：`POST http://your-host:3000/v1/chat/completions`，Header `Authorization: Bearer sk-xxx`

---

## 智能路由

用户请求时 `model` 参数传 `"auto"` 或不传，系统自动根据消息内容分类：

| 内容类型 | 路由目标 | 示例 |
|----------|----------|------|
| 代码、算法、架构 | advanced 组 (如 gpt-4o) | "写一个二分查找" |
| 深度推理、分析 | advanced 组 | "设计微服务鉴权方案" |
| 翻译、问答、文案 | basic 组 (如 gpt-4o-mini) | "翻译这段中文" |
| 日常办公 | basic 组 | "帮我写周报" |

显式指定模型名则直通权限校验，不做分类。

---

## 用量告警

```
用量达 80% → 🟡 预警：企业微信通知用户本人
用量达 90% → 🟠 严重：通知用户 + 部门负责人
用量达 100% → 🔴 熔断：暂停服务，通知管理员
```

熔断后用户请求返回 `429`，需管理员手动恢复或提升额度。每月自动重置。

---

## 项目结构

```
asterisk-token-router/
├── main.go                  # 入口
├── common/                  # 公共模块
│   ├── quota.go             # Redis 配额计数
│   ├── alert.go             # 阈值告警逻辑
│   ├── notify.go            # 通知分发
│   └── notifier/            # 通知渠道
│       ├── notifier.go      # Notifier 接口
│       └── wecom.go         # 企业微信实现
├── middleware/
│   ├── content_classifier.go  # 内容分类器
│   ├── auto_router.go         # auto 路由集成
│   ├── distributor.go         # 渠道分发（已修改）
│   └── quota.go               # 熔断中间件
├── model/
│   ├── channel.go           # 渠道模型（已扩展计费字段）
│   ├── alert.go             # 告警记录模型
│   └── health_checker.go    # 渠道健康检查
├── controller/              # API 控制器
├── relay/                   # 请求转发
├── router/                  # 路由注册
├── web/default/             # 前端 (React)
└── Docs/                    # 文档
    ├── REQUIREMENTS.md      # 需求说明书
    ├── IMPLEMENTATION_PLAN.md # 实施计划
    ├── TEST_PLAN.md         # 测试计划
    └── ARCHITECTURE.md      # 架构文档
```

---

## API 端点

### 用户侧（OpenAI 兼容）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | 聊天补全（支持 SSE 流式），`model:"auto"` 智能路由 |
| GET | `/v1/models` | 列出当前用户可用模型 |

### 管理 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/channel/` | 渠道管理 |
| GET/POST | `/api/user/` | 用户管理 |
| GET/POST | `/api/token/` | Key 管理 |
| GET | `/api/log/` | 调用日志 |
| GET | `/admin/alerts` | 告警记录 |
| GET/PUT | `/admin/quota-policy` | 阈值策略 |

---

## 文档

| 文档 | 说明 |
|------|------|
| [需求说明书](Docs/REQUIREMENTS.md) | 9 个详细用例 + Mermaid 图 |
| [实施计划](Docs/IMPLEMENTATION_PLAN.md) | 8 Phase, 26 Tasks |
| [测试计划](Docs/TEST_PLAN.md) | 单元/集成/性能/安全测试 |
| [架构文档](Docs/ARCHITECTURE.md) | 系统设计决策 |

---

## 许可证

本项目基于 [One API](https://github.com/songquanpeng/one-api) (MIT) 二次开发，以 **Apache 2.0** 许可发布。

---

## 相关链接

- 上游项目：[One API](https://github.com/songquanpeng/one-api)
- 仓库：[GitHub](https://github.com/geoshan/asterisk-token-router) | [Gitee](https://gitee.com/geoshan/asterisk-token-router)
