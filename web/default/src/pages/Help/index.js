import React, { useState } from 'react';
import { Card, Header, Message, Modal, Segment } from 'semantic-ui-react';
import '../../pages/Dashboard/Dashboard.css';

/* ── Inline HTML mock screenshots (testuser view, sanitized data, Semantic UI style) ── */

// 1. MyToken page mock — token list with desensitized key (Semantic UI style)
const MyTokenMock = ({ fullScreen }) => (
  <div style={{
    border: '1px solid rgba(34,36,38,.15)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    maxWidth: fullScreen ? '100%' : 720,
    fontSize: 13,
    fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
  }}>
    {/* Page header — blue bar like ATR menu */}
    <div style={{
      background: 'linear-gradient(135deg, #1a56db, #2563eb)',
      color: '#fff',
      padding: '10px 18px',
      fontWeight: 700,
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      🪙 我的令牌
    </div>
    <div style={{ padding: '16px 18px' }}>
      {/* Breadcrumb */}
      <div style={{ color: 'rgba(0,0,0,.4)', fontSize: 12, marginBottom: 14 }}>
        🏠 首页 <span style={{margin: '0 4px',color:'rgba(0,0,0,.25)'}}>›</span> 我的令牌
      </div>
      {/* Semantic UI basic='very' Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        border: '1px solid rgba(34,36,38,.15)',
        borderRadius: 4,
        fontSize: 12
      }}>
        <thead>
          <tr>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>名称</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>密钥 (脱敏)</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>状态</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>剩余额度</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <strong>default-key</strong>
            </td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <code style={{ fontSize: 11, background: 'rgba(0,0,0,.05)', padding: '3px 8px', borderRadius: 3, fontFamily: 'Menlo, Monaco, monospace', color: '#333', cursor: 'pointer' }}>sk-ab****-cd12</code>
            </td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, background: '#21ba45', color: '#fff', fontSize: 11, fontWeight: 600 }}>有效</span>
            </td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              ¥4.85
            </td>
            <td style={{ padding: '10px 14px', borderBottom: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>申请额度</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '10px 14px', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <strong>gpt-key</strong>
            </td>
            <td style={{ padding: '10px 14px', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <code style={{ fontSize: 11, background: 'rgba(0,0,0,.05)', padding: '3px 8px', borderRadius: 3, fontFamily: 'Menlo, Monaco, monospace', color: '#333', cursor: 'pointer' }}>sk-xy****-ef78</code>
            </td>
            <td style={{ padding: '10px 14px', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 3, background: '#21ba45', color: '#fff', fontSize: 11, fontWeight: 600 }}>有效</span>
            </td>
            <td style={{ padding: '10px 14px', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              ¥1.20
            </td>
            <td style={{ padding: '10px 14px' }}>
              <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>申请额度</span>
            </td>
          </tr>
        </tbody>
      </table>
      {/* Bottom info — like MyToken.js Message positive */}
      <div style={{ marginTop: 14, padding: '12px 18px', background: '#fcfff5', border: '1px solid #a3c293', borderRadius: 5, color: '#2c662d', fontSize: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>💡 接入信息</div>
        <div><strong>Base URL:</strong> <code style={{ background: 'rgba(0,0,0,.05)', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace' }}>https://api.example.com</code></div>
        <div><strong>端点:</strong> <code style={{ background: 'rgba(0,0,0,.05)', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace' }}>/v1/chat/completions</code></div>
      </div>
    </div>
  </div>
);

// 2. API usage mock — curl command in a terminal window
const ApiUsageMock = ({ fullScreen }) => (
  <div style={{
    border: '1px solid rgba(34,36,38,.25)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#1e293b',
    maxWidth: fullScreen ? '100%' : 720,
    fontSize: 13,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    boxShadow: '0 4px 12px rgba(0,0,0,.2)'
  }}>
    {/* Terminal title bar */}
    <div style={{
      background: '#334155',
      color: '#94a3b8',
      padding: '8px 16px',
      fontSize: 11,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
      <span style={{ marginLeft: 12 }}>testuser@atr — bash — 80×24</span>
    </div>
    {/* Terminal body */}
    <div style={{ padding: '14px 20px', fontSize: 12, lineHeight: 1.9 }}>
      {/* Curl command */}
      <div><span style={{ color: '#22c55e', fontWeight: 600 }}>$ </span><span style={{ color: '#f8fafc' }}>curl https://api.example.com/v1/models \</span></div>
      <div><span style={{ color: '#f8fafc' }}>  -H "Authorization: Bearer sk-ab****-cd12" \</span></div>
      <div><span style={{ color: '#f8fafc' }}>  -H "Content-Type: application/json"</span></div>
      {/* JSON response */}
      <div style={{ color: '#94a3b8', marginTop: 8 }}>{'{'}</div>
      <div style={{ color: '#94a3b8', paddingLeft: 16 }}>"object": "list",</div>
      <div style={{ color: '#94a3b8', paddingLeft: 16 }}>"data": [</div>
      <div style={{ paddingLeft: 32, color: '#f8fafc' }}>{'{'}</div>
      <div style={{ paddingLeft: 48, color: '#f8fafc' }}>"id": "gpt-4o",</div>
      <div style={{ paddingLeft: 48, color: '#f8fafc' }}>"object": "model",</div>
      <div style={{ paddingLeft: 48, color: '#f8fafc' }}>"owned_by": "openai"</div>
      <div style={{ paddingLeft: 32, color: '#f8fafc' }}>{'}'}</div>
      <div style={{ paddingLeft: 16, color: '#94a3b8' }}>]</div>
      <div style={{ color: '#94a3b8' }}>{'}'}</div>
      {/* Cursor */}
      <div style={{ marginTop: 6 }}>
        <span style={{ color: '#22c55e', fontWeight: 600 }}>$ </span>
        <span style={{ display: 'inline-block', width: 8, height: 14, background: '#f8fafc', verticalAlign: 'middle', animation: 'none' }}></span>
      </div>
    </div>
  </div>
);

// 3. Request Quota page mock — Form with Semantic UI style
const RequestQuotaMock = ({ fullScreen }) => (
  <div style={{
    border: '1px solid rgba(34,36,38,.15)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    maxWidth: fullScreen ? '100%' : 720,
    fontSize: 13,
    fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
  }}>
    {/* Page header */}
    <div style={{
      background: 'linear-gradient(135deg, #1a56db, #2563eb)',
      color: '#fff',
      padding: '10px 18px',
      fontWeight: 700,
      fontSize: 15,
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      📝 申请额度
    </div>
    <div style={{ padding: '16px 18px' }}>
      {/* Breadcrumb */}
      <div style={{ color: 'rgba(0,0,0,.4)', fontSize: 12, marginBottom: 14 }}>
        🏠 首页 <span style={{margin: '0 4px',color:'rgba(0,0,0,.25)'}}>›</span> 申请额度
      </div>
      {/* Form card — Semantic UI Card style */}
      <div style={{
        border: '1px solid rgba(34,36,38,.15)',
        borderRadius: 5,
        padding: '20px 22px',
        background: '#fff',
        boxShadow: '0 1px 2px rgba(0,0,0,.05)'
      }}>
        {/* Amount field */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: 'rgba(0,0,0,.87)', fontSize: 13 }}>
            申请额度 (元)
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid rgba(34,36,38,.15)',
            borderRadius: 4,
            padding: '9px 14px',
            background: '#fff',
            color: 'rgba(0,0,0,.87)',
            fontSize: 13
          }}>
            ¥ <span style={{ marginLeft: 8, fontFamily: 'Menlo, Monaco, monospace', color: '#555' }}>50.00</span>
          </div>
        </div>
        {/* Reason field */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: 'rgba(0,0,0,.87)', fontSize: 13 }}>
            申请原因
          </label>
          <div style={{
            border: '1px solid rgba(34,36,38,.15)',
            borderRadius: 4,
            padding: '9px 14px',
            background: '#fff',
            color: 'rgba(0,0,0,.55)',
            fontSize: 13,
            minHeight: 32
          }}>
            用于 GPT-4o API 调用测试
          </div>
        </div>
        {/* Submit button + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            padding: '10px 24px',
            background: '#2185d0',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}>
            提交申请
          </button>
          <span style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 12,
            background: '#fff8e1',
            color: '#f57c00',
            fontSize: 12,
            fontWeight: 600,
            border: '1px solid #ffe082'
          }}>
            ⏳ 待审批
          </span>
        </div>
      </div>
      {/* Hint segment */}
      <div style={{
        marginTop: 14,
        padding: '12px 18px',
        background: '#fff8e1',
        border: '1px solid #ffe082',
        borderRadius: 5,
        color: '#795548',
        fontSize: 12,
        lineHeight: 1.5
      }}>
        💡 <strong>提示：</strong>审批状态可实时查看。如长时间未审批，请联系管理员。
      </div>
    </div>
  </div>
);

// 4. Base URL + endpoints reference card — Semantic UI table style
const EndpointsMock = ({ fullScreen }) => (
  <div style={{
    border: '1px solid rgba(34,36,38,.15)',
    borderRadius: 8,
    overflow: 'hidden',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,.06)',
    maxWidth: fullScreen ? '100%' : 720,
    fontSize: 13,
    fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
  }}>
    {/* Title */}
    <div style={{
      background: '#fff',
      padding: '14px 18px',
      fontWeight: 700,
      fontSize: 15,
      borderBottom: '1px solid rgba(34,36,38,.1)',
      color: 'rgba(0,0,0,.87)'
    }}>
      🌐 Base URL 与端点
    </div>
    <div style={{ padding: '16px 18px' }}>
      {/* Base URL info block — like Semantic UI Message info */}
      <div style={{
        padding: '12px 18px',
        background: '#f8ffff',
        border: '1px solid #a9d5de',
        borderRadius: 5,
        color: '#276f86',
        fontSize: 13,
        lineHeight: 1.6,
        marginBottom: 16
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12 }}>ℹ️ Base URL</div>
        <code style={{
          background: 'rgba(0,0,0,.03)',
          padding: '4px 10px',
          borderRadius: 3,
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 13,
          color: '#1e40af',
          fontWeight: 700
        }}>https://api.example.com</code>
      </div>
      {/* Endpoints table — Semantic UI Table style */}
      <table style={{
        width: '100%',
        borderCollapse: 'separate',
        borderSpacing: 0,
        border: '1px solid rgba(34,36,38,.15)',
        borderRadius: 4,
        fontSize: 12
      }}>
        <thead>
          <tr>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>方法</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>端点</th>
            <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 700, color: 'rgba(0,0,0,.87)', background: '#f9fafb', borderBottom: '2px solid rgba(34,36,38,.1)' }}>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, background: '#21ba45', color: '#fff', fontSize: 11, fontWeight: 700 }}>GET</span>
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12 }}>
              /v1/models
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', color: 'rgba(0,0,0,.6)' }}>
              列出可用模型
            </td>
          </tr>
          <tr>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 700 }}>POST</span>
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12 }}>
              /v1/chat/completions
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', color: 'rgba(0,0,0,.6)' }}>
              Chat 对话补全 (兼容 OpenAI)
            </td>
          </tr>
          <tr>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 700 }}>POST</span>
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12 }}>
              /v1/completions
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', color: 'rgba(0,0,0,.6)' }}>
              文本补全
            </td>
          </tr>
          <tr>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 700 }}>POST</span>
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', borderRight: '1px solid rgba(34,36,38,.1)', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12 }}>
              /v1/images/generations
            </td>
            <td style={{ padding: '9px 14px', borderBottom: '1px solid rgba(34,36,38,.1)', color: 'rgba(0,0,0,.6)' }}>
              图片生成
            </td>
          </tr>
          <tr>
            <td style={{ padding: '9px 14px', borderRight: '1px solid rgba(34,36,38,.1)' }}>
              <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 3, background: '#2185d0', color: '#fff', fontSize: 11, fontWeight: 700 }}>POST</span>
            </td>
            <td style={{ padding: '9px 14px', borderRight: '1px solid rgba(34,36,38,.1)', fontFamily: 'Menlo, Monaco, monospace', fontSize: 12 }}>
              /v1/embeddings
            </td>
            <td style={{ padding: '9px 14px', color: 'rgba(0,0,0,.6)' }}>
              文本向量化
            </td>
          </tr>
        </tbody>
      </table>
      {/* Auth warning — like Semantic UI Message error */}
      <div style={{
        marginTop: 14,
        padding: '12px 18px',
        background: '#fff6f6',
        border: '1px solid #e0b4b4',
        borderRadius: 5,
        color: '#9f3a38',
        fontSize: 12,
        lineHeight: 1.5
      }}>
        ⚠️ <strong>重要提醒：</strong>所有 API 请求必须在 Header 中携带 <code style={{ background: 'rgba(0,0,0,.05)', padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace' }}>Authorization: Bearer sk-ab****-cd12</code>
      </div>
    </div>
  </div>
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

/* ── Component key-to-component map for modal ── */
const MOCK_COMPONENT_MAP = {
  mytoken: MyTokenMock,
  apiusage: ApiUsageMock,
  requestquota: RequestQuotaMock,
  endpoints: EndpointsMock,
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

  const SvgModalContent = selectedSvg ? MOCK_COMPONENT_MAP[selectedSvg] : null;

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
        svg={<div onClick={() => openModal('mytoken')} style={{ cursor: 'pointer' }} title="点击放大"><MyTokenMock /></div>}
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
        svg={<div onClick={() => openModal('apiusage')} style={{ cursor: 'pointer' }} title="点击放大"><ApiUsageMock /></div>}
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
        svg={<div onClick={() => openModal('requestquota')} style={{ cursor: 'pointer' }} title="点击放大"><RequestQuotaMock /></div>}
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
        svg={<div onClick={() => openModal('endpoints')} style={{ cursor: 'pointer' }} title="点击放大"><EndpointsMock /></div>}
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
