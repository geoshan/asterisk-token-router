# asterisk-token-router 周报

> 周期: 2026-07-29 ~ 2026-07-31
> 当前版本: `1.0.0 build 0731.1601`
> 提交数: **32** commits（`dev` 分支）
> 仓库: [geoshan/asterisk-token-router](https://gitee.com/geoshan/asterisk-token-router)

---

## 一、功能新增

### 1. 渠道组（channel_group）
- 新增 `channel_group` 数据库字段，替代 One API 原 `group` 字段
- 渠道管理页：标签式输入，支持打字新建，选项从已有渠道加载
- 令牌创建/编辑：选择渠道组后自动过滤模型范围
- 渠道列表：「分组」列替换为「渠道组」，空值显示「未分组」

### 2. 令牌管理增强
- **令牌关联用户**：管理员可为其他用户创建/编辑令牌，user_id 正确保存
- **管理员查看全部令牌**：令牌列表不再只显示自己的令牌
- **编辑令牌**：显示用户下拉 + 渠道组下拉
- **月度额度**：Token 表新增 `monthly_quota` 字段，每月 1 日自动重置循环额度

### 3. 我的令牌页面
- 显示完整 API Key（替代原来 sk-***... 截断+复制按钮）
- 新增「模型范围」「剩余额度」「申请额度」列
- 接入信息地址改为 `http://30.1.1.62:8088`

### 4. 额度申请 & 审批
- 普通用户：我的令牌 → 「申请额度」→ 自动识别类型（月度/总额）
- 管理员：「额度审批」菜单 → 列表显示申请人 + 令牌名 + 金额 + 类型 + 原因
- 通过后自动调整令牌额度
- 新建 `quota_requests` 表 + 3 个 API 端点

### 5. 菜单权限优化
- 未登录：仅显示「关于」
- 管理员：隐藏「我的令牌」「额度申请」；取消「兑换」；新增「额度审批」
- 普通用户登录后自动跳转 `/mytoken`

### 6. 首页优化
- 列出已配置的渠道和模型

### 7. 页脚优化
- 系统名称动态化（取自设置）
- One API → 链接到 GitHub 上游
- asterisk-token-router → 链接到 Gitee
- Apache 2.0 协议链接

---

## 二、Bug 修复

| 类别 | Bug | 修复 |
|------|------|------|
| 前端 | 渠道列表 `.split is not a function` | 兼容数组/字符串 |
| 前端 | 添加成功后不跳转列表 | setTimeout + navigate |
| 前端 | `/user/edit` 无 ID 导致 "id为空" | UserContext 回退 + 个人设置带 ID |
| 前端 | Admin 登录后无 ID 报错 | 改为跳转 `/mytoken` |
| 后端 | PUT 令牌时 models 被清空 | 仅传入时更新 |
| 后端 | 编辑他人令牌返回 404 | Admin 降级 `GetTokenById` |
| 后端 | Token.Update 不保存 user_id | Select 加入 user_id |
| 后端 | 总览统计仅当前用户 | Admin 参数穿 0 全量 |
| 后端 | qwen 渠道 404 | 适配器从 Ali 改为 OpenAI 兼容模式 |
| 后端 | `quota_requests` 表未创建 | AutoMigrate 注册 |
| 构建 | `npm run build` 错误被 `tail -1` 隐藏 | 改为 grep 关键输出 |

---

## 三、API 测试验证

| 模型 | Key | 结果 |
|------|------|:--:|
| qwen-max | `sk-rJgZ...` | ✅ |
| qwen-max | `sk-vWxg...` | ✅ |
| deepseek-chat | `sk-rJgZ...` | ✅ |
| deepseek-chat | `sk-vWxg...` | ✅ |

---

## 四、环境配置

| 项 | 值 |
|------|------|
| 系统名称 | Asterisk Token Router |
| ServerAddress | `http://30.1.1.62:8088` |
| QuotaPerUnit | 1（额度:元 1:1） |
| qwen base_url | `https://dashscope.aliyuncs.com/compatible-mode` |

---

## 五、待后续

1. DeepSeek 渠道健康检查失败（需配 base_url）
2. 额度审批「通过」后的通知机制
3. dev → main 合并 + 打 tag
