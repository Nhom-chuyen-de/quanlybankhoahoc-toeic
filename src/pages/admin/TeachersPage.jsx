// src/pages/admin/TeachersPage.jsx
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Star, Search, Phone, Mail, BookOpen, Eye, Pencil
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToastContext } from '../../contexts/ToastContext';
import { mockTeachers } from '../../mock/teachers';

// Lọc trạng thái giảng viên: Đang hoạt động / Ngừng hoạt động / Bị khóa
const teacherStatusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'inactive', label: 'Ngừng hoạt động' },
  { value: 'banned', label: 'Bị khóa' },
];

const statusConfig = {
  active: { label: 'Đang hoạt động', color: 'green' },
  inactive: { label: 'Ngừng hoạt động', color: 'gray' },
  banned: { label: 'Bị khóa', color: 'red' },
};

export default function TeachersPage() {
  const toast = useToastContext();
  const [teachers, setTeachers] = useState(mockTeachers);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // State xem chi tiết
  const [viewingTeacher, setViewingTeacher] = useState(null);

  // State chỉnh sửa
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active',
  });

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.phone.replace(/\s+/g, '').includes(q);
      const matchStatus = !statusFilter || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [teachers, search, statusFilter]);

  const handleOpenEdit = (teacher) => {
    setEditingTeacher(teacher);
    setEditFormData({
      name: teacher.name,
      email: teacher.email,
      phone: teacher.phone,
      status: teacher.status,
    });
  };

  const handleSaveEdit = (e) => {
    e?.preventDefault();
    if (!editFormData.name.trim()) {
      toast.error('Họ và tên giảng viên không được để trống');
      return;
    }
    if (!editFormData.email.trim()) {
      toast.error('Email không được để trống');
      return;
    }

    setTeachers((prev) =>
      prev.map((t) =>
        t.id === editingTeacher.id
          ? { ...t, ...editFormData }
          : t
      )
    );
    toast.success(`Đã cập nhật thông tin giảng viên "${editFormData.name}"`);
    setEditingTeacher(null);
  };

  const columns = [
    {
      header: 'Giảng viên',
      accessor: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar}
            alt={row.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-tight">
            {row.name}
          </p>
        </div>
      ),
    },
    {
      header: 'Số lớp phụ trách',
      accessor: 'activeClasses',
      render: (_, row) => (
        <div className="flex items-center gap-1.5 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {row.activeClasses} lớp
          </span>
          <span className="text-gray-400">({row.totalStudents} HV)</span>
        </div>
      ),
    },
    {
      header: 'Điểm đánh giá',
      accessor: 'rating',
      render: (rating) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-bold text-xs text-gray-900 dark:text-gray-100">
            {rating}
          </span>
        </div>
      ),
    },
    {
      header: 'Liên hệ',
      accessor: 'contact',
      render: (_, row) => (
        <div className="text-xs text-gray-500 space-y-0.5">
          <p className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-400" /> {row.email}</p>
          <p className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-400" /> {row.phone}</p>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (status) => {
        const cfg = statusConfig[status] || statusConfig.active;
        return (
          <Badge variant={cfg.color} size="sm">
            {cfg.label}
          </Badge>
        );
      },
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewingTeacher(row)}
            className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xs flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Xem
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-xs flex items-center gap-1"
          >
            <Pencil className="w-3.5 h-3.5" />
            Sửa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <PageHeader
          title="Quản lý Giảng viên"
          subtitle="Danh sách đội ngũ chuyên gia, giảng viên luyện thi TOEIC và IELTS"
        />
        <p className="text-sm text-slate-500 -mt-4 mb-2">
          Để tạo tài khoản giảng viên, vào{' '}
          <Link to="/admin/nguoi-dung" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            Người dùng → Thêm người dùng
          </Link>
          .
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
          <div className="w-full sm:w-80">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo tên giảng viên, email, SĐT..."
            />
          </div>

          <div className="w-full sm:w-48">
            <Select
              options={teacherStatusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs"
            />
          </div>

          {(search || statusFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs text-gray-500"
            >
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <Table
          columns={columns}
          data={filteredTeachers}
          pageSize={6}
          emptyText="Không tìm thấy giảng viên nào phù hợp"
        />
      </div>

      {/* MODAL XEM CHI TIẾT GIẢNG VIÊN */}
      <Modal
        isOpen={!!viewingTeacher}
        onClose={() => setViewingTeacher(null)}
        title="Hồ sơ chi tiết giảng viên"
        size="md"
      >
        {viewingTeacher && (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900">
              <img
                src={viewingTeacher.avatar}
                alt={viewingTeacher.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-indigo-500 shadow-sm"
              />
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
                  {viewingTeacher.name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-bold">{viewingTeacher.rating} / 5.0</span>
                  <span className="text-gray-400">({viewingTeacher.totalStudents} học viên)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Số lớp phụ trách:</span>
                <span className="font-semibold text-indigo-600">{viewingTeacher.activeClasses} lớp ({viewingTeacher.totalStudents} học viên)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Email liên hệ:</span>
                <span className="font-mono">{viewingTeacher.email}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Số điện thoại:</span>
                <span className="font-mono">{viewingTeacher.phone}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500">Trạng thái tài khoản:</span>
                <Badge variant={statusConfig[viewingTeacher.status]?.color || 'gray'} size="sm">
                  {statusConfig[viewingTeacher.status]?.label || viewingTeacher.status}
                </Badge>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => setViewingTeacher(null)} className="bg-indigo-600 text-white">
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL SỬA THÔNG TIN GIẢNG VIÊN */}
      <Modal
        isOpen={!!editingTeacher}
        onClose={() => setEditingTeacher(null)}
        title="Chỉnh sửa thông tin giảng viên"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setEditingTeacher(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>
              Lưu thay đổi
            </Button>
          </div>
        }
      >
        {editingTeacher && (
          <form onSubmit={handleSaveEdit} className="space-y-4 py-1">
            <Input
              label="Họ và tên giảng viên"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Số điện thoại"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Trạng thái
              </label>
              <Select
                options={[
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Ngừng hoạt động' },
                  { value: 'banned', label: 'Bị khóa' },
                ]}
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              />
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
