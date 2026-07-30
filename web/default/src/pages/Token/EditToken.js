import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Form,
  Header,
  Message,
  Segment,
  Card,
} from 'semantic-ui-react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  API,
  copy,
  showError,
  showSuccess,
  timestamp2string,
} from '../../helpers';
import { renderQuotaWithPrompt } from '../../helpers/render';

const EditToken = () => {
  const { t } = useTranslation();
  const params = useParams();
  const tokenId = params.id;
  const isEdit = tokenId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const [userOptions, setUserOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const originInputs = {
    user_id: '',
    name: '',
    remain_quota: 0,
    expired_time: -1,
    unlimited_quota: false,
    models: [],
    subnet: '',
  };
  const [inputs, setInputs] = useState(originInputs);
  const { name, remain_quota, expired_time, unlimited_quota } = inputs;
  const navigate = useNavigate();
  const handleInputChange = (e, { name, value }) => {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  };
  const handleCancel = () => {
    navigate('/token');
  };
  const setExpiredTime = (month, day, hour, minute) => {
    let now = new Date();
    let timestamp = now.getTime() / 1000;
    let seconds = month * 30 * 24 * 60 * 60;
    seconds += day * 24 * 60 * 60;
    seconds += hour * 60 * 60;
    seconds += minute * 60;
    if (seconds !== 0) {
      timestamp += seconds;
      setInputs({ ...inputs, expired_time: timestamp2string(timestamp) });
    } else {
      setInputs({ ...inputs, expired_time: -1 });
    }
  };

  const setUnlimitedQuota = () => {
    setInputs({ ...inputs, unlimited_quota: !unlimited_quota });
  };

  const loadToken = async () => {
    try {
      let res = await API.get(`/api/token/${tokenId}`);
      const { success, message, data } = res.data || {};
      if (success && data) {
        if (data.expired_time !== -1) {
          data.expired_time = timestamp2string(data.expired_time);
        }
        if (data.models === '') {
          data.models = [];
        } else {
          data.models = data.models.split(',');
        }
        setInputs(data);
      } else {
        showError(message || 'Failed to load token');
      }
    } catch (error) {
      showError(error.message || 'Network error');
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    try {
      let res = await API.get('/api/user/?p=0&limit=100');
      const { success, data } = res.data || {};
      if (success && data) {
        let options = data.map((user) => ({
          key: user.id,
          text: `${user.username} (${user.display_name || user.email || ''})`,
          value: user.id,
        }));
        setUserOptions(options);
      }
    } catch (error) {
      // silently ignore
    }
  };

  const loadAvailableModels = async () => {
    try {
      let res = await API.get(`/api/user/available_models`);
      const { success, message, data } = res.data || {};
      if (success && data) {
        let options = data.map((model) => {
          return {
            key: model,
            text: model,
            value: model,
          };
        });
        setModelOptions(options);
      } else {
        showError(message || 'Failed to load models');
      }
    } catch (error) {
      showError(error.message || 'Network error');
    }
  };

  const loadGroups = async () => {
    try {
      let res = await API.get('/api/group/');
      const { success, data } = res.data || {};
      if (success && data) {
        let options = data.map((g) => ({ key: g, text: g, value: g }));
        setGroupOptions(options);
      }
    } catch (error) {}
  };

  const handleGroupChange = async (group) => {
    try {
      let res = await API.get('/api/channel/?p=0&size=200');
      const list = (res.data && res.data.data) ? res.data.data : [];
      let models = [];
      for (let c of list) {
        let cg = c.group || 'default';
        if (group === 'all' || cg === group) {
          let cm = String(c.models || '').split(',').filter(function(v){return v;});
          for (let m of cm) models.push(m);
        }
      }
      models = models.filter(function(v,i,s){return s.indexOf(v)===i;});
      setInputs(function(prev){ return {...prev, models: models}; });
    } catch (e) {}
  };

  useEffect(() => {
    if (isEdit) {
      loadToken().catch((error) => {
        showError(error.message || 'Failed to load token');
        setLoading(false);
      });
    } else {
      loadUsers();
      loadGroups();
    }
    loadAvailableModels().catch((error) => {
      showError(error.message || 'Failed to load models');
    });
  }, []);

  const submit = async () => {
    if (!isEdit && inputs.name === '') return;
    let localInputs = inputs;
    localInputs.remain_quota = parseInt(localInputs.remain_quota);
    if (localInputs.expired_time !== -1) {
      let time = Date.parse(localInputs.expired_time);
      if (isNaN(time)) {
        showError(t('token.edit.messages.expire_time_invalid'));
        return;
      }
      localInputs.expired_time = Math.ceil(time / 1000);
    }
    localInputs.models = localInputs.models.join(',');
    let res;
    if (isEdit) {
      res = await API.put(`/api/token/`, {
        ...localInputs,
        id: parseInt(tokenId),
      });
    } else {
      res = await API.post(`/api/token/`, localInputs);
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t('token.edit.messages.update_success'));
      } else {
        showSuccess(t('token.edit.messages.create_success'));
        setInputs(originInputs);
      }
    } else {
      showError(message);
    }
  };

  return (
    <div className='dashboard-container'>
      <Card fluid className='chart-card'>
        <Card.Content>
          <Card.Header className='header'>
            {isEdit ? t('token.edit.title_edit') : t('token.edit.title_create')}
          </Card.Header>
          <Form loading={loading} autoComplete='new-password'>
            {userOptions.length > 0 && (
              <Form.Field>
                <Form.Dropdown
                  label='所属用户'
                  name='user_id'
                  placeholder='选择用户'
                  fluid
                  selection
                  search
                  options={userOptions}
                  value={inputs.user_id}
                  onChange={(e, { value }) =>
                    setInputs({ ...inputs, user_id: value })
                  }
                />
              </Form.Field>
            )}
            <Form.Field>
              <Form.Input
                label={t('token.edit.name')}
                name='name'
                placeholder={t('token.edit.name_placeholder')}
                onChange={handleInputChange}
                value={name}
                autoComplete='new-password'
                required={!isEdit}
              />
            </Form.Field>
            {/* asterisk-token-router: group selection */}
            {!isEdit && groupOptions.length > 0 && (
              <Form.Field>
                <Form.Dropdown
                  label='模型分组'
                  placeholder='选择分组自动填充模型'
                  fluid
                  selection
                  options={groupOptions}
                  onChange={(e, { value }) => handleGroupChange(value)}
                />
              </Form.Field>
            )}
            <Form.Field>
              <Form.Dropdown
                label={t('token.edit.models')}
                placeholder={t('token.edit.models_placeholder')}
                name='models'
                fluid
                multiple
                search
                onLabelClick={(e, { value }) => {
                  copy(value).then();
                }}
                selection
                onChange={handleInputChange}
                value={inputs.models}
                autoComplete='new-password'
                options={modelOptions}
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('token.edit.ip_limit')}
                name='subnet'
                placeholder={t('token.edit.ip_limit_placeholder')}
                onChange={handleInputChange}
                value={inputs.subnet}
                autoComplete='new-password'
              />
            </Form.Field>
            <Form.Field>
              <Form.Input
                label={t('token.edit.expire_time')}
                name='expired_time'
                placeholder={t('token.edit.expire_time_placeholder')}
                onChange={handleInputChange}
                value={expired_time}
                autoComplete='new-password'
                type='datetime-local'
              />
            </Form.Field>
            <div style={{ lineHeight: '40px' }}>
              <Button
                type={'button'}
                onClick={() => {
                  setExpiredTime(0, 0, 0, 0);
                }}
              >
                {t('token.edit.buttons.never_expire')}
              </Button>
              <Button
                type={'button'}
                onClick={() => {
                  setExpiredTime(1, 0, 0, 0);
                }}
              >
                {t('token.edit.buttons.expire_1_month')}
              </Button>
              <Button
                type={'button'}
                onClick={() => {
                  setExpiredTime(0, 1, 0, 0);
                }}
              >
                {t('token.edit.buttons.expire_1_day')}
              </Button>
              <Button
                type={'button'}
                onClick={() => {
                  setExpiredTime(0, 0, 1, 0);
                }}
              >
                {t('token.edit.buttons.expire_1_hour')}
              </Button>
              <Button
                type={'button'}
                onClick={() => {
                  setExpiredTime(0, 0, 0, 1);
                }}
              >
                {t('token.edit.buttons.expire_1_minute')}
              </Button>
            </div>
            <Message>{t('token.edit.quota_notice')}</Message>
            <Form.Field>
              <Form.Input
                label={`${t('token.edit.quota')}${renderQuotaWithPrompt(
                  remain_quota,
                  t
                )}`}
                name='remain_quota'
                placeholder={t('token.edit.quota_placeholder')}
                onChange={handleInputChange}
                value={remain_quota}
                autoComplete='new-password'
                type='number'
                disabled={unlimited_quota}
              />
            </Form.Field>
            <Button
              type={'button'}
              onClick={() => {
                setUnlimitedQuota();
              }}
            >
              {unlimited_quota
                ? t('token.edit.buttons.cancel_unlimited')
                : t('token.edit.buttons.unlimited_quota')}
            </Button>
            <Button floated='right' positive onClick={submit}>
              {t('token.edit.buttons.submit')}
            </Button>
            <Button floated='right' onClick={handleCancel}>
              {t('token.edit.buttons.cancel')}
            </Button>
          </Form>
        </Card.Content>
      </Card>
    </div>
  );
};

export default EditToken;
