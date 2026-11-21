import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Sun, Moon } from 'lucide-react';
import AuthBrandPanel from './components/AuthBrandPanel';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordForm from './components/ForgotPasswordForm';
import { ToastProvider } from '../../contexts/ToastContext';

function LoginPageContent() {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Quản lý chế độ sáng / tối đồng bộ toàn ứng dụng
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('adminDarkMode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('adminDarkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-800 dark:text-slate-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* CỘT TRÁI (Khối giới thiệu thương hiệu) */}
      <AuthBrandPanel />

      {/* CỘT PHẢI (Form xác thực) */}
      <div className="w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 relative transition-all">
          
          {/* Nút bật/tắt Dark Mode góc trên phải card */}
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            className="absolute top-5 right-5 sm:top-7 sm:right-7 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
          </button>

          {/* Màn hình Quên Mật Khẩu */}
          {isForgotPassword ? (
            <ForgotPasswordForm onBackToLogin={() => setIsForgotPassword(false)} />
          ) : (
            <>
              {/* Tiêu đề & Phụ đề đổi theo Tab */}
              <div className="pr-10 mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {tab === 'login' ? 'Chào mừng bạn trở lại!' : 'Đăng ký tài khoản học viên'}
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {tab === 'login'
                    ? 'Đăng nhập để vào không gian học tập và quản lý các khóa học của bạn.'
                    : 'Tạo tài khoản học viên để nhận ưu đãi khóa học và trải nghiệm bài học dùng thử miễn phí.'}
                </p>
              </div>

              {/* Thanh chuyển tab dạng segmented */}
              <div
                role="tablist"
                aria-label="Tùy chọn xác thực"
                className="grid grid-cols-2 p-1.5 mb-6 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm font-medium"
              >
                <button
                  type="button"
                  role="tab"
                  id="tab-login"
                  aria-selected={tab === 'login'}
                  aria-controls="panel-login"
                  onClick={() => setTab('login')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all ${
                    tab === 'login'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  id="tab-register"
                  aria-selected={tab === 'register'}
                  aria-controls="panel-register"
                  onClick={() => setTab('register')}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all ${
                    tab === 'register'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Đăng ký</span>
                </button>
              </div>

              {/* Nội dung Form tương ứng */}
              <div className="transition-opacity duration-200">
                {tab === 'login' ? (
                  <div id="panel-login" role="tabpanel" aria-labelledby="tab-login">
                    <LoginForm onForgotPassword={() => setIsForgotPassword(true)} />
                  </div>
                ) : (
                  <div id="panel-register" role="tabpanel" aria-labelledby="tab-register">
                    <RegisterForm onSuccess={() => setTab('login')} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Chân card */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Hotline: <span className="font-medium text-slate-600 dark:text-slate-400">1900 6868</span> •{' '}
              <a href="mailto:cskh@toeicmaster.vn" className="hover:text-indigo-500 transition-colors">
                cskh@toeicmaster.vn
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <ToastProvider>
      <LoginPageContent />
    </ToastProvider>
  );
}
