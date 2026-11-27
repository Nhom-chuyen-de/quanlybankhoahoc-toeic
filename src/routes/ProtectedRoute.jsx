// src/routes/ProtectedRoute.jsx
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth, getSavedUserFromStorage, normalizeRole } from '../context/AuthContext';
import { ROLE_HOME } from '../constants/roles';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user } = useAuth();

  // Đọc trực tiếp từ state hoặc fallback đồng bộ từ localStorage để không bị trễ nhịp render sau khi login()
  const activeUser = user || getSavedUserFromStorage();
  const isAuthenticated = !!activeUser;

  // 1. Chưa đăng nhập -> Bắt buộc chuyển hướng đến trang /login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = normalizeRole(activeUser?.vaiTro, activeUser?.email);

  // 2. Đã đăng nhập nhưng không đúng vai trò được phép -> Chuyển về đúng trang của vai trò đó
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    const homePath = ROLE_HOME[userRole] || '/hoc-vien';
    return <Navigate to={homePath} replace />;
  }

  // 3. Đúng vai trò -> Cho phép truy cập
  return <Outlet />;
}
