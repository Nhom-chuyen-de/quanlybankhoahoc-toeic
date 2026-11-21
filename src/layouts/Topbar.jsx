// layouts/Topbar.jsx
import { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Search, Moon, Sun, Bell, ChevronDown, LogOut, User, Settings, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Breadcrumb mapping: path segment -> tiếng Việt
const breadcrumbLabels = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  'thong-bao-cua-toi': 'Thông báo của tôi',
  'nguoi-dung': 'Người dùng',
  users: 'Người dùng',
  teachers: 'Giáo viên',
  'giao-vien': 'Giáo viên',
  'danh-muc': 'Danh mục',
  categories: 'Danh mục',
  'khoa-hoc': 'Khóa học',
  courses: 'Khóa học',
  'lop-hoc': 'Lớp học',
  classes: 'Lớp học',
  'kiem-duyet': 'Duyệt nội dung',
  review: 'Duyệt nội dung',
  'don-hang': 'Đơn hàng',
  orders: 'Đơn hàng',
  'thanh-toan': 'Thanh toán',
  payments: 'Thanh toán',
  'hoan-tien': 'Hoàn tiền',
  refunds: 'Hoàn tiền',
  'ma-giam-gia': 'Mã giảm giá',
  coupons: 'Mã giảm giá',
  'ho-tro': 'Hỗ trợ & Thông báo',
  tickets: 'Hỗ trợ & Thông báo',
  'chung-chi': 'Chứng chỉ & Đánh giá',
  certificates: 'Chứng chỉ & Đánh giá',
  'bao-cao': 'Báo cáo & Thống kê',
  reports: 'Báo cáo & Thống kê',
  'cai-dat': 'Cài đặt',
  settings: 'Cài đặt',
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: breadcrumbLabels[seg] ?? seg,
    path: '/' + segments.slice(0, i + 1).join('/'),
  }));
  return crumbs;
}

export default function Topbar({ darkMode, onToggleDark }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const crumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="
      sticky top-0 z-40 flex items-center justify-between
      h-16 px-4 sm:px-6
      bg-white/80 dark:bg-gray-900/80 backdrop-blur-md
      border-b border-gray-200 dark:border-gray-700
    ">
      {/* Left: Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {i === crumbs.length - 1 ? (
              <span className="text-gray-800 dark:text-gray-200 font-semibold truncate">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {/* Search */}
        <div className="hidden md:flex">
          {searchOpen ? (
            <input
              autoFocus
              onBlur={() => setSearchOpen(false)}
              placeholder="Tìm kiếm..."
              className="
                w-48 lg:w-64 px-3 py-2 text-sm rounded-lg
                bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100
                border border-gray-200 dark:border-gray-700
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                transition-all duration-200
              "
            />
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <Search className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
            </button>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDark}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title={darkMode ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
        >
          {darkMode
            ? <Sun className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
            : <Moon className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
          }
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <Bell className="h-4.5 w-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-84 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">Thông báo</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline disabled:opacity-40 disabled:no-underline cursor-pointer"
                >
                  Đánh dấu đã đọc
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                    Bạn chưa có thông báo nào
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                            !notif.read ? 'bg-indigo-600' : 'bg-transparent'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm line-clamp-1 ${
                              !notif.read
                                ? 'font-semibold text-gray-900 dark:text-gray-100'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {notif.title || notif.message}
                          </p>
                          {notif.content && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                              {notif.content}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                            {notif.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 text-center border-t border-gray-100 dark:border-gray-700">
                <Link
                  to="/admin/thong-bao-cua-toi"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline block"
                >
                  Xem tất cả thông báo
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div ref={avatarRef} className="relative">
          <button
            onClick={() => setAvatarOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
              N
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">Bùi Văn Nam</span>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>

          {avatarOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Bùi Văn Nam</p>
                <p className="text-xs text-gray-400">admin@toeic.vn</p>
              </div>
              <div className="py-1">
                <MenuBtn
                  icon={User}
                  label="Hồ sơ của tôi"
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate('/admin/cai-dat');
                  }}
                />
                <MenuBtn
                  icon={Settings}
                  label="Cài đặt"
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate('/admin/cai-dat');
                  }}
                />
                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                <MenuBtn
                  icon={LogOut}
                  label="Đăng xuất"
                  danger
                  onClick={() => {
                    setAvatarOpen(false);
                    logout();
                    navigate('/login');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MenuBtn({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
        ${danger
          ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }
      `}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
