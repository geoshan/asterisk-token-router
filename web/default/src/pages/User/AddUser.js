import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Card } from 'semantic-ui-react';
import { API, showError, showSuccess } from '../../helpers';

const AddUser = () => {
  const { t } = useTranslation();
  const originInputs = {
    username: '',
    display_name: '',
    password: '',
    quota: 0,
    monthly_quota: 0,
  };
  const [inputs, setInputs] = useState(originInputs);
  const { username, display_name, password, quota, monthly_quota } = inputs;

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const submit = async () => {
    if (inputs.username === '' || inputs.password === '') return;
    const res = await API.post(`/api/user/`, {
      ...inputs,
      quota: parseInt(inputs.quota) || 0,
      monthly_quota: parseInt(inputs.monthly_quota) || 0,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(t('user.messages.create_success'));
      setInputs(originInputs);
    } else {
      showError(message);
    }
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>{t('user.add.title')}</Card.Header>
          <Form autoComplete='off'>
            <Form.Field>
              <Form.Input
                label={t('user.edit.username')}
                name='username'
                placeholder={t('user.edit.username_placeholder')}
                onChange={handleInputChange}
                value={username}
                autoComplete='off'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('user.edit.display_name')}
                name='display_name'
                placeholder={t('user.edit.display_name_placeholder')}
                onChange={handleInputChange}
                value={display_name}
                autoComplete='off'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('user.edit.password')}
                name='password'
                type='password'
                placeholder={t('user.edit.password_placeholder')}
                onChange={handleInputChange}
                value={password}
                autoComplete='off'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label='总额度'
                name='quota'
                type='number'
                placeholder='请输入总额度'
                onChange={handleInputChange}
                value={quota}
                autoComplete='off'
                required
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label='月度额度（0=不限）'
                name='monthly_quota'
                type='number'
                placeholder='0 表示不限制月度额度'
                onChange={handleInputChange}
                value={monthly_quota}
                autoComplete='off'
              />
            </Form.Field>
            <Button positive type='submit' onClick={submit}>
              {t('user.edit.buttons.submit')}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default AddUser;
