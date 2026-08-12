import React, { lazy, Suspense, useContext, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import Loading from './components/Loading';
import User from './pages/User';
import { PrivateRoute, AdminRoute } from './components/PrivateRoute';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import NotFound from './pages/NotFound';
import Setting from './pages/Setting';
import EditUser from './pages/User/EditUser';
import AddUser from './pages/User/AddUser';
import { API, getLogo, getSystemName, showError, showNotice } from './helpers';
import PasswordResetForm from './components/PasswordResetForm';
import GitHubOAuth from './components/GitHubOAuth';
import PasswordResetConfirm from './components/PasswordResetConfirm';
import { UserContext } from './context/User';
import { StatusContext } from './context/Status';
import Channel from './pages/Channel';
import Token from './pages/Token';
import MyToken from "./pages/Token/MyToken";
import RequestQuota from "./pages/Token/RequestQuota";
import QuotaApproval from "./pages/Token/QuotaApproval";
import EditToken from './pages/Token/EditToken';
import EditChannel from './pages/Channel/EditChannel';
import Redemption from './pages/Redemption';
import EditRedemption from './pages/Redemption/EditRedemption';
import TopUp from './pages/TopUp';
import Log from './pages/Log';
import Chat from './pages/Chat';
import LarkOAuth from './components/LarkOAuth';
import Dashboard from './pages/Dashboard';
import Help from './pages/Help';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));

function App() {
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState, statusDispatch] = useContext(StatusContext);

  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };
  const loadStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, message, data } = res.data || {}; // Add default empty object
      if (success && data) {
        // Check data exists
        localStorage.setItem('status', JSON.stringify(data));
        statusDispatch({ type: 'set', payload: data });
        localStorage.setItem('system_name', data.system_name);
        localStorage.setItem('logo', data.logo);
        localStorage.setItem('footer_html', data.footer_html);
        localStorage.setItem('quota_per_unit', data.quota_per_unit);
        localStorage.setItem('display_in_currency', data.display_in_currency);
        if (data.chat_link) {
          localStorage.setItem('chat_link', data.chat_link);
        } else {
          localStorage.removeItem('chat_link');
        }
        if (
          data.version !== process.env.REACT_APP_VERSION &&
          data.version !== 'v0.0.0' &&
          process.env.REACT_APP_VERSION !== ''
        ) {
          var dismissed = localStorage.getItem("version_dismissed");
          if (dismissed !== data.version) {
            localStorage.setItem("version_dismissed", data.version);
            showNotice(
              `新版本可用：${data.version}，请使用快捷键 Shift + F5 刷新页面`
            );
          }
        }
      } else {
        showError(message || '无法正常连接至服务器！');
      }
    } catch (error) {
      showError(error.message || '无法正常连接至服务器！');
    }
  };

  useEffect(() => {
    loadUser();
    loadStatus().then();
    let systemName = getSystemName();
    if (systemName) {
      document.title = systemName;
    }
    let logo = getLogo();
    if (logo) {
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
  }, []);

  return (
    <Routes>
      <Route
        path='/'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <Home />
          </Suspense>
        }
      />
      <Route
        path='/channel'
        element={
          <AdminRoute>
            <Channel />
          </AdminRoute>
        }
      />
      <Route
        path='/channel/edit/:id'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditChannel />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/channel/edit'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditChannel />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/channel/add'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditChannel />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path="/quota-approval"
        element={
          <AdminRoute>
            <QuotaApproval />
          </AdminRoute>
        }
      />
      <Route
        path="/request-quota"
        element={
          <PrivateRoute>
            <RequestQuota />
          </PrivateRoute>
        }
      />
      <Route
        path="/mytoken"
        element={
          <PrivateRoute>
            <MyToken />
          </PrivateRoute>
        }
      />
      <Route
        path='/token'
        element={
          <AdminRoute>
            <Token />
          </AdminRoute>
        }
      />
      <Route
        path='/token/edit/:id'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditToken />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/token/edit'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditToken />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/token/add'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditToken />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/redemption'
        element={
          <PrivateRoute>
            <Redemption />
          </PrivateRoute>
        }
      />
      <Route
        path='/redemption/edit/:id'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <EditRedemption />
          </Suspense>
        }
      />
      <Route
        path='/redemption/add'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <EditRedemption />
          </Suspense>
        }
      />
      <Route
        path='/user'
        element={
          <AdminRoute>
            <User />
          </AdminRoute>
        }
      />
      <Route
        path='/user/edit/:id'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditUser />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/user/edit'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <EditUser />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/user/add'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <AddUser />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/user/reset'
        element={
          <AdminRoute>
            <Suspense fallback={<Loading></Loading>}>
              <PasswordResetConfirm />
            </Suspense>
          </AdminRoute>
        }
      />
      <Route
        path='/login'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <LoginForm />
          </Suspense>
        }
      />
      <Route
        path='/register'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <RegisterForm />
          </Suspense>
        }
      />
      <Route
        path='/reset'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <PasswordResetForm />
          </Suspense>
        }
      />
      <Route
        path='/oauth/github'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <GitHubOAuth />
          </Suspense>
        }
      />
      <Route
        path='/oauth/lark'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <LarkOAuth />
          </Suspense>
        }
      />
      <Route
        path='/setting'
        element={
          <PrivateRoute>
            <Suspense fallback={<Loading></Loading>}>
              <Setting />
            </Suspense>
          </PrivateRoute>
        }
      />
      <Route
        path='/topup'
        element={
          <PrivateRoute>
            <Suspense fallback={<Loading></Loading>}>
              <TopUp />
            </Suspense>
          </PrivateRoute>
        }
      />
      <Route
        path='/log'
        element={
          <PrivateRoute>
            <Log />
          </PrivateRoute>
        }
      />
      <Route
        path='/help'
        element={
          <PrivateRoute>
            <Suspense fallback={<Loading></Loading>}>
              <Help />
            </Suspense>
          </PrivateRoute>
        }
      />
      <Route
        path='/about'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <About />
          </Suspense>
        }
      />
      <Route
        path='/chat'
        element={
          <Suspense fallback={<Loading></Loading>}>
            <Chat />
          </Suspense>
        }
      />
      <Route
        path='/dashboard'
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path='*' element={<NotFound />} />
    </Routes>
  );
}

export default App;
