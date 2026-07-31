import React, { useEffect, useState } from 'react';
import { Card, Form, Button, Message } from 'semantic-ui-react';
import { API, showSuccess, showError } from '../../helpers';

const RequestQuota = () => {
  const [tokens, setTokens] = useState([]);
  const [tokenId, setTokenId] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    API.get('/api/token/?p=0&size=50').then(res => {
      if (res.data?.success) setTokens(res.data.data || []);
    }).catch(() => {});
  }, []);

  const onSelectToken = (id) => {
    setTokenId(id);
    const t = tokens.find(tk => tk.id === parseInt(id));
    setSelectedToken(t || null);
  };

  const getRequestType = () => {
    if (!selectedToken) return '';
    if (selectedToken.monthly_quota > 0) return '月度额度已用完，申请临时增加月度额度';
    if (selectedToken.remain_quota <= 0) return '总额度已用完，申请增加新额度';
    return '申请增加额度';
  };

  const submit = () => {
    if (!tokenId || !amount) { showError('请选择令牌并填写额度'); return; }
    setSubmitted(true);
    showSuccess('已提交额度申请，请等待管理员处理');
  };

  return (
    <div className='dashboard-container'>
      <Card fluid>
        <Card.Content>
          <Card.Header>申请增加额度</Card.Header>
          {submitted ? (
            <Message positive>申请已提交，管理员审核后将为您增加额度。</Message>
          ) : (
            <Form>
              <Form.Dropdown label='选择令牌' placeholder='选择需要申请额度的令牌' fluid selection
                options={tokens.map(t => ({ key: t.id, text: t.name || '未命名', value: t.id }))}
                value={tokenId} onChange={(e, { value }) => onSelectToken(value)} />
              {selectedToken && (
                <Message info>
                  <p>当前剩余额度：{selectedToken.remain_quota} | 月度额度：{selectedToken.monthly_quota || '不限'}</p>
                  <p>{getRequestType()}</p>
                </Message>
              )}
              <Form.Input label='申请额度' type='number' placeholder='输入金额' value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Form.TextArea label='申请原因（可选）' value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button primary onClick={submit}>提交申请</Button>
            </Form>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default RequestQuota;
