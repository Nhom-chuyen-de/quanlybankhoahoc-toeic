import React, { useState } from 'react';
import { User, AtSign, Phone, Lock, Eye, EyeOff, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    matKhau: '',
    xacNhanMatKhau: '',
    dongYDieuKhoan: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.hoTen.trim()) {
      newErrors.hoTen = 'Vui lòng nhập họ và tên';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không đúng định dạng';
    }

    if (!formData.soDienThoai.trim()) {
      newErrors.soDienThoai = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9+()-\s]{8,15}$/.test(formData.soDienThoai.trim())) {
      newErrors.soDienThoai = 'Số điện thoại không hợp lệ';
    }

    if (!formData.matKhau) {
      newErrors.matKhau = 'Vui lòng nhập mật khẩu';
    } else if (formData.matKhau.length < 8 || !/\d/.test(formData.matKhau)) {
      newErrors.matKhau = 'Mật khẩu phải từ 8 ký tự và bao gồm số';
    }

    if (!formData.xacNhanMatKhau) {
      newErrors.xacNhanMatKhau = 'Vui lòng xác nhận lại mật khẩu';
    } else if (formData.matKhau !== formData.xacNhanMatKhau) {
      newErrors.xacNhanMatKhau = 'Mật khẩu nhập lại không khớp';
    }

    if (!formData.dongYDieuKhoan) {
      newErrors.dongYDieuKhoan = 'Bạn cần đồng ý với điều khoản dịch vụ';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // TODO: nối API đăng nhập/đăng ký ở đây
    // Ví dụ:
    // const res = await authApi.register({
    //   ho_ten: formData.hoTen,
    //   email: formData.email,
    //   so_dien_thoai: formData.soDienThoai,
    //   mat_khau: formData.matKhau,
    //   vai_tro: 'hoc vien'
    // });

    // GIẢ LẬP ĐĂNG KÝ
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage('Tạo tài khoản thành công! Đang chuyển về màn hình đăng nhập...');

      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Thông báo thành công */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
        {/* Họ và tên */}
        <div>
          <label
            htmlFor="reg-name"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </span>
            <input
              id="reg-name"
              name="hoTen"
              type="text"
              value={formData.hoTen}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.hoTen
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }`}
            />
          </div>
          {errors.hoTen && <p className="mt-1 text-xs text-red-500 font-medium">{errors.hoTen}</p>}
        </div>

        {/* Email & Số điện thoại (2 cột trên sm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </span>
              <input
                id="reg-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="ten@domain.com"
                className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                  errors.email
                    ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                }`}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email}</p>}
          </div>

          <div>
            <label
              htmlFor="reg-phone"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                id="reg-phone"
                name="soDienThoai"
                type="tel"
                value={formData.soDienThoai}
                onChange={handleChange}
                placeholder="0912 345 678"
                className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                  errors.soDienThoai
                    ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                }`}
              />
            </div>
            {errors.soDienThoai && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.soDienThoai}</p>
            )}
          </div>
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="reg-pass"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="reg-pass"
              name="matKhau"
              type={showPassword ? 'text' : 'password'}
              value={formData.matKhau}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.matKhau
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Tối thiểu 8 ký tự, bao gồm số</p>
          {errors.matKhau && <p className="mt-0.5 text-xs text-red-500 font-medium">{errors.matKhau}</p>}
        </div>

        {/* Nhập lại mật khẩu */}
        <div>
          <label
            htmlFor="reg-confirm-pass"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Nhập lại mật khẩu <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="reg-confirm-pass"
              name="xacNhanMatKhau"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.xacNhanMatKhau}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full h-11 pl-10 pr-10 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                errors.xacNhanMatKhau
                  ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                  : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
              }`}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiển thị mật khẩu xác nhận'}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.xacNhanMatKhau && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.xacNhanMatKhau}</p>
          )}
        </div>

        {/* Checkbox điều khoản */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              name="dongYDieuKhoan"
              checked={formData.dongYDieuKhoan}
              onChange={handleChange}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-orange-500 focus:ring-orange-400 accent-orange-500 shrink-0"
            />
            <span>
              Tôi đồng ý với{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Chính sách bảo mật
              </a>{' '}
              của TOEIC Master.
            </span>
          </label>
          {errors.dongYDieuKhoan && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.dongYDieuKhoan}</p>
          )}
        </div>

        {/* Nút Tạo tài khoản */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-sm text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-orange-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/40"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang tạo tài khoản...</span>
            </>
          ) : (
            <span>Tạo tài khoản học viên</span>
          )}
        </button>

        {/* Ghi chú vai trò hệ thống */}
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span>Tài khoản giảng viên và quản trị viên do hệ thống cấp.</span>
        </div>
      </form>
    </div>
  );
}
