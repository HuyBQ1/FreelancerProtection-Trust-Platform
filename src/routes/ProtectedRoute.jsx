import { Navigate, Outlet, useLocation } from 'react-router-dom';

const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

function ProtectedRoute({ allowedRole }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  const user = rawUser ? JSON.parse(rawUser) : null;

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRole && user.role !== allowedRole) {
    const redirectPath = user.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
