import React, { useEffect, useState } from 'react';
import { Card, Table, Label, Message } from 'semantic-ui-react';
import { API, showError } from '../../helpers';

const MyToken = () => {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({});

  const loadTokens = async () => {
    try {
      let res = await API.get('/api/token/?p=0&size=50');
      const { success, data } = res.data || {};
      if (success) setTokens(data || []);
    } catch (error) {
      showError('加载失败');
    }
    setLoading(false);
  };

  const loadStatus = async () => {
    try {
      let res = await API.get('/api/status');
      if (res.data?.success) setStatus(res.data.data);
    } catch (error) {}
  };

  useEffect(() => { loadTokens(); loadStatus(); }, []);

  return (
    <div className='dashboard-container'>
      <Card fluid>
        <Card.Content>
          <Card.Header>我的令牌</Card.Header>
          {!loading && tokens.length === 0 && (
            <Message info>暂无令牌，请联系管理员创建。</Message>
          )}
          <Table basic='very' loading={loading}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>名称</Table.HeaderCell>
                <Table.HeaderCell>Key</Table.HeaderCell>
                <Table.HeaderCell>状态</Table.HeaderCell>
                <Table.HeaderCell>模型范围</Table.HeaderCell>
                <Table.HeaderCell>剩余额度</Table.HeaderCell>
                <Table.HeaderCell>操作</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {tokens.map((token) => (
                <Table.Row key={token.id}>
                  <Table.Cell>{token.name}</Table.Cell>
                  <Table.Cell>
                    <code style={{fontSize:11,wordBreak:'break-all'}}>sk-{token.key}</code>
                  </Table.Cell>
                  <Table.Cell>
                    {token.status === 1 ? <Label color='green'>有效</Label> : <Label color='red'>已吊销</Label>}
                  </Table.Cell>
                  <Table.Cell>{(token.models||'-').substring(0,30)}{(token.models||'').length>30?'...':''}</Table.Cell>
                  <Table.Cell>{token.remain_quota}</Table.Cell>
                  <Table.Cell><a href={'/request-quota?tokenId=' + token.id} style={{padding:'4px 12px',fontSize:12,background:'#2185d0',color:'#fff',borderRadius:4,textDecoration:'none'}}>申请额度</a></Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {status.server_address ? (
            <Message positive style={{ marginTop: 16 }}>
              <Message.Header>接入信息</Message.Header>
              <p><strong>Base URL:</strong> <code>{status.server_address || '未设置'}</code></p>
              <p><strong>端点:</strong> <code>/v1/chat/completions</code></p>
            </Message>
          ) : (
            <Message warning style={{ marginTop: 16 }}>
              <Message.Header>接入信息</Message.Header>
              <p>请在系统设置中配置 ServerAddress</p>
            </Message>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default MyToken;
