// src/App.jsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ROLES, ROLE_HOME } from './constants/roles';
import ProtectedRoute from './routes/ProtectedRoute';

// Component Loading tối ưu trải nghiệm người dùng khi tải trang theo nhu cầu
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900/40 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang tải dữ liệu...</span>
      </div>
    </div>
  );
}

// Layouts & Authentication (Tối ưu hóa Code Splitting với React.lazy)
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const StudentHomePage = lazy(() => import('./pages/student/StudentHomePage'));
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage'));
const UserPortalPage = lazy(() => import('./pages/portal/UserPortalPage'));
const CourseStorePage = lazy(() => import('./pages/store/CourseStorePage'));

// Admin Pages (Tải động khi người dùng điều hướng, không làm phình bundle ban đầu)
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const TeachersPage = lazy(() => import('./pages/admin/TeachersPage'));
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'));
const CoursesPage = lazy(() => import('./pages/admin/CoursesPage'));
const CourseDetailPage = lazy(() => import('./pages/admin/CourseDetailPage'));
const ClassesPage = lazy(() => import('./pages/admin/ClassesPage'));
const ClassDetailPage = lazy(() => import('./pages/admin/ClassDetailPage'));
const ModerationPage = lazy(() => import('./pages/admin/ModerationPage'));
const OrdersPage = lazy(() => import('./pages/admin/OrdersPage'));
const PaymentsPage = lazy(() => import('./pages/admin/PaymentsPage'));
const RefundsPage = lazy(() => import('./pages/admin/RefundsPage'));
const CouponsPage = lazy(() => import('./pages/admin/CouponsPage'));
const SupportPage = lazy(() => import('./pages/admin/SupportPage'));
const CertificatesPage = lazy(() => import('./pages/admin/CertificatesPage'));
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage'));
const MyNotificationsPage = lazy(() => import('./pages/admin/MyNotificationsPage'));

// Điều hướng thông minh: Tự động đưa người dùng vào đúng phân hệ theo vai trò tài khoản
function PortalRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={ROLE_HOME[user.vaiTro] || '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Trang xác thực dùng chung tại /login (NGOÀI mọi layout) */}
            <Route path="/login" element={<LoginPage />} />

            {/* Chuyển hướng route /admin/login cũ sang /login */}
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />

            {/* Mặc định khi truy cập localhost trỏ về trang đăng nhập */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Cổng học viên: Bắt buộc đăng nhập & Chỉ dành cho Học Viên */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
              <Route path="/hoc-vien" element={<StudentHomePage />} />
            </Route>

            {/* Cổng giảng viên: Bắt buộc đăng nhập & Chỉ dành cho Giảng Viên */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.TEACHER]} />}>
              <Route path="/giang-vien" element={<TeacherDashboardPage />} />
            </Route>

            {/* Route điều hướng thông minh theo vai trò */}
            <Route path="/portal" element={<PortalRedirect />} />

            {/* Cửa hàng & Trang bán khóa học TOEIC Master (Công khai, nhưng nút Vào học bắt buộc auth) */}
            <Route path="/store" element={<CourseStorePage />} />
            <Route path="/khoa-hoc" element={<CourseStorePage />} />
            <Route path="/cua-hang" element={<Navigate to="/store" replace />} />

            {/* Khu vực quản trị Admin - bọc ProtectedRoute */}
            <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                {/* Dashboard tổng quan */}
                <Route index element={<DashboardPage />} />

                {/* 1. Người dùng & Giáo viên */}
                <Route path="nguoi-dung" element={<UsersPage />} />
                <Route path="users" element={<Navigate to="/admin/nguoi-dung" replace />} />
                <Route path="teachers" element={<TeachersPage />} />
                <Route path="giao-vien" element={<TeachersPage />} />

                {/* 2. Đào tạo: Danh mục, Khóa học, Lớp học */}
                <Route path="danh-muc" element={<CategoriesPage />} />
                <Route path="categories" element={<Navigate to="/admin/danh-muc" replace />} />

                <Route path="khoa-hoc" element={<CoursesPage />} />
                <Route path="khoa-hoc/:id" element={<CourseDetailPage />} />
                <Route path="courses" element={<Navigate to="/admin/khoa-hoc" replace />} />

                <Route path="lop-hoc" element={<ClassesPage />} />
                <Route path="lop-hoc/:id" element={<ClassDetailPage />} />
                <Route path="classes" element={<Navigate to="/admin/lop-hoc" replace />} />

                {/* 3. Duyệt nội dung */}
                <Route path="kiem-duyet" element={<ModerationPage />} />
                <Route path="review/courses" element={<Navigate to="/admin/kiem-duyet" replace />} />
                <Route path="review/teachers" element={<Navigate to="/admin/kiem-duyet" replace />} />

                {/* 4. Kinh doanh: Đơn hàng, Thanh toán, Hoàn tiền, Mã giảm giá */}
                <Route path="don-hang" element={<OrdersPage />} />
                <Route path="orders" element={<Navigate to="/admin/don-hang" replace />} />

                <Route path="thanh-toan" element={<PaymentsPage />} />
                <Route path="payments" element={<Navigate to="/admin/thanh-toan" replace />} />

                <Route path="hoan-tien" element={<RefundsPage />} />
                <Route path="refunds" element={<Navigate to="/admin/hoan-tien" replace />} />

                <Route path="ma-giam-gia" element={<CouponsPage />} />
                <Route path="coupons" element={<Navigate to="/admin/ma-giam-gia" replace />} />

                {/* 5. Vận hành & Hệ thống */}
                <Route path="ho-tro" element={<SupportPage />} />
                <Route path="support" element={<Navigate to="/admin/ho-tro" replace />} />

                <Route path="chung-chi" element={<CertificatesPage />} />
                <Route path="certificates" element={<Navigate to="/admin/chung-chi" replace />} />

                <Route path="bao-cao" element={<ReportsPage />} />
                <Route path="reports" element={<Navigate to="/admin/bao-cao" replace />} />

                <Route path="cai-dat" element={<SettingsPage />} />
                <Route path="settings" element={<Navigate to="/admin/cai-dat" replace />} />

                <Route path="thong-bao" element={<MyNotificationsPage />} />
                <Route path="notifications" element={<Navigate to="/admin/thong-bao" replace />} />
              </Route>
            </Route>

            {/* Bắt mọi route không tồn tại -> chuyển về /login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
