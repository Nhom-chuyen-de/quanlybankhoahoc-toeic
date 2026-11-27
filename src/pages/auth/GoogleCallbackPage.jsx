// src/pages/auth/GoogleCallbackPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuth, getSavedUserFromStorage } from '../../context/AuthContext';
import { ROLES, ROLE_HOME } from '../../constants/roles';
import { studentAuthService } from '../../services/studentService';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Chặn tuyệt đối việc useEffect chạy lần 2 trong React StrictMode hoặc khi state AuthContext cập nhật
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;

    let redirectTimer = null;

    async function processOAuthCallback() {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const queryParams = new URLSearchParams(window.location.search);

        const oauthError = hashParams.get('error') || queryParams.get('error');
        if (oauthError) {
          throw new Error(`Google OAuth từ chối truy cập: ${oauthError}`);
        }

        const accessToken = hashParams.get('access_token');
        if (!accessToken) {
          // Nếu đã đăng nhập thành công từ lần chạy trước thì vào thẳng trang chủ của vai trò đó
          const existingUser = getSavedUserFromStorage();
          if (existingUser) {
            navigate(ROLE_HOME[existingUser.vaiTro] || '/hoc-vien', { replace: true });
            return;
          }

          setError('Không tìm thấy mã xác thực từ Google. Đang quay lại trang đăng nhập...');
          redirectTimer = setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        // Lấy thông tin tài khoản thực từ Google UserInfo API
        const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!googleRes.ok) {
          throw new Error('Không thể lấy thông tin tài khoản từ Google API');
        }

        const profile = await googleRes.json();

        // Gửi thông tin & accessToken về Backend để xác thực, lưu DB và nhận JWT
        let authedUser = null;
        let jwtToken = null;

        try {
          const res = await studentAuthService.googleLogin({
            email: profile.email,
            name: profile.name,
            picture: profile.picture,
            googleId: profile.sub,
            accessToken,
          });

          if (res.success && res.data) {
            jwtToken = res.data.token;
            authedUser = login(
              {
                ...res.data.user,
                vaiTro: res.data.user.vaiTro || ROLES.STUDENT,
                anhDaiDien: res.data.user.anhDaiDien || profile.picture,
                authProvider: 'Google',
              },
              jwtToken
            );
          }
        } catch (apiErr) {
          if (!apiErr.isNetworkError) throw apiErr;

          const lowerEmail = (profile.email || '').toLowerCase();
          let determinedRole = ROLES.STUDENT;
          if (lowerEmail.includes('admin')) determinedRole = ROLES.ADMIN;
          else if (lowerEmail.includes('teacher') || lowerEmail.includes('giangvien'))
            determinedRole = ROLES.TEACHER;

          jwtToken = accessToken;
          authedUser = login(
            {
              id: 'usr_google_' + (profile.sub || Date.now()),
              hoTen: profile.name || profile.email,
              email: profile.email,
              vaiTro: determinedRole,
              anhDaiDien: profile.picture,
              authProvider: 'Google',
            },
            jwtToken
          );
        }

        if (authedUser) {
          try {
            const bc = new BroadcastChannel('toeic_google_oauth');
            bc.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', user: authedUser, token: jwtToken });
            bc.close();
          } catch {
            // ignore
          }

          const targetPath = ROLE_HOME[authedUser.vaiTro] || '/hoc-vien';
          navigate(targetPath, { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Đăng nhập Google thất bại');
        redirectTimer = setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    }

    processOAuthCallback();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 max-w-md w-full text-center space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
        {error ? (
          <>
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Đang đồng bộ tài khoản Google của bạn...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
