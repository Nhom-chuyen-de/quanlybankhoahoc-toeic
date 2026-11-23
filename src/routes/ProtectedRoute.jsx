// src/routes/ProtectedRoute.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_HOME } from '../constants/roles';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth();

  // 1. Chưa đăng nhập -> Bắt buộc chuyển hướng đến trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Đã đăng nhập nhưng không đúng vai trò được phép -> Chuyển về đúng trang của vai trò đó
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.vaiTro)) {
    const homePath = ROLE_HOME[user?.vaiTro] || '/login';
    return <Navigate to={homePath} replace />;
  }

  // 3. Đúng vai trò -> Cho phép truy cập
  return <Outlet />;
}
