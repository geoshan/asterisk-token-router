import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Divider,
  Form,
  Header,
  Image,
  Message,
  Modal,
} from 'semantic-ui-react';
import { Link, useNavigate } from 'react-router-dom';
import {
  API,
  copy,
  isAdmin,
  showError,
  showInfo,
  showNotice,
  showSuccess,
} from '../helpers';
import Turnstile from 'react-turnstile';
import { UserContext } from '../context/User';
import { onGitHubOAuthClicked, onLarkOAuthClicked } from './utils';

const PersonalSetting = () => {
  const { t } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  let navigate = useNavigate();

  const [inputs, setInputs] = useState({
    wechat_verification_code: '',
    email_verification_code: '',
    email: '',
    self_account_deletion_confirmation: '',
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [status, setStatus] = useState({});
  const [showWeChatBindModal, setShowWeChatBindModal] = useState(false);
  const [showEmailBindModal, setShowEmailBindModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [systemToken, setSystemToken] = useState('');

  useEffect(() => {
    let status = localStorage.getItem('status');
    if (status) {
      status = JSON.parse(status);
      setStatus(status);
      if (status.turnstile_check) {
        setTurnstileEnabled(true);
        setTurnstileSiteKey(status.turnstile_site_key);
      }
    }
  }, []);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval); // Clean up on unmount
  }, [disableButton, countdown]);

  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };

  const generateAccessToken = async () => {
    const res = await API.get('/api/user/token');
    const { success, message, data } = res.data;
    if (success) {
      setSystemToken(data);
      await copy(data);
      showSuccess(`令牌已重置并已复制到剪贴板`);
    } else {
      showError(message);
    }
  };

  const handleSystemTokenClick = async (e) => {
    e.target.select();
    await copy(e.target.value);
    showSuccess(`系统令牌已复制到剪切板`);
  };

  const bindWeChat = async () => {
    if (inputs.wechat_verification_code === '') return;
    const res = await API.get(
      `/api/oauth/wechat/bind?code=${inputs.wechat_verification_code}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('微信账户绑定成功！');
      setShowWeChatBindModal(false);
    } else {
      showError(message);
    }
  };

  const sendVerificationCode = async () => {
    setDisableButton(true);
    if (inputs.email === '') return;
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setLoading(true);
    const res = await API.get(
      `/api/verification?email=${inputs.email}&turnstile=${turnstileToken}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('验证码发送成功，请检查邮箱！');
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const bindEmail = async () => {
    if (inputs.email_verification_code === '') return;
    setLoading(true);
    const res = await API.get(
      `/api/oauth/email/bind?email=${inputs.email}&code=${inputs.email_verification_code}`
    );
    const { success, message } = res.data;
    if (success) {
      showSuccess('邮箱账户绑定成功！');
      setShowEmailBindModal(false);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const changePassword = async () => {
    if (inputs.old_password === '') {
      showError('请输入当前密码');
      return;
    }
    if (inputs.new_password === '') {
      showError('请输入新密码');
      return;
    }
    if (inputs.new_password.length < 8) {
      showError('新密码长度不能少于 8 位');
      return;
    }
    if (inputs.new_password !== inputs.confirm_password) {
      showError('两次输入的新密码不一致');
      return;
    }
    setLoading(true);
    const res = await API.post('/api/user/password', {
      old_password: inputs.old_password,
      new_password: inputs.new_password,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess('密码修改成功');
      setShowChangePasswordModal(false);
      setInputs((inputs) => ({
        ...inputs,
        old_password: '',
        new_password: '',
        confirm_password: '',
      }));
    } else {
      showError(message);
    }
    setLoading(false);
  };

  return (
    <div style={{ lineHeight: '40px' }}>
      <Header as='h3'>{t('setting.personal.general.title')}</Header>
      <Message>{t('setting.personal.general.system_token_notice')}</Message>
      {isAdmin() && (
      <Button as={Link} to={`/user/edit/${userState.user?.id || ''}`}>
        {t('setting.personal.general.buttons.update_profile')}
      </Button>
      )}
      <Button onClick={generateAccessToken}>
        {t('setting.personal.general.buttons.generate_token')}
      </Button>
      <Button onClick={() => setShowChangePasswordModal(true)}>
        {t('setting.personal.general.buttons.change_password')}
      </Button>

      {systemToken && (
        <Form.Input
          fluid
          readOnly
          value={systemToken}
          onClick={handleSystemTokenClick}
          style={{ marginTop: '10px' }}
        />
      )}
      <Divider />
      <Header as='h3'>{t('setting.personal.binding.title')}</Header>
      {status.wechat_login && (
        <Button onClick={() => setShowWeChatBindModal(true)}>
          {t('setting.personal.binding.buttons.bind_wechat')}
        </Button>
      )}
      <Modal
        onClose={() => setShowWeChatBindModal(false)}
        onOpen={() => setShowWeChatBindModal(true)}
        open={showWeChatBindModal}
        size={'mini'}
      >
        <Modal.Content>
          <Modal.Description>
            <Image src={status.wechat_qrcode} fluid />
            <div style={{ textAlign: 'center' }}>
              <p>{t('setting.personal.binding.wechat.description')}</p>
            </div>
            <Form size='large'>
              <Form.Input
                fluid
                placeholder={t(
                  'setting.personal.binding.wechat.verification_code'
                )}
                name='wechat_verification_code'
                value={inputs.wechat_verification_code}
                onChange={handleInputChange}
              />
              <Button color='' fluid size='large' onClick={bindWeChat}>
                {t('setting.personal.binding.wechat.bind')}
              </Button>
            </Form>
          </Modal.Description>
        </Modal.Content>
      </Modal>
      {status.github_oauth && (
        <Button onClick={() => onGitHubOAuthClicked(status.github_client_id)}>
          {t('setting.personal.binding.buttons.bind_github')}
        </Button>
      )}
      {status.lark_client_id && (
        <Button onClick={() => onLarkOAuthClicked(status.lark_client_id)}>
          {t('setting.personal.binding.buttons.bind_lark')}
        </Button>
      )}
      <Button onClick={() => setShowEmailBindModal(true)}>
        {t('setting.personal.binding.buttons.bind_email')}
      </Button>
      <Modal
        onClose={() => setShowEmailBindModal(false)}
        onOpen={() => setShowEmailBindModal(true)}
        open={showEmailBindModal}
        size={'tiny'}
        style={{ maxWidth: '450px' }}
      >
        <Modal.Header>{t('setting.personal.binding.email.title')}</Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Form size='large'>
              <Form.Input
                fluid
                placeholder={t(
                  'setting.personal.binding.email.email_placeholder'
                )}
                onChange={handleInputChange}
                name='email'
                type='email'
                action={
                  <Button
                    onClick={sendVerificationCode}
                    disabled={disableButton || loading}
                  >
                    {disableButton
                      ? t('setting.personal.binding.email.get_code_retry', {
                          countdown,
                        })
                      : t('setting.personal.binding.email.get_code')}
                  </Button>
                }
              />
              <Form.Input
                fluid
                placeholder={t(
                  'setting.personal.binding.email.code_placeholder'
                )}
                name='email_verification_code'
                value={inputs.email_verification_code}
                onChange={handleInputChange}
              />
              {turnstileEnabled && (
                <Turnstile
                  sitekey={turnstileSiteKey}
                  onVerify={(token) => {
                    setTurnstileToken(token);
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                }}
              >
                <Button
                  color=''
                  fluid
                  size='large'
                  onClick={bindEmail}
                  loading={loading}
                >
                  {t('setting.personal.binding.email.bind')}
                </Button>
                <div style={{ width: '1rem' }}></div>
                <Button
                  fluid
                  size='large'
                  onClick={() => setShowEmailBindModal(false)}
                >
                  {t('setting.personal.binding.email.cancel')}
                </Button>
              </div>
            </Form>
          </Modal.Description>
        </Modal.Content>
      </Modal>
      <Modal
        onClose={() => setShowChangePasswordModal(false)}
        onOpen={() => setShowChangePasswordModal(true)}
        open={showChangePasswordModal}
        size={'tiny'}
        style={{ maxWidth: '450px' }}
      >
        <Modal.Header>
          {t('setting.personal.change_password.title')}
        </Modal.Header>
        <Modal.Content>
          <Modal.Description>
            <Form size='large'>
              <Form.Input
                fluid
                type='password'
                placeholder={t(
                  'setting.personal.change_password.old_password_placeholder'
                )}
                name='old_password'
                value={inputs.old_password}
                onChange={handleInputChange}
              />
              <Form.Input
                fluid
                type='password'
                placeholder={t(
                  'setting.personal.change_password.new_password_placeholder'
                )}
                name='new_password'
                value={inputs.new_password}
                onChange={handleInputChange}
              />
              <Form.Input
                fluid
                type='password'
                placeholder={t(
                  'setting.personal.change_password.confirm_password_placeholder'
                )}
                name='confirm_password'
                value={inputs.confirm_password}
                onChange={handleInputChange}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '1rem',
                }}
              >
                <Button
                  color='green'
                  fluid
                  size='large'
                  onClick={changePassword}
                  loading={loading}
                >
                  {t('setting.personal.change_password.buttons.confirm')}
                </Button>
                <div style={{ width: '1rem' }}></div>
                <Button
                  fluid
                  size='large'
                  onClick={() => setShowChangePasswordModal(false)}
                >
                  {t('setting.personal.change_password.buttons.cancel')}
                </Button>
              </div>
            </Form>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    </div>
  );
};

export default PersonalSetting;
