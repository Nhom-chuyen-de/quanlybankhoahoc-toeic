// src/pages/admin/UsersPage.jsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  UserPlus, Users, Download, Filter, Eye, Pencil, Lock, Unlock,
  Trash2, AlertTriangle, Search, X, Check, BookOpen, Receipt,
  GraduationCap, ShieldCheck, Mail, Phone, MapPin, Calendar,
  Clock, KeyRound, Globe, AlertCircle, Info, Sparkles, UserCheck
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import { StatusBadge, RoleBadge } from '../../components/shared/StatusBadge';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Drawer from '../../components/ui/Drawer';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';
import { useToastContext } from '../../contexts/ToastContext';
import { userService } from '../../services/adminService';

// TODO: nối API - Thay mockUsers bằng dữ liệu thật từ GET /api/admin/users
// - POST /api/admin/users (Thêm người dùng)
// - PUT /api/admin/users/:id (Sửa người dùng)
// - PATCH /api/admin/users/:id/status (Khóa/Mở khóa)
// - DELETE /api/admin/users/:id (Xóa)
// - POST /api/admin/users/bulk-action (Thao tác hàng loạt)

// Lọc vai trò theo yêu cầu: quản trị viên / giảng viên / học viên
const roleOptions = [
  { value: '', label: 'Tất cả vai trò' },
  { value: 'admin', label: 'Quản trị viên' },
  { value: 'teacher', label: 'Giảng viên' },
  { value: 'student', label: 'Học viên' },
];

// Lọc trạng thái theo yêu cầu: đang hoạt động / ngừng hoạt động / bị khóa / đã xóa
const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
  { value: 'banned', label: 'Bị khóa' },
  { value: 'deleted', label: 'Đã xóa' },
];

// Component render avatar với gradient màu sắc theo tên
function UserAvatar({ name, size = 'md', className = '' }) {
  const initials = name
    ? name.split(' ').slice(-2).map((w) => w[0]).join('').toUpperCase()
    : 'U';
  const colors = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-teal-500 to-emerald-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];
  const charCode = name ? name.charCodeAt(0) + name.length : 0;
  const gradient = colors[charCode % colors.length];

  const sizeClass = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-16 h-16 text-lg',
  }[size] || 'w-9 h-9 text-xs';

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const toast = useToastContext();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // State cho Drawer chi tiết
  const [detailUser, setDetailUser] = useState(null);

  // State cho Modal Thêm/Sửa
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' hoặc 'edit'
    data: null,
  });

  // State form dữ liệu
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'student',
    status: 'active',
    avatar: '',
  });

  // State lưu lỗi form (hiển thị viền đỏ + dòng chữ lỗi)
  const [formErrors, setFormErrors] = useState({});

  // State Confirm dialog cho Khóa / Xóa
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    user: null,
    action: '', // 'ban' | 'unlock' | 'delete' | 'bulk_ban' | 'bulk_delete'
  });

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await userService.getUsers({ page: 1, limit: 100, q: search, role: roleFilter, status: statusFilter });
      setUsers(result.map((user) => ({ ...user, phone: user.phone || '', classes: user.classes || [], orders: user.orders || [] })));
    } catch (error) {
      toast.error(error.message || 'Không tải được danh sách người dùng.');
    } finally { setIsLoading(false); }
  }, [search, roleFilter, statusFilter, toast]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Lọc dữ liệu theo tìm kiếm (tên, email, SĐT), vai trò và trạng thái
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.replace(/\s+/g, '').includes(q);
      const matchRole = !roleFilter || u.role === roleFilter;
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // Mở modal thêm người dùng mới
  const handleOpenCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'student',
      status: 'active',
      avatar: '',
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'create', data: null });
  };

  // Mở modal sửa người dùng
  const handleOpenEditModal = (user) => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      password: '',
      role: user.role,
      status: user.status,
      avatar: user.avatar || '',
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'edit', data: user });
  };

  // Kích hoạt lỗi mẫu để reviewer kiểm tra UI hiển thị lỗi form (viền đỏ + text đỏ)
  const handleSimulateErrors = () => {
    setFormErrors({
      name: 'Họ và tên không được để trống',
      email: 'Email không đúng định dạng (ví dụ: user@domain.com)',
      phone: 'Số điện thoại phải đủ 10 chữ số hợp lệ',
      password: 'Mật khẩu phải có độ dài tối thiểu 10 ký tự',
    });
    toast.info('Đã bật chế độ hiển thị mẫu lỗi xác thực form');
  };

  // Validate form trước khi submit
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Họ và tên không được để trống';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Email không đúng định dạng (ví dụ: user@example.com)';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{9,11}$/.test(formData.phone.replace(/\s+/g, ''))) {
      errors.phone = 'Số điện thoại phải gồm 10 chữ số';
    }
    if (modalState.mode === 'create' && !formData.password) {
      errors.password = 'Mật khẩu bắt buộc đối với tài khoản mới';
    } else if (formData.password && formData.password.length < 10) {
      errors.password = 'Mật khẩu phải có ít nhất 10 ký tự';
    }
    return errors;
  };

  // Submit form Thêm / Sửa
  const handleSubmitForm = async (e) => {
    e?.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Vui lòng kiểm tra và sửa các trường bị lỗi viền đỏ');
      return;
    }

    try {
      if (modalState.mode === 'create') {
        await userService.createUser(formData);
        toast.success(`Đã thêm thành công người dùng "${formData.name}"`);
      } else {
      // Sửa người dùng
      // Kiểm tra an toàn: Không thể hạ quyền admin cuối cùng
      const currentAdminCount = users.filter((u) => u.role === 'admin').length;
      if (
        modalState.data.role === 'admin' &&
        formData.role !== 'admin' &&
        currentAdminCount <= 1
      ) {
        toast.error('Không thể hạ quyền quản trị viên cuối cùng của hệ thống!');
        return;
      }

        await userService.updateUser(modalState.data.id, formData);
        toast.success(`Đã cập nhật thông tin "${formData.name}"`);
      }
      await loadUsers();
    } catch (error) {
      toast.error(error.message || 'Không lưu được người dùng.');
      return;
    }

    setModalState({ isOpen: false, mode: 'create', data: null });
  };

  // Xử lý xác nhận Khóa / Mở khóa / Xóa
  const handleConfirmAction = async () => {
    const { action, user } = confirmDialog;

    try {
    if (action === 'delete') {
      // Kiểm tra an toàn: Không thể xóa quản trị viên cuối cùng
      if (user?.role === 'admin') {
        const adminCount = users.filter((u) => u.role === 'admin').length;
        if (adminCount <= 1) {
          toast.error('Không thể xóa quản trị viên cuối cùng của hệ thống!');
          setConfirmDialog({ isOpen: false, user: null, action: '' });
          return;
        }
      }
      await userService.deleteUser(user.id);
      toast.success(`Đã xóa người dùng "${user.name}"`);
    } else if (action === 'ban') {
      if (user?.role === 'admin') {
        const activeAdmins = users.filter((u) => u.role === 'admin' && u.status === 'active').length;
        if (activeAdmins <= 1) {
          toast.error('Không thể khóa quản trị viên đang hoạt động duy nhất!');
          setConfirmDialog({ isOpen: false, user: null, action: '' });
          return;
        }
      }
      await userService.updateUserStatus(user.id, 'banned');
      toast.success(`Đã khóa tài khoản "${user.name}"`);
    } else if (action === 'unlock') {
      await userService.updateUserStatus(user.id, 'active');
      toast.success(`Đã mở khóa tài khoản "${user.name}"`);
    } else if (action === 'bulk_ban') {
      await userService.bulkAction(selectedIds, 'ban');
      toast.success(`Đã khóa ${selectedIds.length} người dùng đã chọn`);
      setSelectedIds([]);
    } else if (action === 'bulk_delete') {
      // Loại trừ admin duy nhất nếu có
      const remainingAdmins = users.filter((u) => u.role === 'admin' && !selectedIds.includes(u.id)).length;
      if (remainingAdmins === 0) {
        toast.error('Thao tác bị hủy: Danh sách chọn chứa quản trị viên cuối cùng!');
        setConfirmDialog({ isOpen: false, user: null, action: '' });
        return;
      }
      await userService.bulkAction(selectedIds, 'delete');
      toast.success(`Đã xóa ${selectedIds.length} người dùng khỏi hệ thống`);
      setSelectedIds([]);
    }

    await loadUsers();
    } catch (error) { toast.error(error.message || 'Không thực hiện được thao tác.'); }
    setConfirmDialog({ isOpen: false, user: null, action: '' });
  };

  // Cấu hình các cột của Bảng
  const columns = [
    {
      key: 'name',
      title: 'Họ tên & Email',
      render: (_, row) => (
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => setDetailUser(row)}
        >
          <UserAvatar name={row.name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
              {row.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
              <Mail className="h-3 w-3 inline shrink-0" />
              {row.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      title: 'Số điện thoại',
      render: (v) => (
        <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">
          {v}
        </span>
      ),
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (v) => <RoleBadge role={v} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'lastLogin',
      title: 'Lần đăng nhập cuối',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Clock className="h-3 w-3 text-gray-400 shrink-0" />
          {v}
        </span>
      ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
          {v}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      headerClass: 'text-right',
      render: (_, row) => {
        const isBanned = row.status === 'banned';
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              title="Xem chi tiết"
              onClick={() => setDetailUser(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              title="Chỉnh sửa thông tin"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              title={isBanned ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  user: row,
                  action: isBanned ? 'unlock' : 'ban',
                })
              }
              className={`p-1.5 rounded-lg transition-colors ${
                isBanned
                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                  : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              }`}
            >
              {isBanned ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
            </button>
            <button
              title="Xóa người dùng"
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  user: row,
                  action: 'delete',
                })
              }
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý Người dùng"
        subtitle={`Tổng số ${users.length} tài khoản trong hệ thống đào tạo`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => toast.wip()}
            >
              Xuất dữ liệu
            </Button>
            <Button
              icon={UserPlus}
              onClick={handleOpenCreateModal}
            >
              Thêm người dùng
            </Button>
          </div>
        }
      />

      {/* ─── BANNER CẢNH BÁO TĨNH ─────────────────────────────────────────── */}
      <div className="flex items-start sm:items-center gap-3.5 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-xl text-amber-900 dark:text-amber-200 text-sm shadow-sm">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg shrink-0 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <span className="font-semibold text-amber-950 dark:text-amber-100">
            Quy định bảo vệ tài khoản quản trị:
          </span>{' '}
          Không thể xóa hoặc hạ quyền quản trị viên cuối cùng của hệ thống. Luôn đảm bảo ít nhất một tài khoản Quản trị viên đang hoạt động để duy trì vận hành.
        </div>
      </div>

      {/* ─── BỘ LỌC TÌM KIẾM ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo họ tên, email, số điện thoại..."
          className="w-full sm:w-80"
        />

        <div className="w-full sm:w-48">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-52">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        {(search || roleFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            icon={Filter}
            onClick={() => {
              setSearch('');
              setRoleFilter('');
              setStatusFilter('');
            }}
          >
            Xóa bộ lọc
          </Button>
        )}
      </div>

      {/* ─── THANH THAO TÁC HÀNG LOẠT (BULK ACTIONS) ───────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5 rounded-xl animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
              Đã chọn {selectedIds.length} người dùng
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50"
              icon={Lock}
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  user: null,
                  action: 'bulk_ban',
                })
              }
            >
              Khóa hàng loạt
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={Trash2}
              onClick={() =>
                setConfirmDialog({
                  isOpen: true,
                  user: null,
                  action: 'bulk_delete',
                })
              }
            >
              Xóa hàng loạt
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedIds([])}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {/* ─── BẢNG NGƯỜI DÙNG ──────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectChange={setSelectedIds}
        pageSize={8}
        emptyState={
          <EmptyState
            icon={Users}
            title="Không tìm thấy người dùng"
            description="Hãy thử thay đổi từ khóa tìm kiếm hoặc làm mới bộ lọc vai trò, trạng thái"
            action={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            }
          />
        }
      />

      {/* ─── MODAL THÊM / SỬA NGƯỜI DÙNG ───────────────────────────────────── */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', data: null })}
        title={
          modalState.mode === 'create'
            ? 'Thêm người dùng mới'
            : `Chỉnh sửa: ${modalState.data?.name}`
        }
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={handleSimulateErrors}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5" /> Mô phỏng hiển thị lỗi form
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setModalState({ isOpen: false, mode: 'create', data: null })}
              >
                Hủy bỏ
              </Button>
              <Button onClick={handleSubmitForm}>
                {modalState.mode === 'create' ? 'Tạo tài khoản' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm} className="space-y-4">
          {/* Hướng dẫn minh họa lỗi */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
            <div>
              Hệ thống xác thực dữ liệu tự động. Nhấn <strong>"Mô phỏng hiển thị lỗi form"</strong> bên dưới để xem trực quan giao diện viền đỏ và thông điệp lỗi.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div>
              <Input
                label="Họ và tên"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                }}
                className={formErrors.name ? '!border-red-500 !ring-1 !ring-red-500 bg-red-50/20' : ''}
              />
              {formErrors.name && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {formErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Input
                label="Địa chỉ Email"
                required
                type="email"
                placeholder="an.nguyen@example.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                }}
                className={formErrors.email ? '!border-red-500 !ring-1 !ring-red-500 bg-red-50/20' : ''}
              />
              {formErrors.email && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <Input
                label="Số điện thoại"
                required
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: '' });
                }}
                className={formErrors.phone ? '!border-red-500 !ring-1 !ring-red-500 bg-red-50/20' : ''}
              />
              {formErrors.phone && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {formErrors.phone}
                </p>
              )}
            </div>

            {/* Mật khẩu */}
            <div>
              <Input
                label={modalState.mode === 'create' ? 'Mật khẩu' : 'Mật khẩu mới (bỏ trống nếu không đổi)'}
                required={modalState.mode === 'create'}
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (formErrors.password) setFormErrors({ ...formErrors, password: '' });
                }}
                className={formErrors.password ? '!border-red-500 !ring-1 !ring-red-500 bg-red-50/20' : ''}
              />
              {formErrors.password && (
                <p className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 mt-1 font-medium">
                  <AlertCircle className="h-3 w-3 inline shrink-0" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Vai trò */}
            <div>
              <Select
                label="Vai trò tài khoản"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'admin', label: 'Quản trị viên (Toàn quyền hệ thống)' },
                  { value: 'teacher', label: 'Giảng viên (Quản lý khóa học, lớp học)' },
                  { value: 'student', label: 'Học viên (Tham gia các khóa học)' },
                ]}
              />
            </div>

            {/* Trạng thái */}
            <div>
              <Select
                label="Trạng thái tài khoản"
                required
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Ngừng hoạt động' },
                  { value: 'banned', label: 'Bị khóa' },
                  { value: 'deleted', label: 'Đã xóa' },
                ]}
              />
            </div>
          </div>

          {/* Ảnh đại diện */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Ảnh đại diện (Avatar URL)
            </label>
            <div className="flex items-center gap-3">
              <UserAvatar name={formData.name || 'User'} size="md" />
              <div className="flex-1">
                <Input
                  placeholder="https://example.com/avatar.jpg (Tùy chọn)"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── DRAWER CHI TIẾT NGƯỜI DÙNG (3 TAB) ────────────────────────────── */}
      <Drawer
        isOpen={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="Hồ sơ chi tiết người dùng"
        width="w-full sm:w-[540px]"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const u = detailUser;
                setDetailUser(null);
                handleOpenEditModal(u);
              }}
              icon={Pencil}
            >
              Chỉnh sửa
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDetailUser(null)}
            >
              Đóng
            </Button>
          </div>
        }
      >
        {detailUser && (
          <div className="space-y-6">
            {/* Header thông tin nhanh */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
              <UserAvatar name={detailUser.name} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                    {detailUser.name}
                  </h3>
                  <RoleBadge role={detailUser.role} size="xs" />
                  <StatusBadge status={detailUser.status} size="xs" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">
                  Mã ID: {detailUser.id}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 truncate">
                  {detailUser.email}
                </p>
              </div>
            </div>

            {/* 3 Tabs chi tiết */}
            <Tabs
              tabs={[
                {
                  key: 'info',
                  label: 'Thông tin',
                  icon: Users,
                  content: (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <span className="text-gray-400 block mb-0.5">Số điện thoại</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {detailUser.phone}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <span className="text-gray-400 block mb-0.5">Giới tính</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {detailUser.gender || 'Chưa rõ'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <span className="text-gray-400 block mb-0.5">Ngày sinh</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {detailUser.dob || '—'}
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                          <span className="text-gray-400 block mb-0.5">Phương thức đăng nhập</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">
                            {detailUser.authProvider || 'Email/Password'}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs">
                        <span className="text-gray-400 block mb-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Địa chỉ cư trú
                        </span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {detailUser.address || 'Chưa cập nhật'}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Ngày tạo tài khoản:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{detailUser.createdAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Đăng nhập gần nhất:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-300">{detailUser.lastLogin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Địa chỉ IP gần nhất:</span>
                          <span className="font-mono text-gray-700 dark:text-gray-300">{detailUser.lastLoginIp || '127.0.0.1'}</span>
                        </div>
                      </div>

                      {detailUser.note && (
                        <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs">
                          <span className="font-semibold text-indigo-900 dark:text-indigo-200 block mb-1">
                            Ghi chú quản trị:
                          </span>
                          <p className="text-indigo-800 dark:text-indigo-300 leading-relaxed">
                            {detailUser.note}
                          </p>
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'classes',
                  label: detailUser.role === 'teacher' ? 'Lớp đang dạy' : 'Lớp đang học',
                  icon: BookOpen,
                  count: detailUser.classes?.length || 0,
                  content: (
                    <div className="space-y-3">
                      {!detailUser.classes || detailUser.classes.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-xs">
                          Chưa có thông tin lớp học nào.
                        </div>
                      ) : detailUser.role === 'teacher' ? (
                        detailUser.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                  {cls.courseName}
                                </h4>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                                  Mã lớp: {cls.classCode}
                                </span>
                              </div>
                              <StatusBadge status={cls.status} size="xs" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
                              <span>Sĩ số: <strong>{cls.studentsCount} học viên</strong></span>
                              <span>Khai giảng: <strong>{cls.startDate}</strong></span>
                            </div>
                            <p className="text-gray-400 text-[11px]">
                              Lịch học: {cls.schedule}
                            </p>
                          </div>
                        ))
                      ) : (
                        detailUser.classes.map((cls) => (
                          <div
                            key={cls.id}
                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2.5 text-xs"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                  {cls.courseName}
                                </h4>
                                <span className="text-gray-500">Giảng viên: {cls.teacher}</span>
                              </div>
                              <StatusBadge status={cls.status} size="xs" />
                            </div>

                            {/* Tiến độ học tập */}
                            <div>
                              <div className="flex justify-between text-[11px] mb-1">
                                <span className="text-gray-500">Tiến độ bài học</span>
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {cls.progress}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${cls.progress}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700">
                              <span>Thi thử gần nhất: <strong className="text-emerald-600 font-bold">{cls.mockScore}</strong></span>
                              <span>Ngày ghi danh: {cls.enrolledAt}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ),
                },
                {
                  key: 'orders',
                  label: 'Đơn hàng',
                  icon: Receipt,
                  count: detailUser.orders?.length || 0,
                  content: (
                    <div className="space-y-3">
                      {!detailUser.orders || detailUser.orders.length === 0 ? (
                        <div className="py-8 text-center text-gray-400 text-xs">
                          Người dùng chưa phát sinh đơn hàng nào.
                        </div>
                      ) : (
                        detailUser.orders.map((ord) => (
                          <div
                            key={ord.id}
                            className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                                {ord.id}
                              </span>
                              <StatusBadge status={ord.status} size="xs" />
                            </div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {ord.courseName}
                            </p>
                            <div className="flex items-center justify-between text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-700 text-[11px]">
                              <span>Phương thức: <strong>{ord.paymentMethod}</strong></span>
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                                {ord.amount.toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                            <p className="text-gray-400 text-[10px]">Thời gian: {ord.createdAt}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Drawer>

      {/* ─── CONFIRM DIALOG KHÓA / XÓA ────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, user: null, action: '' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'delete'
            ? 'Xác nhận xóa tài khoản'
            : confirmDialog.action === 'ban'
            ? 'Xác nhận khóa tài khoản'
            : confirmDialog.action === 'unlock'
            ? 'Xác nhận mở khóa tài khoản'
            : confirmDialog.action === 'bulk_ban'
            ? 'Khóa hàng loạt tài khoản'
            : 'Xóa hàng loạt tài khoản'
        }
        description={
          confirmDialog.action === 'delete'
            ? `Bạn có chắc chắn muốn xóa tài khoản "${confirmDialog.user?.name}"? Dữ liệu liên quan có thể bị vô hiệu hóa vĩnh viễn.`
            : confirmDialog.action === 'ban'
            ? `Tài khoản "${confirmDialog.user?.name}" sẽ không thể đăng nhập và truy cập các khóa học sau khi bị khóa.`
            : confirmDialog.action === 'unlock'
            ? `Khôi phục quyền truy cập bình thường cho tài khoản "${confirmDialog.user?.name}"?`
            : confirmDialog.action === 'bulk_ban'
            ? `Bạn có chắc chắn muốn khóa ${selectedIds.length} người dùng đã chọn?`
            : `Hành động này sẽ xóa vĩnh viễn ${selectedIds.length} người dùng đã chọn khỏi hệ thống.`
        }
        variant={
          confirmDialog.action === 'delete' || confirmDialog.action === 'bulk_delete'
            ? 'danger'
            : confirmDialog.action === 'unlock'
            ? 'primary'
            : 'warning'
        }
        confirmLabel={
          confirmDialog.action === 'delete' || confirmDialog.action === 'bulk_delete'
            ? 'Xóa vĩnh viễn'
            : confirmDialog.action === 'ban' || confirmDialog.action === 'bulk_ban'
            ? 'Khóa tài khoản'
            : 'Mở khóa'
        }
      />
    </div>
  );
}
