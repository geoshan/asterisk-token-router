import React, { useState } from 'react';
import { Card, Form, Button, Message } from 'semantic-ui-react';
import { API, showSuccess, showError } from '../../helpers';

const RequestQuota = () => {
  const [tokenKey, setTokenKey] = useState('');
  const [reqType, setReqType] = useState('monthly');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submit = async () => {
    if (!tokenKey || !amount) {
      showError('请填写令牌和额度');
      return;
    }
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
              <Form.Input label='令牌 Key' placeholder='sk-...' value={tokenKey} onChange={(e) => setTokenKey(e.target.value)} />
              <Form.Group inline>
                <label style={{ marginRight: 12 }}>申请类型：</label>
                <Form.Radio label='月度临时额度' value='monthly' checked={reqType === 'monthly'} onChange={() => setReqType('monthly')} />
                <Form.Radio label='增加总额度' value='total' checked={reqType === 'total'} onChange={() => setReqType('total')} />
              </Form.Group>
              <Form.Input label='申请额度' type='number' placeholder='输入金额' value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Form.TextArea label='申请原因' placeholder='简述原因（可选）' value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button primary onClick={submit}>提交申请</Button>
            </Form>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default RequestQuota;
