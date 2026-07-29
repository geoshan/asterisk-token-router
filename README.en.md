# asterisk-token-router

> Internal AI LLM API unified routing management system, based on [One API](https://github.com/songquanpeng/one-api) (MIT).

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?logo=go)](https://go.dev/)

---

## Features

| Module | Description |
|--------|-------------|
| 🔀 **Smart Routing** | Auto-classify requests by content (office tasks → budget models / coding → premium models), or explicit model selection |
| 🔑 **Multi-Model Management** | Unified management of OpenAI, DeepSeek, Claude, Qwen, Kimi and more API keys with load-balanced multi-channel support |
| 👥 **User Management** | User CRUD + tiered permissions + auto-generated `sk-` API keys — one key for all models |
| 💰 **Billing Modes** | Subscription / per-token / free — real-time cost tracking with configurable call limits |
| 📊 **Usage Monitoring** | Three-tier threshold alerts (80%/90%/100%) + automatic circuit breaker + WeChat Work notifications |
| 🩺 **Health Checks** | Periodic channel probing, auto-disable after 3 failures, auto-recovery |
| 🖥️ **Admin Dashboard** | Web console: model management, user management, analytics |

---

## Quick Start

### Requirements

- Go 1.20+
- MySQL 5.7+ or PostgreSQL 9.6+
- Redis 6.0+

### Docker (Recommended)

```bash
docker run -d --name token-router \
  -p 3000:3000 \
  -e SQL_DSN="root:password@tcp(host:3306)/asterisk_token_router?charset=utf8mb4&parseTime=True&loc=Local" \
  -e REDIS_CONN_STRING="redis://host:6379" \
  -e SESSION_SECRET="your-secret-key" \
  -e TZ=Asia/Shanghai \
  -v ./data:/data \
  geoshan/asterisk-token-router:latest
```

### Local Development

```bash
git clone git@github.com:geoshan/asterisk-token-router.git
cd asterisk-token-router
cp .env.example .env  # edit database/redis settings
go mod download && go build -o bin/asterisk-tr .
cd web/default && npm install && npm run build && cd ../..
./bin/asterisk-tr --port 3000 --log-dir ./logs
```

Visit `http://localhost:3000`, default account `root` / `123456`.

---

## Smart Routing

Set `model` to `"auto"` for content-based routing:

| Content Type | Route Target | Example |
|--------------|-------------|---------|
| Code, algorithms | advanced group (e.g. gpt-4o) | "Write a binary search" |
| Deep reasoning | advanced group | "Design a microservice auth scheme" |
| Translation, Q&A | basic group (e.g. gpt-4o-mini) | "Translate this to English" |
| Office tasks | basic group | "Write a weekly report" |

---

## Usage Alerts

```
80% usage → 🟡 Warning: WeChat Work notification to user
90% usage → 🟠 Critical: notify user + department head
100% usage → 🔴 Circuit breaker: service suspended, notify admin
```

Blocked users receive `429` responses. Monthly auto-reset.

---

## API Endpoints

### User-facing (OpenAI-compatible)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/chat/completions` | Chat completion (SSE streaming), `model:"auto"` for smart routing |
| GET | `/v1/models` | List available models |

### Admin API

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/channel/` | Channel management |
| GET/POST | `/api/user/` | User management |
| GET/POST | `/api/token/` | API key management |
| GET | `/admin/alerts` | Alert history |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Requirements](Docs/REQUIREMENTS.md) | 9 detailed use cases with Mermaid diagrams |
| [Implementation Plan](Docs/IMPLEMENTATION_PLAN.md) | 8 phases, 26 tasks |
| [Test Plan](Docs/TEST_PLAN.md) | Unit/integration/performance/security tests |
| [Architecture](Docs/ARCHITECTURE.md) | Design decisions and extension guide |
| [Test Report](Docs/TEST_REPORT.md) | 36+ test cases, 100% pass rate |

---

## License

Based on [One API](https://github.com/songquanpeng/one-api) (MIT), released under **Apache 2.0**.

---

## Links

- Upstream: [One API](https://github.com/songquanpeng/one-api)
- Repository: [GitHub](https://github.com/geoshan/asterisk-token-router) | [Gitee](https://gitee.com/geoshan/asterisk-token-router)
