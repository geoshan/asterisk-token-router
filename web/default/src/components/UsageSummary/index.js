import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Message,
  Table,
} from 'semantic-ui-react';
import { API, showError } from '../../helpers';

// V1.2 §10.4 用户用量审计（管理员专用）
// GET /api/usage-summary?user_id=&start=&end=&model_name=
// start/end 为秒级 Unix 时间戳（logs.created_at 存的是秒），user_id=0 表示全部用户

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6); // 近7天（含今天）
  return { start: formatDate(start), end: formatDate(end) };
}

const UsageSummary = () => {
  const range = defaultRange();
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState(0);
  const [startDate, setStartDate] = useState(range.start);
  const [endDate, setEndDate] = useState(range.end);
  const [modelName, setModelName] = useState('');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadUsers = async () => {
    try {
      const res = await API.get('/api/user/?p=0&size=100');
      const { success, message, data } = res.data;
      if (success) {
        const items = Array.isArray(data) ? data : (data && data.items) || [];
        setUsers(
          items.map((u) => ({
            key: u.id,
            text: `${u.username} (ID: ${u.id})`,
            value: u.id,
          }))
        );
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    }
  };

  const loadUsage = async () => {
    setLoading(true);
    try {
      const params = { user_id: userId || 0 };
      if (startDate) {
        params.start = Math.floor(
          new Date(`${startDate}T00:00:00`).getTime() / 1000,
        );
      }
      if (endDate) {
        // 含结束日当天：取次日零点前 1 秒
        params.end = Math.floor(
          (new Date(`${endDate}T00:00:00`).getTime() +
            24 * 3600 * 1000 -
            1000) /
            1000,
        );
      }
      if (modelName) {
        params.model_name = modelName;
      }
      const res = await API.get('/api/usage-summary/', { params });
      const { success, message, data, summary } = res.data;
      if (success) {
        setData(data || []);
        setSummary(summary || null);
      } else {
        showError(message || '加载用量摘要失败');
        setData([]);
        setSummary(null);
      }
    } catch (error) {
      showError(error.message);
      setData([]);
      setSummary(null);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadUsers().then();
    loadUsage().then();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userOptions = [
    { key: 0, text: '全部用户', value: 0 },
    ...users,
  ];

  const renderQuotaCost = (quota) => {
    if (quota === undefined || quota === null) return '-';
    return `¥${(quota / 1000000).toFixed(4)}`;
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>用户用量审计</Card.Header>
          <Card.Description>
            按 用户 × 日期 × 模型 聚合的 Token 用量审计报表（仅管理员可见）
          </Card.Description>
        </Card.Content>
        <Card.Content>
          <Form>
            <Form.Group widths='equal'>
              <Form.Select
                label='用户'
                options={userOptions}
                value={userId}
                onChange={(_, { value }) => setUserId(value)}
                search
                placeholder='全部用户'
              />
              <Form.Input
                label='开始日期'
                type='date'
                value={startDate}
                onChange={(_, { value }) => setStartDate(value)}
              />
              <Form.Input
                label='结束日期'
                type='date'
                value={endDate}
                onChange={(_, { value }) => setEndDate(value)}
              />
              <Form.Input
                label='模型名称'
                placeholder='留空 = 全部模型'
                value={modelName}
                onChange={(_, { value }) => setModelName(value)}
                action={{
                  icon: 'search',
                  onClick: loadUsage,
                  disabled: loading,
                }}
              />
            </Form.Group>
            <Button primary onClick={loadUsage} loading={loading}>
              查询
            </Button>
          </Form>
        </Card.Content>
        <Card.Content>
          {loaded && data.length === 0 && !loading ? (
            <Message>
              <Message.Header>暂无数据</Message.Header>
              <p>当前筛选条件下没有用量记录，请调整筛选条件后重试。</p>
            </Message>
          ) : (
            <Table celled compact unstackable>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>用户</Table.HeaderCell>
                  <Table.HeaderCell>日期</Table.HeaderCell>
                  <Table.HeaderCell>模型</Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>请求数</Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>
                    Prompt Tokens
                  </Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>
                    Completion Tokens
                  </Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>
                    总 Tokens
                  </Table.HeaderCell>
                  <Table.HeaderCell textAlign='right'>费用</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.map((row, idx) => (
                  <Table.Row
                    key={`${row.user_id}-${row.date}-${row.model_name}-${idx}`}
                  >
                    <Table.Cell>
                      {row.username || '-'} (ID: {row.user_id})
                    </Table.Cell>
                    <Table.Cell>{row.date}</Table.Cell>
                    <Table.Cell>{row.model_name || '-'}</Table.Cell>
                    <Table.Cell textAlign='right'>
                      {row.request_count}
                    </Table.Cell>
                    <Table.Cell textAlign='right'>
                      {row.prompt_tokens}
                    </Table.Cell>
                    <Table.Cell textAlign='right'>
                      {row.completion_tokens}
                    </Table.Cell>
                    <Table.Cell textAlign='right'>
                      {row.total_tokens}
                    </Table.Cell>
                    <Table.Cell textAlign='right'>
                      {renderQuotaCost(row.quota_cost)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
              {summary && (
                <Table.Footer>
                  <Table.Row>
                    <Table.HeaderCell colSpan='3'>总计</Table.HeaderCell>
                    <Table.HeaderCell textAlign='right'>
                      {summary.total_requests}
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='right'>
                      {summary.total_prompt}
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='right'>
                      {summary.total_completion}
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='right'>
                      {summary.total_tokens}
                    </Table.HeaderCell>
                    <Table.HeaderCell textAlign='right'>
                      {renderQuotaCost(summary.total_quota_cost)}
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Footer>
              )}
            </Table>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default UsageSummary;
