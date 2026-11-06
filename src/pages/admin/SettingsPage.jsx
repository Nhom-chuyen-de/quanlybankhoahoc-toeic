// src/pages/admin/SettingsPage.jsx
import { useState, useEffect } from 'react';
import {
  User, KeyRound, Palette, Camera, Save, Lock,
  Check, Sun, Moon, Monitor
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import { useToastContext } from '../../contexts/ToastContext';
import { profileService } from '../../services/adminService';

export default function SettingsPage() {
  const toast = useToastContext();
  const showToast = (msg, type = 'success') => {
    if (typeof toast === 'function') toast(msg, type);
    else if (toast?.showToast) toast.showToast(msg, type);
    else if (type === 'error' && toast?.error) toast.error(msg);
    else if (toast?.success) toast.success(msg);
  };

  // Tab 1: Profile State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl] = useState('https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces');
  useEffect(() => { profileService.get().then((profile) => { setName(profile.name || ''); setEmail(profile.email || ''); setPhone(profile.phone || ''); }).catch((error) => showToast(error.message || 'Không tải được hồ sơ.', 'error')); }, []);

  // Tab 2: Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Tab 3: Appearance & Theme State
  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark') ||
                     localStorage.getItem('adminDarkMode') === 'true';
      return isDark ? 'dark' : 'light';
    }
    return 'light';
  });

  // Apply Theme Mode Live
  const handleThemeChange = (mode) => {
    setThemeMode(mode);
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('adminDarkMode', 'true');
    } else if (mode === 'light') {
      root.classList.remove('dark');
      localStorage.setItem('adminDarkMode', 'false');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        localStorage.setItem('adminDarkMode', 'true');
      } else {
        root.classList.remove('dark');
        localStorage.setItem('adminDarkMode', 'false');
      }
    }
    showToast(`Đã chuyển sang chế độ giao diện: ${mode === 'dark' ? 'Tối' : mode === 'light' ? 'Sáng' : 'Theo hệ thống'}`);
  };

  // Submit Profile Form
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try { const profile = await profileService.update({ name, phone }); setName(profile.name); setPhone(profile.phone || ''); showToast('Đã lưu thông tin hồ sơ cá nhân.'); }
    catch (error) { showToast(error.message || 'Không lưu được hồ sơ.', 'error'); }
  };

  // Submit Password Form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }
    if (newPassword.length < 10) {
      showToast('Mật khẩu mới phải có ít nhất 10 ký tự', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp với mật khẩu mới', 'error');
      return;
    }

    try {
      await profileService.changePassword({ currentPassword, newPassword });
      showToast('Đã thay đổi mật khẩu quản trị thành công!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (error) { showToast(error.message || 'Không đổi được mật khẩu.', 'error'); }
  };

  const tabs = [
    {
      key: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: User,
      content: (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm max-w-4xl">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Avatar block */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="relative group">
                <img
                  src={avatarUrl}
                  alt={name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-indigo-50 dark:ring-indigo-950/60 shadow-md"
                />
                <button
                  type="button"
                  onClick={() => showToast('Chức năng tải ảnh đại diện sẽ kết nối lưu trữ cloud S3 sau!')}
                  className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium">Thay đổi</span>
                </button>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">{name}</h3>
                <p className="text-xs text-gray-500">{email}</p>
                <div className="pt-1">
                  <Badge variant="blue" size="sm">Quản trị viên</Badge>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Họ và tên
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Địa chỉ Email
                </label>
                <Input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Số điện thoại
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Vai trò quản trị
                </label>
                <div className="h-10 flex items-center">
                  <Badge variant="blue" size="md">Quản trị viên</Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5">
                <Save className="w-4 h-4" />
                Lưu thay đổi hồ sơ
              </Button>
            </div>
          </form>
        </div>
      ),
    },
    {
      key: 'password',
      label: 'Đổi mật khẩu',
      icon: KeyRound,
      content: (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm max-w-xl">
          <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
              Đổi mật khẩu bảo vệ tài khoản
            </h3>
            <p className="text-xs text-gray-500">
              Khuyến nghị sử dụng mật khẩu mạnh có chữ hoa, số và ký tự đặc biệt
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu hiện tại <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                required
              />
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Độ an toàn:</span>
                    <span className="font-semibold text-emerald-600">
                      {newPassword.length >= 8 ? 'Mạnh' : newPassword.length >= 6 ? 'Trung bình' : 'Yếu'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        newPassword.length >= 8
                          ? 'bg-emerald-500 w-full'
                          : newPassword.length >= 6
                          ? 'bg-amber-500 w-2/3'
                          : 'bg-rose-500 w-1/3'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới..."
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </div>
      ),
    },
    {
      key: 'appearance',
      label: 'Giao diện',
      icon: Palette,
      content: (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm max-w-3xl space-y-6">
          {/* Lựa chọn chế độ sáng / tối */}
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
              Chế độ màu hiển thị (Theme)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Tùy chỉnh giao diện theo sở thích của bạn hoặc tự động theo hệ điều hành (áp dụng ngay khi bấm)
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Sáng */}
              <div
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === 'light'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
                  <Sun className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Giao diện Sáng (Light)</h4>
                <p className="text-xs text-gray-500 mt-1">Nền sáng, độ tương phản cao ban ngày</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  {themeMode === 'light' && <Check className="w-4 h-4" />}
                  <span>{themeMode === 'light' ? 'Đang kích hoạt' : 'Chọn chế độ'}</span>
                </div>
              </div>

              {/* Tối */}
              <div
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-900 text-indigo-300 flex items-center justify-center mb-3">
                  <Moon className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Giao diện Tối (Dark)</h4>
                <p className="text-xs text-gray-500 mt-1">Dịu mắt, phong cách hiện đại và tiết kiệm pin</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  {themeMode === 'dark' && <Check className="w-4 h-4" />}
                  <span>{themeMode === 'dark' ? 'Đang kích hoạt' : 'Chọn chế độ'}</span>
                </div>
              </div>

              {/* Hệ thống */}
              <div
                onClick={() => handleThemeChange('system')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  themeMode === 'system'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mb-3">
                  <Monitor className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Theo hệ thống (Auto)</h4>
                <p className="text-xs text-gray-500 mt-1">Đồng bộ tự động theo cài đặt của máy tính</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-600 font-semibold">
                  {themeMode === 'system' && <Check className="w-4 h-4" />}
                  <span>{themeMode === 'system' ? 'Đang kích hoạt' : 'Chọn chế độ'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt tài khoản"
        subtitle="Quản lý hồ sơ cá nhân quản trị viên, bảo mật tài khoản và tùy biến giao diện"
      />

      <Tabs tabs={tabs} defaultTab="profile" />
    </div>
  );
}
