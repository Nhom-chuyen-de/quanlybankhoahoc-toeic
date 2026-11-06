// src/routes/ProtectedRoute.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../constants/roles';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen grid place-items-center text-sm text-slate-500">Đang kiểm tra phiên đăng nhập…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.vaiTro)) {
    return <Navigate to={ROLE_HOME[user?.vaiTro] || '/login'} replace />;
  }

  return <Outlet />;
}
