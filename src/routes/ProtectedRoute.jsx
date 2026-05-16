import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { readStoredUser } from '../utils/storedUser';

const TOKEN_KEY = 'fptp_token';
const USER_KEY = 'fptp_user';

function readProtectedUser() {
  try {
    return readStoredUser(null);
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

function ProtectedRoute({ allowedRole }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);
  const user = readProtectedUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const allowedRoles = Array.isArray(allowedRole) ? allowedRole : [allowedRole].filter(Boolean);

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
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
