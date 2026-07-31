import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Label, Message } from 'semantic-ui-react';
import { API, showSuccess, showError } from '../../helpers';

const QuotaApproval = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = () => {
    setLoading(true);
    API.get('/api/quota-request/').then(res => {
      if (res.data?.success) setRequests(res.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadRequests(); }, []);

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
                <Table.HeaderCell>ID</Table.HeaderCell>
                <Table.HeaderCell>申请金额</Table.HeaderCell>
                <Table.HeaderCell>类型</Table.HeaderCell>
                <Table.HeaderCell>原因</Table.HeaderCell>
                <Table.HeaderCell>操作</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {requests.length === 0 && !loading && (
                <Table.Row><Table.Cell colSpan={5}>暂无待审批申请</Table.Cell></Table.Row>
              )}
              {requests.map(r => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.id}</Table.Cell>
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
