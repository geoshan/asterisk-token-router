import React, { useState } from 'react';
import { Card, Header, Message, Modal, Segment } from 'semantic-ui-react';
import '../../pages/Dashboard/Dashboard.css';

/* ── Inline SVG illustrations (testuser view, sanitized data) ── */

// 1. MyToken page screenshot — token list with desensitized key
const MyTokenSvg = ({ fullScreen }) => (
  <svg
    viewBox="0 0 720 260"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: fullScreen ? '100%' : 720, borderRadius: 8, border: '1px solid #e2e8f0' }}
    role="img"
    aria-label="我的令牌页面 - 令牌列表"
  >
    <rect width="720" height="260" rx="8" fill="#f8fafc" />
    {/* Header bar */}
    <rect x="0" y="0" width="720" height="44" rx="8" fill="#1a56db" />
    <rect x="0" y="36" width="720" height="8" fill="#1a56db" />
    <text x="24" y="28" fill="#fff" fontFamily="sans-serif" fontSize="15" fontWeight="600">🪙 ATR 令牌管理</text>
    {/* Breadcrumb */}
    <text x="24" y="70" fill="#64748b" fontFamily="sans-serif" fontSize="12">🏠 首页 &gt; 我的令牌</text>
    {/* Table header */}
    <rect x="24" y="88" width="672" height="36" rx="6" fill="#f1f5f9" />
    <text x="40" y="111" fill="#475569" fontFamily="sans-serif" fontSize="12" fontWeight="600">名称</text>
    <text x="160" y="111" fill="#475569" fontFamily="sans-serif" fontSize="12" fontWeight="600">密钥 (脱敏)</text>
    <text x="380" y="111" fill="#475569" fontFamily="sans-serif" fontSize="12" fontWeight="600">状态</text>
    <text x="480" y="111" fill="#475569" fontFamily="sans-serif" fontSize="12" fontWeight="600">剩余额度</text>
    <text x="600" y="111" fill="#475569" fontFamily="sans-serif" fontSize="12" fontWeight="600">过期时间</text>
    {/* Row 1 */}
    <rect x="24" y="130" width="672" height="36" rx="4" fill="#ffffff" stroke="#e2e8f0" />
    <text x="40" y="153" fill="#1e293b" fontFamily="monospace" fontSize="12">default-key</text>
    <text x="160" y="153" fill="#64748b" fontFamily="monospace" fontSize="12">sk-ab****-cd12</text>
    <circle cx="430" cy="148" r="5" fill="#22c55e" />
    <text x="442" y="153" fill="#22c55e" fontFamily="sans-serif" fontSize="11">启用</text>
    <text x="480" y="153" fill="#1e293b" fontFamily="monospace" fontSize="12">$4.85</text>
    <text x="600" y="153" fill="#94a3b8" fontFamily="monospace" fontSize="11">2025-12-31</text>
    {/* Row 2 */}
    <rect x="24" y="172" width="672" height="36" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="40" y="195" fill="#1e293b" fontFamily="monospace" fontSize="12">gpt-key</text>
    <text x="160" y="195" fill="#64748b" fontFamily="monospace" fontSize="12">sk-xy****-ef78</text>
    <circle cx="430" cy="190" r="5" fill="#22c55e" />
    <text x="442" y="195" fill="#22c55e" fontFamily="sans-serif" fontSize="11">启用</text>
    <text x="480" y="195" fill="#1e293b" fontFamily="monospace" fontSize="12">$1.20</text>
    <text x="600" y="195" fill="#94a3b8" fontFamily="monospace" fontSize="11">2025-11-15</text>
    {/* Copy tooltip */}
    <rect x="152" y="215" width="130" height="24" rx="4" fill="#1e293b" />
    <text x="217" y="232" fill="#fff" fontFamily="sans-serif" fontSize="11" textAnchor="middle">已复制到剪贴板 ✓</text>
    {/* Footer note */}
    <text x="360" y="252" fill="#94a3b8" fontFamily="sans-serif" fontSize="11" textAnchor="middle">密钥仅显示前4后4位，点击可复制完整密钥</text>
  </svg>
);

// 2. API usage illustration — curl command in a terminal window
const ApiUsageSvg = ({ fullScreen }) => (
  <svg
    viewBox="0 0 720 340"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: fullScreen ? '100%' : 720, borderRadius: 8, border: '1px solid #e2e8f0' }}
    role="img"
    aria-label="API 调用示例 - 终端窗口"
  >
    {/* Terminal window */}
    <rect width="720" height="340" rx="8" fill="#1e293b" />
    {/* Title bar */}
    <rect x="0" y="0" width="720" height="32" rx="8" fill="#334155" />
    <rect x="0" y="24" width="720" height="8" fill="#334155" />
    <circle cx="20" cy="16" r="6" fill="#ef4444" />
    <circle cx="40" cy="16" r="6" fill="#f59e0b" />
    <circle cx="60" cy="16" r="6" fill="#22c55e" />
    <text x="360" y="21" fill="#94a3b8" fontFamily="monospace" fontSize="11" textAnchor="middle">testuser@atr — bash — 80×24</text>
    {/* Prompt 1 */}
    <text x="20" y="58" fill="#22c55e" fontFamily="monospace" fontSize="13">testuser@atr:~$ </text>
    <text x="195" y="58" fill="#f8fafc" fontFamily="monospace" fontSize="13">curl https://api.example.com/v1/models \</text>
    {/* Prompt 1 cont */}
    <text x="36" y="80" fill="#f8fafc" fontFamily="monospace" fontSize="13">-H "Authorization: Bearer sk-ab****-cd12" \</text>
    <text x="36" y="102" fill="#f8fafc" fontFamily="monospace" fontSize="13">-H "Content-Type: application/json"</text>
    {/* Response */}
    <text x="20" y="132" fill="#94a3b8" fontFamily="monospace" fontSize="12">{'{'}</text>
    <text x="36" y="152" fill="#94a3b8" fontFamily="monospace" fontSize="12">"object": "list",</text>
    <text x="36" y="172" fill="#94a3b8" fontFamily="monospace" fontSize="12">"data": [</text>
    <text x="52" y="192" fill="#f8fafc" fontFamily="monospace" fontSize="12">{'{'}</text>
    <text x="68" y="212" fill="#f8fafc" fontFamily="monospace" fontSize="12">"id": "gpt-4o",</text>
    <text x="68" y="232" fill="#f8fafc" fontFamily="monospace" fontSize="12">"object": "model",</text>
    <text x="68" y="252" fill="#f8fafc" fontFamily="monospace" fontSize="12">"owned_by": "openai"</text>
    <text x="52" y="272" fill="#f8fafc" fontFamily="monospace" fontSize="12">{'}'}</text>
    <text x="36" y="292" fill="#94a3b8" fontFamily="monospace" fontSize="12">]</text>
    <text x="20" y="312" fill="#94a3b8" fontFamily="monospace" fontSize="12">{'}'}</text>
    {/* Cursor */}
    <rect x="20" y="324" width="8" height="14" fill="#f8fafc" />
  </svg>
);

// 3. Request Quota page screenshot
const RequestQuotaSvg = ({ fullScreen }) => (
  <svg
    viewBox="0 0 720 260"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: fullScreen ? '100%' : 720, borderRadius: 8, border: '1px solid #e2e8f0' }}
    role="img"
    aria-label="申请额度页面"
  >
    <rect width="720" height="260" rx="8" fill="#f8fafc" />
    {/* Header bar */}
    <rect x="0" y="0" width="720" height="44" rx="8" fill="#1a56db" />
    <rect x="0" y="36" width="720" height="8" fill="#1a56db" />
    <text x="24" y="28" fill="#fff" fontFamily="sans-serif" fontSize="15" fontWeight="600">📝 申请额度</text>
    {/* Breadcrumb */}
    <text x="24" y="70" fill="#64748b" fontFamily="sans-serif" fontSize="12">🏠 首页 &gt; 申请额度</text>
    {/* Form card */}
    <rect x="24" y="88" width="672" height="158" rx="8" fill="#ffffff" stroke="#e2e8f0" />
    {/* Label: amount */}
    <text x="48" y="120" fill="#1e293b" fontFamily="sans-serif" fontSize="13" fontWeight="600">申请额度 (USD)</text>
    {/* Input field */}
    <rect x="48" y="130" width="624" height="36" rx="6" fill="#f1f5f9" stroke="#cbd5e1" />
    <text x="60" y="153" fill="#94a3b8" fontFamily="monospace" fontSize="13">50.00</text>
    {/* Label: reason */}
    <text x="48" y="188" fill="#1e293b" fontFamily="sans-serif" fontSize="13" fontWeight="600">申请原因</text>
    {/* Textarea */}
    <rect x="48" y="198" width="624" height="36" rx="6" fill="#f1f5f9" stroke="#cbd5e1" />
    <text x="60" y="221" fill="#94a3b8" fontFamily="monospace" fontSize="13">用于 GPT-4o API 调用测试</text>
    {/* Submit button */}
    <rect x="48" y="252" width="120" height="32" rx="6" fill="#1a56db" />
    <text x="108" y="273" fill="#fff" fontFamily="sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">提交申请</text>
    {/* Status badge */}
    <rect x="200" y="252" width="100" height="24" rx="12" fill="#fef3c7" />
    <text x="250" y="269" fill="#d97706" fontFamily="sans-serif" fontSize="11" textAnchor="middle" fontWeight="500">待审批</text>
  </svg>
);

// 4. Base URL + endpoints reference card
const EndpointsSvg = ({ fullScreen }) => (
  <svg
    viewBox="0 0 720 280"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', maxWidth: fullScreen ? '100%' : 720, borderRadius: 8, border: '1px solid #e2e8f0' }}
    role="img"
    aria-label="Base URL 和端点说明"
  >
    <rect width="720" height="280" rx="8" fill="#f8fafc" />
    {/* Title */}
    <text x="24" y="36" fill="#1e293b" fontFamily="sans-serif" fontSize="16" fontWeight="700">🌐 Base URL 与端点</text>
    {/* Base URL card */}
    <rect x="24" y="54" width="672" height="50" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
    <text x="44" y="72" fill="#3b82f6" fontFamily="sans-serif" fontSize="12" fontWeight="600">Base URL</text>
    <text x="44" y="93" fill="#1e40af" fontFamily="monospace" fontSize="13" fontWeight="600">https://api.example.com</text>
    {/* Endpoints table */}
    <rect x="24" y="116" width="672" height="24" rx="4" fill="#f1f5f9" />
    <text x="44" y="133" fill="#475569" fontFamily="sans-serif" fontSize="11" fontWeight="600">方法</text>
    <text x="120" y="133" fill="#475569" fontFamily="sans-serif" fontSize="11" fontWeight="600">端点</text>
    <text x="400" y="133" fill="#475569" fontFamily="sans-serif" fontSize="11" fontWeight="600">说明</text>
    {/* /v1/models */}
    <text x="44" y="156" fill="#22c55e" fontFamily="monospace" fontSize="11" fontWeight="600">GET</text>
    <text x="120" y="156" fill="#1e293b" fontFamily="monospace" fontSize="11">/v1/models</text>
    <text x="400" y="156" fill="#64748b" fontFamily="sans-serif" fontSize="11">列出可用模型</text>
    {/* /v1/chat/completions */}
    <text x="44" y="176" fill="#3b82f6" fontFamily="monospace" fontSize="11" fontWeight="600">POST</text>
    <text x="120" y="176" fill="#1e293b" fontFamily="monospace" fontSize="11">/v1/chat/completions</text>
    <text x="400" y="176" fill="#64748b" fontFamily="sans-serif" fontSize="11">Chat 对话补全 (兼容 OpenAI)</text>
    {/* /v1/images/generations */}
    <text x="44" y="196" fill="#3b82f6" fontFamily="monospace" fontSize="11" fontWeight="600">POST</text>
    <text x="120" y="196" fill="#1e293b" fontFamily="monospace" fontSize="11">/v1/images/generations</text>
    <text x="400" y="196" fill="#64748b" fontFamily="sans-serif" fontSize="11">图片生成</text>
    {/* /v1/embeddings */}
    <text x="44" y="216" fill="#3b82f6" fontFamily="monospace" fontSize="11" fontWeight="600">POST</text>
    <text x="120" y="216" fill="#1e293b" fontFamily="monospace" fontSize="11">/v1/embeddings</text>
    <text x="400" y="216" fill="#64748b" fontFamily="sans-serif" fontSize="11">文本向量化</text>
    {/* Auth note */}
    <rect x="24" y="238" width="672" height="32" rx="6" fill="#fef2f2" stroke="#fecaca" />
    <text x="44" y="258" fill="#dc2626" fontFamily="sans-serif" fontSize="12">⚠️ 所有 API 请求必须在 Header 中携带：Authorization: Bearer &lt;你的令牌密钥&gt;</text>
  </svg>
);

/* ── Section component ── */
const Section = ({ icon, title, children, svg }) => (
  <Card fluid className="chart-card" style={{ marginBottom: 24 }}>
    <Card.Content>
      <Card.Header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
        <span>{icon} {title}</span>
      </Card.Header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ flex: '1 1 320px', fontSize: '15px', lineHeight: 1.8, color: '#334155' }}>
          {children}
        </div>
        {svg && (
          <div style={{ flex: '0 0 auto', maxWidth: '100%', overflow: 'hidden' }}>
            {svg}
          </div>
        )}
      </div>
    </Card.Content>
  </Card>
);

/* ── SVG key-to-component map for modal ── */
const SVG_MODAL_MAP = {
  mytoken: MyTokenSvg,
  apiusage: ApiUsageSvg,
  requestquota: RequestQuotaSvg,
  endpoints: EndpointsSvg,
};

/* ── Help Page ── */
const Help = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSvg, setSelectedSvg] = useState(null);

  const openModal = (key) => {
    setSelectedSvg(key);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSvg(null);
  };

  const SvgModalContent = selectedSvg ? SVG_MODAL_MAP[selectedSvg] : null;

  return (
    <div className="dashboard-container">
      <Header as="h2" style={{ marginBottom: 24, fontWeight: 700, color: '#1e293b' }}>
        📖 使用帮助
      </Header>

      <Message info style={{ borderRadius: 10, marginBottom: 24 }}>
        <Message.Header>欢迎使用 ATR (Asterisk Token Router)</Message.Header>
        <p style={{ marginBottom: 0 }}>
          ATR 是一个 LLM API 令牌路由网关，为开发者提供统一的 API 接入点。
          本指南将帮助你快速上手 — 获取令牌、调用 API、管理额度。
        </p>
      </Message>

      {/* 1. 获取令牌 */}
      <Section
        icon="🔑"
        title="1. 如何获取令牌"
        svg={<div onClick={() => openModal('mytoken')} style={{ cursor: 'pointer' }} title="点击放大"><MyTokenSvg /></div>}
      >
        <p><strong>步骤 1：登录系统</strong></p>
        <p>打开 ATR 控制台并登录。如无账号，请联系管理员创建。</p>

        <p style={{ marginTop: 16 }}><strong>步骤 2：导航到「我的令牌」</strong></p>
        <p>登录后，点击顶部导航栏的 <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>🔑 我的令牌</code> 进入令牌管理页面。</p>

        <p style={{ marginTop: 16 }}><strong>步骤 3：查看并复制密钥</strong></p>
        <p>
          你的令牌密钥以脱敏形式展示（仅显示前 4 位和后 4 位，如 <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>sk-ab****-cd12</code>）。
          点击密钥区域即可复制完整密钥到剪贴板。
        </p>

        <Message warning style={{ marginTop: 16, borderRadius: 8 }}>
          <Message.Header>⚠️ 安全提醒</Message.Header>
          <p style={{ marginBottom: 0 }}>请妥善保管你的 API 密钥，不要在公开场合（如 GitHub、聊天群）泄露完整密钥。密钥仅显示前4后4位以保护数据安全。</p>
        </Message>
      </Section>

      {/* 2. 使用 API */}
      <Section
        icon="🚀"
        title="2. 如何使用 API"
        svg={<div onClick={() => openModal('apiusage')} style={{ cursor: 'pointer' }} title="点击放大"><ApiUsageSvg /></div>}
      >
        <p>
          ATR 提供与 OpenAI API 完全兼容的接口，你只需将 Base URL 替换为 ATR 的地址即可。
        </p>

        <p style={{ marginTop: 16 }}><strong>认证方式</strong></p>
        <p>在所有 API 请求的 HTTP Header 中加入：</p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`Authorization: Bearer sk-ab****-cd12`}
        </pre>

        <p style={{ marginTop: 16 }}><strong>示例：列出可用模型</strong></p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`curl https://api.example.com/v1/models \\
  -H "Authorization: Bearer sk-ab****-cd12"`}
        </pre>

        <p style={{ marginTop: 16 }}><strong>示例：Chat 对话补全</strong></p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-ab****-cd12" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello!"}]}'`}
        </pre>

        <p style={{ marginTop: 16 }}><strong>Python SDK 示例</strong></p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="sk-ab****-cd12",
    base_url="https://api.example.com/v1"
)
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}
        </pre>
      </Section>

      {/* 3. 申请额度 */}
      <Section
        icon="💰"
        title="3. 如何申请额度"
        svg={<div onClick={() => openModal('requestquota')} style={{ cursor: 'pointer' }} title="点击放大"><RequestQuotaSvg /></div>}
      >
        <p><strong>步骤 1：进入申请页面</strong></p>
        <p>登录后，在导航菜单中找到「申请额度」入口，点击进入。</p>

        <p style={{ marginTop: 16 }}><strong>步骤 2：填写申请信息</strong></p>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>申请额度：</strong>输入你需要的额度（以美元计），例如 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>50.00</code></li>
          <li><strong>申请原因：</strong>简要说明用途，如「用于 GPT-4o API 调用测试」</li>
        </ul>

        <p style={{ marginTop: 16 }}><strong>步骤 3：提交并等待审批</strong></p>
        <p>点击「提交申请」后，管理员将审核你的请求。审批通过后额度会自动到账，你可以在「我的令牌」页面查看剩余额度。</p>

        <Segment color="yellow" style={{ marginTop: 16, borderRadius: 8 }}>
          <strong>💡 提示：</strong>审批状态可在申请页面实时查看。如果长时间未审批，请联系管理员。
        </Segment>
      </Section>

      {/* 4. Base URL + endpoints */}
      <Section
        icon="🌐"
        title="4. Base URL 与端点说明"
        svg={<div onClick={() => openModal('endpoints')} style={{ cursor: 'pointer' }} title="点击放大"><EndpointsSvg /></div>}
      >
        <p>
          ATR 以 <strong>OpenAI 兼容模式</strong>运行，支持标准 OpenAI 客户端直接接入。
        </p>

        <p style={{ marginTop: 16 }}><strong>Base URL</strong></p>
        <pre style={{ background: '#eff6ff', color: '#1e40af', padding: '12px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
{`https://api.example.com`}
        </pre>
        <p style={{ color: '#64748b', fontSize: 13 }}>实际地址请以系统管理员提供为准。</p>

        <p style={{ marginTop: 16 }}><strong>可用端点</strong></p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>方法</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>端点</th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>说明</th>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ color: '#22c55e', fontWeight: 600 }}>GET</span></td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>/v1/models</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>列出所有可用模型</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>/v1/chat/completions</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>Chat 对话补全（兼容 OpenAI Chat API）</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>/v1/completions</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>文本补全（兼容 OpenAI Completions API）</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>/v1/images/generations</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>图片生成</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontFamily: 'monospace' }}>/v1/embeddings</td>
              <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0' }}>文本向量化</td>
            </tr>
          </thead>
        </table>

        <Message error style={{ marginTop: 16, borderRadius: 8 }}>
          <Message.Header>⚠️ 重要提醒</Message.Header>
          <p style={{ marginBottom: 0 }}>
            所有 API 请求<strong>必须</strong>在 HTTP Header 中携带认证信息：
            <code style={{ background: '#fef2f2', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>Authorization: Bearer &lt;你的令牌密钥&gt;</code>
          </p>
        </Message>

        <p style={{ marginTop: 16 }}>
          <strong>支持的 SDK：</strong>所有兼容 OpenAI API 的 SDK 均可直接使用，只需修改 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>base_url</code> 即可：
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#475569' }}>
          <li>openai (Python)</li>
          <li>openai (Node.js)</li>
          <li>langchain</li>
          <li>llama-index</li>
          <li>以及其他所有 OpenAI 兼容 SDK</li>
        </ul>
      </Section>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '32px 0 16px', color: '#94a3b8', fontSize: 13, borderTop: '1px solid #e2e8f0', marginTop: 16 }}>
        <p>ATR Token Router — 如有问题请联系系统管理员</p>
      </div>

      {/* ── SVG 全屏放大 Modal ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        closeIcon
        style={{ maxWidth: '90vw', width: '90vw' }}
      >
        <Modal.Content>
          <div style={{ textAlign: 'center', padding: 16 }}>
            {SvgModalContent && <SvgModalContent fullScreen />}
          </div>
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default Help;
