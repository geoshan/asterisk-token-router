import { Navigate } from 'react-router-dom';

import { history } from '../helpers';

function PrivateRoute({ children }) {
  if (!localStorage.getItem('user')) {
    return <Navigate to='/login' state={{ from: history.location }} />;
  }
  return children;
}

function AdminRoute({ children }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user || !user.id) {
    return <Navigate to='/login' state={{ from: history.location }} />;
  }
  if (!user.role || user.role < 10) {
    return <Navigate to='/mytoken' />;
  }
  return children;
}

export { PrivateRoute, AdminRoute };
