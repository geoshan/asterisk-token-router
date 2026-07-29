# asterisk-token-router

> 社内向けAI LLM API統合ルーティング管理システム。[One API](https://github.com/songquanpeng/one-api) (MIT) をベースに開発。

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.26+-00ADD8?logo=go)](https://go.dev/)

---

## 機能

| モジュール | 説明 |
|------------|------|
| 🔀 **スマートルーティング** | リクエスト内容を自動分類（事務→低コストモデル / コーディング→高性能モデル） |
| 🔑 **マルチモデル管理** | OpenAI、DeepSeek、Claude、Qwen、Kimi 等のAPIキーを一元管理、負荷分散対応 |
| 👥 **ユーザー管理** | ユーザーCRUD + 権限制御 + `sk-` 形式APIキー自動発行 |
| 💰 **課金モード** | 定額制 / 従量制 / 無料の3モード、リアルタイムコスト追跡 |
| 📊 **使用量監視** | 3段階アラート（80%/90%/100%）+ 自動サーキットブレーカー + WeCom通知 |
| 🩺 **ヘルスチェック** | 定期的なチャネル監視、3回失敗で自動無効化・復旧 |
| 🖥️ **管理画面** | Webコンソール：モデル管理、ユーザー管理、分析ダッシュボード |

---

## クイックスタート

### 要件

- Go 1.20+
- MySQL 5.7+ または PostgreSQL 9.6+
- Redis 6.0+

### Docker（推奨）

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

`http://localhost:3000` にアクセス、初期アカウント `root` / `123456`。

---

## スマートルーティング

`model` を `"auto"` に設定すると内容ベースの自動ルーティング：

| コンテンツ | ルート先 | 例 |
|-----------|---------|-----|
| コード、アルゴリズム | advanced グループ | "二分探索を実装して" |
| 高度な推論 | advanced グループ | "マイクロサービス認証方式の設計" |
| 翻訳、Q&A | basic グループ | "この文章を英語に翻訳して" |
| 事務処理 | basic グループ | "週報を書いて" |

---

## API

### ユーザー向け（OpenAI互換）

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/v1/chat/completions` | チャット補完（SSE対応）、`model:"auto"` でスマートルーティング |
| GET | `/v1/models` | 利用可能モデル一覧 |

---

## ドキュメント

| ドキュメント | 説明 |
|-------------|------|
| [要件定義](Docs/REQUIREMENTS.md) | 9つのユースケース + Mermaid図 |
| [実装計画](Docs/IMPLEMENTATION_PLAN.md) | 8フェーズ、26タスク |
| [テスト計画](Docs/TEST_PLAN.md) | 単体/統合/性能/セキュリティテスト |
| [アーキテクチャ](Docs/ARCHITECTURE.md) | 設計判断と拡張ガイド |
| [テストレポート](Docs/TEST_REPORT.md) | 36+テストケース、100%合格 |

---

## ライセンス

[One API](https://github.com/songquanpeng/one-api) (MIT) をベースに、**Apache 2.0** で公開。

---

## リンク

- 上流プロジェクト：[One API](https://github.com/songquanpeng/one-api)
- リポジトリ：[GitHub](https://github.com/geoshan/asterisk-token-router) | [Gitee](https://gitee.com/geoshan/asterisk-token-router)
