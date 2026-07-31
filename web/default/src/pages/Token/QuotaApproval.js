import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Label, Message } from 'semantic-ui-react';
import { API, showSuccess, showError } from '../../helpers';

const QuotaApproval = () => {
  const [requests, setRequests] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [tokenNames, setTokenNames] = useState({});
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    setLoading(true);
    API.get('/api/quota-request/').then(res => {
      if (res.data?.success) setRequests(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); 
    API.get('/api/user/?p=0&limit=100').then(r => {
      if (r.data?.data) { let m={}; r.data.data.forEach(u => m[u.id]=u.username); setUserNames(m); }
    });
    API.get('/api/token/?p=0&size=50').then(r => {
      if (r.data?.data) { let m={}; r.data.data.forEach(t => m[t.id]=t.name || '未命名'); setTokenNames(m); }
    });
  }, []);

  const handleApprove = async (id) => {
    await API.put('/api/quota-request/' + id + '?action=approve');
    showSuccess('已通过');
    loadRequests();
  };

  const handleReject = async (id) => {
    await API.put('/api/quota-request/' + id + '?action=reject');
    showSuccess('已拒绝');
    loadRequests();
  };

  return (
    <div className='dashboard-container'>
      <Card fluid>
        <Card.Content>
          <Card.Header>额度审批</Card.Header>
          <Table basic='very' loading={loading}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>申请人</Table.HeaderCell>
                <Table.HeaderCell>令牌</Table.HeaderCell>
                <Table.HeaderCell>金额</Table.HeaderCell>
                <Table.HeaderCell>类型</Table.HeaderCell>
                <Table.HeaderCell>原因</Table.HeaderCell>
                <Table.HeaderCell>操作</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {requests.length === 0 && !loading && (
                <Table.Row><Table.Cell colSpan={6}>暂无待审批申请</Table.Cell></Table.Row>
              )}
              {requests.map(r => (
                <Table.Row key={r.id}>
                  <Table.Cell>{userNames[r.user_id] || r.user_id}</Table.Cell>
                  <Table.Cell>{tokenNames[r.token_id] || 'Token#'+r.token_id}</Table.Cell>
                  <Table.Cell>{r.amount}</Table.Cell>
                  <Table.Cell>{r.req_type === 'monthly' ? '月度' : '总额'}</Table.Cell>
                  <Table.Cell>{r.reason || '-'}</Table.Cell>
                  <Table.Cell>
                    <Button size='mini' color='green' onClick={() => handleApprove(r.id)}>通过</Button>
                    <Button size='mini' color='red' onClick={() => handleReject(r.id)}>拒绝</Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
};

export default QuotaApproval;
