import React, { useState } from 'react';
import { Card, Header, Message, Modal, Segment, Form, Input, Button, Table, Label, Divider } from 'semantic-ui-react';
import '../../pages/Dashboard/Dashboard.css';

/* ── Mock card constants ── */
const CARD_MAX_WIDTH = 740;
const CARD_STYLE = { maxWidth: CARD_MAX_WIDTH, margin: '0 auto' };

/* ================================================================
   1. Login Page Mock — Card + Form + Input + Button + Divider
   ================================================================ */
const LoginMock = ({ fullScreen }) => (
  <Card fluid style={{ ...CARD_STYLE, maxWidth: fullScreen ? '100%' : 460 }}>
    <Card.Content>
      <Card.Header textAlign="center" style={{ fontSize: 18, marginBottom: 4 }}>
        🔐 登录 ATR
      </Card.Header>
      <Card.Description textAlign="center" style={{ color: 'rgba(0,0,0,.55)', marginBottom: 16 }}>
        欢迎使用 Asterisk Token Router
      </Card.Description>
      <Form>
        <Form.Field>
          <label>用户名</label>
          <Input icon="user" iconPosition="left" placeholder="请输入用户名" fluid />
        </Form.Field>
        <Form.Field>
          <label>密码</label>
          <Input icon="lock" iconPosition="left" type="password" placeholder="请输入密码" fluid />
        </Form.Field>
        <Button color="blue" fluid style={{ marginTop: 8 }}>
          登 录
        </Button>
      </Form>
      <Divider horizontal style={{ margin: '20px 0', color: 'rgba(0,0,0,.4)', fontSize: 12 }}>
        或
      </Divider>
      <div style={{ textAlign: 'center', color: 'rgba(0,0,0,.5)', fontSize: 13 }}>
        如无账号，请联系管理员创建
      </div>
    </Card.Content>
  </Card>
);

/* ================================================================
   2. MyToken Page Mock — Card > Table (名称/Key/状态/模型/额度/操作)
   ================================================================ */
const MyTokenMock = ({ fullScreen }) => (
  <Card fluid style={{ ...CARD_STYLE, maxWidth: fullScreen ? '100%' : CARD_MAX_WIDTH }}>
    <Card.Content>
      <Card.Header>🪙 我的令牌</Card.Header>
    </Card.Content>
    <Card.Content>
      <Table celled striped unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>名称</Table.HeaderCell>
            <Table.HeaderCell>密钥 (脱敏)</Table.HeaderCell>
            <Table.HeaderCell>状态</Table.HeaderCell>
            <Table.HeaderCell>模型范围</Table.HeaderCell>
            <Table.HeaderCell>剩余额度</Table.HeaderCell>
            <Table.HeaderCell>操作</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell><strong>测试</strong></Table.Cell>
            <Table.Cell>
              <code style={{
                background: 'rgba(0,0,0,.05)',
                padding: '3px 8px',
                borderRadius: 3,
                fontFamily: 'Menlo, Monaco, monospace',
                fontSize: 12
              }}>
                sk-RVi****50Ee
              </code>
            </Table.Cell>
            <Table.Cell>
              <Label color="green" horizontal>有效</Label>
            </Table.Cell>
            <Table.Cell style={{ fontSize: 11, color: 'rgba(0,0,0,.7)', lineHeight: 1.6 }}>
              deepseek-chat<br />
              deepseek-reasoner<br />
              deepseek-v4-pro<br />
              deepseek-v4-flash
            </Table.Cell>
            <Table.Cell>
              <span style={{ fontWeight: 700, color: '#1e40af' }}>¥12.00</span>
            </Table.Cell>
            <Table.Cell>
              <Button color="blue" size="tiny" compact>申请额度</Button>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

      <Message positive style={{ marginTop: 14 }}>
        <Message.Header>💡 接入信息</Message.Header>
        <p style={{ marginBottom: 0 }}>
          <strong>Base URL:</strong> <code>https://api.example.com</code><br />
          <strong>端点:</strong> <code>/v1/chat/completions</code>
        </p>
      </Message>
    </Card.Content>
  </Card>
);

/* ================================================================
   3. API Call Mock — black terminal card with <pre> curl + JSON
   ================================================================ */
const ApiUsageMock = ({ fullScreen }) => (
  <Card fluid style={{
    ...CARD_STYLE,
    maxWidth: fullScreen ? '100%' : CARD_MAX_WIDTH,
    background: '#1e293b',
    color: '#f8fafc',
    border: '1px solid #334155',
    boxShadow: '0 4px 14px rgba(0,0,0,.25)'
  }}>
    <Card.Content style={{ borderBottom: '1px solid #334155' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace'
      }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }}></span>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
        <span style={{ marginLeft: 12, color: '#94a3b8' }}>testuser@atr — bash</span>
      </div>
    </Card.Content>
    <Card.Content>
      <pre style={{
        background: 'transparent',
        color: '#e2e8f0',
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        fontSize: 13,
        lineHeight: 1.9,
        margin: 0,
        padding: 0,
        overflowX: 'auto'
      }}>
{`<span style="color:#22c55e;font-weight:700">$</span> <span style="color:#f8fafc">curl https://api.example.com/v1/chat/completions \\</span>
<span style="color:#f8fafc">  -H "Authorization: Bearer sk-RVi****50Ee" \\</span>
<span style="color:#f8fafc">  -H "Content-Type: application/json" \\</span>
<span style="color:#f8fafc">  -d '{</span>
<span style="color:#f8fafc">    "model": "deepseek-chat",</span>
<span style="color:#f8fafc">    "messages": [{"role": "user", "content": "Hello!"}]</span>
<span style="color:#f8fafc">  }'</span>

<span style="color:#94a3b8">{</span>
<span style="color:#94a3b8">  "id": "chatcmpl-abc123",</span>
<span style="color:#94a3b8">  "object": "chat.completion",</span>
<span style="color:#94a3b8">  "created": 1723456789,</span>
<span style="color:#94a3b8">  "model": "deepseek-chat",</span>
<span style="color:#94a3b8">  "choices": [</span>
<span style="color:#94a3b8">    {</span>
<span style="color:#94a3b8">      "index": 0,</span>
<span style="color:#94a3b8">      "message": {</span>
<span style="color:#94a3b8">        "role": "assistant",</span>
<span style="color:#94a3b8">        "content": "Hello! How can I help you today?"</span>
<span style="color:#94a3b8">      },</span>
<span style="color:#94a3b8">      "finish_reason": "stop"</span>
<span style="color:#94a3b8">    }</span>
<span style="color:#94a3b8">  ],</span>
<span style="color:#94a3b8">  "usage": {</span>
<span style="color:#94a3b8">    "prompt_tokens": 12,</span>
<span style="color:#94a3b8">    "completion_tokens": 9,</span>
<span style="color:#94a3b8">    "total_tokens": 21</span>
<span style="color:#94a3b8">  }</span>
<span style="color:#94a3b8">}</span>

<span style="color:#22c55e;font-weight:700">$</span> <span style="display:inline-block;width:8px;height:15px;background:#f8fafc;vertical-align:middle"></span>`}
      </pre>
    </Card.Content>
  </Card>
);

/* ================================================================
   4. Request Quota Mock — Card > Form (金额 Input + 理由 TextArea + 提交 Button)
   ================================================================ */
const RequestQuotaMock = ({ fullScreen }) => (
  <Card fluid style={{ ...CARD_STYLE, maxWidth: fullScreen ? '100%' : CARD_MAX_WIDTH }}>
    <Card.Content>
      <Card.Header>📝 申请额度</Card.Header>
    </Card.Content>
    <Card.Content>
      <Form>
        <Form.Field>
          <label>申请额度 (元)</label>
          <Input
            label={{ content: '¥', color: 'blue' }}
            labelPosition="left"
            placeholder="请输入金额"
            fluid
          />
        </Form.Field>
        <Form.Field>
          <label>申请原因</label>
          <Form.TextArea placeholder="请简要说明用途，如：用于 DeepSeek API 调用测试" rows={3} />
        </Form.Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button color="blue">提交申请</Button>
          <Label color="orange" size="small" style={{ borderRadius: 12 }}>⏳ 待审批</Label>
        </div>
      </Form>
      <Message warning style={{ marginTop: 16 }}>
        <Message.Header>💡 提示</Message.Header>
        <p style={{ marginBottom: 0 }}>审批状态可实时查看。如长时间未审批，请联系管理员。</p>
      </Message>
    </Card.Content>
  </Card>
);

/* ================================================================
   5. Endpoints Table Mock — Card > Table (端点/方法/说明)
   ================================================================ */
const EndpointsMock = ({ fullScreen }) => (
  <Card fluid style={{ ...CARD_STYLE, maxWidth: fullScreen ? '100%' : CARD_MAX_WIDTH }}>
    <Card.Content>
      <Card.Header>🌐 Base URL 与端点</Card.Header>
    </Card.Content>
    <Card.Content>
      <Message info>
        <Message.Header>ℹ️ Base URL</Message.Header>
        <code style={{
          background: 'rgba(0,0,0,.03)',
          padding: '4px 10px',
          borderRadius: 3,
          fontFamily: 'Menlo, Monaco, monospace',
          fontSize: 15,
          color: '#1e40af',
          fontWeight: 700
        }}>
          https://api.example.com
        </code>
      </Message>

      <Table celled striped unstackable>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>方法</Table.HeaderCell>
            <Table.HeaderCell>端点</Table.HeaderCell>
            <Table.HeaderCell>说明</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>
              <Label color="green" horizontal>GET</Label>
            </Table.Cell>
            <Table.Cell>
              <code style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 13 }}>/v1/models</code>
            </Table.Cell>
            <Table.Cell>列出可用模型</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Label color="blue" horizontal>POST</Label>
            </Table.Cell>
            <Table.Cell>
              <code style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 13 }}>/v1/chat/completions</code>
            </Table.Cell>
            <Table.Cell>Chat 对话补全 (兼容 OpenAI)</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Label color="blue" horizontal>POST</Label>
            </Table.Cell>
            <Table.Cell>
              <code style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 13 }}>/v1/completions</code>
            </Table.Cell>
            <Table.Cell>文本补全</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Label color="blue" horizontal>POST</Label>
            </Table.Cell>
            <Table.Cell>
              <code style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 13 }}>/v1/images/generations</code>
            </Table.Cell>
            <Table.Cell>图片生成</Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.Cell>
              <Label color="blue" horizontal>POST</Label>
            </Table.Cell>
            <Table.Cell>
              <code style={{ fontFamily: 'Menlo, Monaco, monospace', fontSize: 13 }}>/v1/embeddings</code>
            </Table.Cell>
            <Table.Cell>文本向量化</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>

      <Message error style={{ marginTop: 16 }}>
        <Message.Header>⚠️ 重要提醒</Message.Header>
        <p style={{ marginBottom: 0 }}>
          所有 API 请求必须在 Header 中携带认证信息：
          <code>Authorization: Bearer &lt;你的令牌密钥&gt;</code>
        </p>
      </Message>
    </Card.Content>
  </Card>
);

/* ── Component key-to-component map for modal ── */
const MOCK_COMPONENT_MAP = {
  login: LoginMock,
  mytoken: MyTokenMock,
  apiusage: ApiUsageMock,
  requestquota: RequestQuotaMock,
  endpoints: EndpointsMock,
};

/* ── Section component ── */
const Section = ({ icon, title, children, mockKey, MockComponent }) => (
  <Card fluid className="chart-card" style={{ marginBottom: 24 }}>
    <Card.Content>
      <Card.Header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 16 }}>
        <span>{icon} {title}</span>
      </Card.Header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ flex: '1 1 320px', fontSize: '15px', lineHeight: 1.8, color: '#334155' }}>
          {children}
        </div>
        {MockComponent && (
          <div style={{ flex: '0 0 auto', maxWidth: '100%', overflow: 'hidden' }}>
            <MockComponent />
          </div>
        )}
      </div>
    </Card.Content>
  </Card>
);

/* ── Thumbnail wrapper: click to enlarge ── */
const ThumbnailCard = ({ mockKey, MockComponent, title }) => (
  <div
    onClick={() => { window._helpModalOpen?.(mockKey); }}
    style={{
      cursor: 'pointer',
      display: 'inline-block',
      maxWidth: '100%',
      transition: 'transform .15s ease',
    }}
    title={`点击放大 — ${title}`}
    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
  >
    <div style={{ pointerEvents: 'none' }}>
      <MockComponent />
    </div>
  </div>
);

/* ================================================================
   Help Page
   ================================================================ */
const Help = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  // Expose openModal via window so ThumbnailCard can call it without prop drilling
  window._helpModalOpen = (key) => {
    setSelectedKey(key);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedKey(null);
  };

  const ModalContent = selectedKey ? MOCK_COMPONENT_MAP[selectedKey] : null;

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

      {/* 1. 登录系统 */}
      <Section
        icon="🔐"
        title="1. 登录系统"
        mockKey="login"
        MockComponent={() => (
          <ThumbnailCard mockKey="login" MockComponent={LoginMock} title="登录页面" />
        )}
      >
        <p><strong>打开 ATR 控制台</strong></p>
        <p>
          在浏览器中访问 ATR 控制台地址，进入登录页面。输入你的
          <strong>用户名</strong>和<strong>密码</strong>后点击「登录」即可进入系统。
        </p>
        <p style={{ marginTop: 16, color: '#64748b', fontSize: 13 }}>
          如无账号，请联系管理员创建。
        </p>
      </Section>

      {/* 2. 获取令牌 */}
      <Section
        icon="🔑"
        title="2. 如何获取令牌"
        mockKey="mytoken"
        MockComponent={() => (
          <ThumbnailCard mockKey="mytoken" MockComponent={MyTokenMock} title="我的令牌" />
        )}
      >
        <p><strong>步骤 1：导航到「我的令牌」</strong></p>
        <p>登录后，点击顶部导航栏的 <code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>🔑 我的令牌</code> 进入令牌管理页面。</p>

        <p style={{ marginTop: 16 }}><strong>步骤 2：查看并复制密钥</strong></p>
        <p>
          你的令牌密钥以脱敏形式展示（<code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>sk-RVi****50Ee</code>），
          仅显示前缀和后缀以保护安全。点击密钥区域即可复制完整密钥到剪贴板。
        </p>

        <p style={{ marginTop: 16 }}><strong>步骤 3：查看可用模型和额度</strong></p>
        <p>
          在令牌列表中可查看当前令牌的<strong>模型范围</strong>和<strong>剩余额度</strong>。
          如需更多额度，点击「申请额度」按钮提交申请。
        </p>

        <Message warning style={{ marginTop: 16, borderRadius: 8 }}>
          <Message.Header>⚠️ 安全提醒</Message.Header>
          <p style={{ marginBottom: 0 }}>
            请妥善保管你的 API 密钥，不要在公开场合（如 GitHub、聊天群）泄露完整密钥。
            密钥仅显示前几位和后几位以保护数据安全。
          </p>
        </Message>
      </Section>

      {/* 3. 使用 API */}
      <Section
        icon="🚀"
        title="3. 如何使用 API"
        mockKey="apiusage"
        MockComponent={() => (
          <ThumbnailCard mockKey="apiusage" MockComponent={ApiUsageMock} title="API 调用示例" />
        )}
      >
        <p>
          ATR 提供与 OpenAI API 完全兼容的接口，你只需将 Base URL 替换为 ATR 的地址即可。
        </p>

        <p style={{ marginTop: 16 }}><strong>认证方式</strong></p>
        <p>在所有 API 请求的 HTTP Header 中加入：</p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`Authorization: Bearer sk-RVi****50Ee`}
        </pre>

        <p style={{ marginTop: 16 }}><strong>示例：Chat 对话补全</strong></p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer sk-RVi****50Ee" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"Hello!"}]}'`}
        </pre>

        <p style={{ marginTop: 16 }}><strong>Python SDK 示例</strong></p>
        <pre style={{ background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, overflowX: 'auto', fontSize: 13 }}>
{`from openai import OpenAI

client = OpenAI(
    api_key="sk-RVi****50Ee",
    base_url="https://api.example.com/v1"
)
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`}
        </pre>
      </Section>

      {/* 4. 申请额度 */}
      <Section
        icon="💰"
        title="4. 如何申请额度"
        mockKey="requestquota"
        MockComponent={() => (
          <ThumbnailCard mockKey="requestquota" MockComponent={RequestQuotaMock} title="申请额度" />
        )}
      >
        <p><strong>步骤 1：进入申请页面</strong></p>
        <p>登录后，在导航菜单中找到「申请额度」入口，点击进入。</p>

        <p style={{ marginTop: 16 }}><strong>步骤 2：填写申请信息</strong></p>
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>申请额度：</strong>输入你需要的额度（以人民币计），例如 <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>¥50.00</code></li>
          <li><strong>申请原因：</strong>简要说明用途，如「用于 DeepSeek API 调用测试」</li>
        </ul>

        <p style={{ marginTop: 16 }}><strong>步骤 3：提交并等待审批</strong></p>
        <p>
          点击「提交申请」后，管理员将审核你的请求。审批通过后额度会自动到账，
          你可以在「我的令牌」页面查看剩余额度。
        </p>

        <Segment color="yellow" style={{ marginTop: 16, borderRadius: 8 }}>
          <strong>💡 提示：</strong>审批状态可在申请页面实时查看。如果长时间未审批，请联系管理员。
        </Segment>
      </Section>

      {/* 5. Base URL + 端点 */}
      <Section
        icon="🌐"
        title="5. Base URL 与端点说明"
        mockKey="endpoints"
        MockComponent={() => (
          <ThumbnailCard mockKey="endpoints" MockComponent={EndpointsMock} title="端点参考" />
        )}
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

        <Table celled striped unstackable style={{ fontSize: 14 }}>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>方法</Table.HeaderCell>
              <Table.HeaderCell>端点</Table.HeaderCell>
              <Table.HeaderCell>说明</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell><span style={{ color: '#22c55e', fontWeight: 600 }}>GET</span></Table.Cell>
              <Table.Cell><code style={{ fontFamily: 'monospace' }}>/v1/models</code></Table.Cell>
              <Table.Cell>列出所有可用模型</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></Table.Cell>
              <Table.Cell><code style={{ fontFamily: 'monospace' }}>/v1/chat/completions</code></Table.Cell>
              <Table.Cell>Chat 对话补全（兼容 OpenAI Chat API）</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></Table.Cell>
              <Table.Cell><code style={{ fontFamily: 'monospace' }}>/v1/completions</code></Table.Cell>
              <Table.Cell>文本补全（兼容 OpenAI Completions API）</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></Table.Cell>
              <Table.Cell><code style={{ fontFamily: 'monospace' }}>/v1/images/generations</code></Table.Cell>
              <Table.Cell>图片生成</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell><span style={{ color: '#3b82f6', fontWeight: 600 }}>POST</span></Table.Cell>
              <Table.Cell><code style={{ fontFamily: 'monospace' }}>/v1/embeddings</code></Table.Cell>
              <Table.Cell>文本向量化</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>

        <Message error style={{ marginTop: 16, borderRadius: 8 }}>
          <Message.Header>⚠️ 重要提醒</Message.Header>
          <p style={{ marginBottom: 0 }}>
            所有 API 请求<strong>必须</strong>在 HTTP Header 中携带认证信息：
            <code style={{ background: '#fef2f2', padding: '2px 6px', borderRadius: 4, marginLeft: 4 }}>
              Authorization: Bearer &lt;你的令牌密钥&gt;
            </code>
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

      {/* ── Full-screen Modal for click-to-enlarge ── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        closeIcon
        style={{ maxWidth: '90vw', width: '90vw' }}
      >
        <Modal.Content>
          <div style={{ textAlign: 'center', padding: 16 }}>
            {ModalContent && <ModalContent fullScreen />}
          </div>
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default Help;
