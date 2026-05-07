import { Navigate, Outlet, useLocation } from 'react-router-dom';

const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

function readStoredUser() {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

function ProtectedRoute({ allowedRole }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);
  const user = readStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirectPath = user.role === 'client'
      ? '/client-dashboard'
      : user.role === 'admin'
        ? '/admin-dashboard'
        : '/freelancer-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
