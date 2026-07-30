import React, { useEffect, useState } from 'react';
import { Card, Table, Label, Message } from 'semantic-ui-react';
import { useTranslation } from 'react-i18next';
import { API, showSuccess, showError, copy } from '../../helpers';

const MyToken = () => {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({});

  const loadTokens = async () => {
    try {
      let res = await API.get('/api/token/?p=0&size=50');
      const { success, data } = res.data || {};
      if (success) {
        setTokens(data || []);
      }
    } catch (error) {
      showError('加载失败');
    }
    setLoading(false);
  };

  const loadStatus = async () => {
    try {
      let res = await API.get('/api/status');
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    loadTokens();
    loadStatus();
  }, []);

  const handleCopy = (text, label) => {
    copy(text).then(() => showSuccess(`${label} 已复制`));
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>我的令牌</Card.Header>
          {tokens.length === 0 && !loading && (
            <Message info>暂无令牌，请联系管理员创建。</Message>
          )}
          <Table basic='very' loading={loading}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>名称</Table.HeaderCell>
                <Table.HeaderCell>Key</Table.HeaderCell>
                <Table.HeaderCell>状态</Table.HeaderCell>
                <Table.HeaderCell>已用额度</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tokens.map((token) => (
                <Table.Row key={token.id}>
                  <Table.Cell>{token.name}</Table.Cell>
                  <Table.Cell>
                    <code>sk-{token.key?.substring(0, 8)}...</code>
                    <Label
                      as='a'
                      color='blue'
                      size='mini'
                      style={{ marginLeft: 8, cursor: 'pointer' }}
                      onClick={() => handleCopy(token.key, 'Key')}
                    >
                      复制
                    </Label>
                  </Table.Cell>
                  <Table.Cell>
                    {token.status === 1 ? (
                      <Label color='green'>有效</Label>
                    ) : (
                      <Label color='red'>已吊销</Label>
                    )}
                  </Table.Cell>
                  <Table.Cell>{token.used_quota}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          
          {status.server_address && (
            <Message positive style={{ marginTop: 16 }}>
              <Message.Header>接入信息</Message.Header>
              <p><strong>Base URL:</strong> <code>{status.server_address}</code></p>
              <p><strong>端点:</strong> <code>/v1/chat/completions</code></p>
              <p>
                <strong>示例:</strong>{' '}
                <code>curl {status.server_address}/v1/chat/completions -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d '{`{"model":"qwen-max","messages":[{"role":"user","content":"你好"}]}`}'</code>
              </p>
            </Message>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default MyToken;
