import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Message } from 'semantic-ui-react';
import { useSearchParams } from 'react-router-dom';
import { API, showSuccess, showError } from '../../helpers';

const RequestQuota = () => {
  const [searchParams] = useSearchParams();
  const tokenId = searchParams.get('tokenId');
  const [token, setToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (tokenId) {
      API.get('/api/token/' + tokenId).then(res => {
        if (res.data?.success) setToken(res.data.data);
      }).catch(() => {});
    }
  }, [tokenId]);

  const getRequestType = () => {
    if (!token) return '';
    if (token.monthly_quota > 0 && token.remain_quota <= 0) return '月度额度已用完，申请临时增加月度额度';
    if (token.remain_quota <= 0) return '总额度已用完，申请增加新额度';
    return '申请增加额度';
  };

  const submit = () => {
    if (!amount) { showError('请填写额度'); return; }
    setSubmitted(true);
    showSuccess('已提交额度申请，请等待管理员处理');
  };

  if (!tokenId) return <Message warning>请从【我的令牌】页面点击申请按钮</Message>;

  return (
    <div className='dashboard-container'>
      <Card fluid>
        <Card.Content>
          <Card.Header>申请增加额度</Card.Header>
          {submitted ? (
            <Message positive>申请已提交，管理员审核后将为您增加额度。</Message>
          ) : token ? (
            <Form>
              <p><strong>令牌：</strong>{token.name || '未命名'}</p>
              <p>当前剩余额度：{token.remain_quota} | 月度额度：{token.monthly_quota || '不限'}</p>
              <Message info>{getRequestType()}</Message>
              <Form.Input label='申请额度' type='number' placeholder='输入金额' value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Form.TextArea label='申请原因（可选）' value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button primary onClick={submit}>提交申请</Button>
            </Form>
          ) : <p>加载中...</p>}
        </Card.Content>
      </Card>
    </div>
  );
};

export default RequestQuota;
