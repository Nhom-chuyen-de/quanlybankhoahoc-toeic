// src/pages/auth/components/LoginForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Ban } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ROLES, ROLE_HOME } from '../../../constants/roles';
import { useToast } from '../../../hooks/useToast';

export default function LoginForm({ onForgotPassword }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Lỗi form validation
  const [errors, setErrors] = useState({});

  // Banner lỗi mẫu để nối API sau này
  const [mockErrorBanner, setMockErrorBanner] = useState(null); // 'wrong_credentials' | 'account_locked' | null

  const handleGoogleLogin = () => {
    toast.info('Chức năng đăng nhập Google sẽ cập nhật sau');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMockErrorBanner(null);

    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    // TODO: nối API đăng nhập ở đây
    // Vai trò thực tế sẽ do server trả về sau khi xác thực thông tin tài khoản.
    // Ví dụ:
    // const res = await authApi.login({ email, password, rememberMe });
    // if (res.status === 'locked') setMockErrorBanner('account_locked');
    // else if (res.error) setMockErrorBanner('wrong_credentials');
    // else login(res.user);

    // GIẢ LẬP ĐĂNG NHẬP SAU 1 GIÂY:
    // Tự động nhận diện vai trò dựa trên email (hoặc mặc định Quản trị viên để quản lý hệ thống)
    setTimeout(() => {
      setIsLoading(false);

      const normalizedEmail = email.toLowerCase().trim();
      let determinedRole = ROLES.ADMIN;
      let displayName = 'Quản Trị Viên';

      if (normalizedEmail.includes('giangvien') || normalizedEmail.includes('teacher')) {
        determinedRole = ROLES.TEACHER;
        displayName = 'Giảng Viên Minh Quân';
      } else if (normalizedEmail.includes('hocvien') || normalizedEmail.includes('student')) {
        determinedRole = ROLES.STUDENT;
        displayName = 'Học Viên Hoàng Nam';
      }

      const fakeUser = {
        id: 'usr_' + Date.now().toString(36),
        hoTen: displayName,
        email: email,
        vaiTro: determinedRole,
      };

      login(fakeUser);
      toast.success(`Đăng nhập thành công!`);
      
      const targetPath = ROLE_HOME[fakeUser.vaiTro] || '/admin';
      navigate(targetPath);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Nút đăng nhập Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full h-11 flex items-center justify-center gap-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Tiếp tục với Google</span>
      </button>

      {/* Đường phân cách */}
      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <span className="relative px-3 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Hoặc với email & mật khẩu
        </span>
      </div>

      {/* Banner lỗi mẫu (chuẩn bị sẵn để nối backend theo trang_thai) */}
      {mockErrorBanner === 'wrong_credentials' && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.</span>
        </div>
      )}

      {mockErrorBanner === 'account_locked' && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
          <Ban className="w-4 h-4 shrink-0" />
          <span>Tài khoản đã bị khóa. Vui lòng liên hệ ban quản trị để được hỗ trợ.</span>
        </div>
      )}

      {/* Form nhập liệu */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Email */}
        <div>
          <label
            htmlFor="login-email"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Mail className="w-4 h-4" />
            </span>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
              }}
              placeholder="email@example.com"
              className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.email
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
              }}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.password
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Ghi nhớ & Quên mật khẩu */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 accent-indigo-600"
            />
            <span>Ghi nhớ đăng nhập (30 ngày)</span>
          </label>

          <button
            type="button"
            onClick={onForgotPassword}
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline focus:outline-none"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Nút Đăng nhập */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600/40"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <>
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
