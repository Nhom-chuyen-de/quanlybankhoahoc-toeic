import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, Loader2 } from 'lucide-react';

export default function ForgotPasswordForm({ onBackToLogin }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không đúng định dạng');
      return;
    }

    setError(null);
    setIsLoading(true);

    // TODO: nối API gửi email khôi phục mật khẩu ở đây
    // Ví dụ: await authApi.sendResetPasswordLink(email);

    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Khôi phục mật khẩu
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Nhập địa chỉ email liên kết với tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu.
        </p>
      </div>

      {isSent ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Đã gửi hướng dẫn khôi phục!</span>
            </div>
            <p className="leading-relaxed">
              Chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong className="font-semibold text-emerald-900 dark:text-emerald-200">{email}</strong>. Vui lòng kiểm tra hộp thư đến (hoặc thư rác).
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang đăng nhập</span>
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label
              htmlFor="forgot-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Email của bạn <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="email@example.com"
                className={`w-full h-11 pl-10 pr-3.5 rounded-xl border text-sm transition-all outline-none bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ${
                  error
                    ? 'border-red-500 focus:ring-2 focus:ring-red-400/30'
                    : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20'
                }`}
              />
            </div>
            {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 flex items-center justify-center gap-2 px-4 rounded-xl font-medium text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-indigo-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-600/40"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi liên kết...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi liên kết đặt lại</span>
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại đăng nhập</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
