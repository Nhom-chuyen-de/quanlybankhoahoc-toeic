// src/pages/admin/CouponsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  Tag, Plus, Edit2, Trash2, Copy
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToastContext } from '../../contexts/ToastContext';
import { couponService, courseService } from '../../services/adminService';

// TODO: nối API
// - GET /api/admin/coupons (Lấy danh sách mã giảm giá)
// - POST /api/admin/coupons (Tạo mã giảm giá mới)
// - PUT /api/admin/coupons/:id (Cập nhật mã giảm giá)
// - DELETE /api/admin/coupons/:id (Xóa mã giảm giá)
// - PATCH /api/admin/coupons/:id/toggle (Bật/tắt trạng thái)

const formatVnd = (value) => {
  if (value === null || value === undefined || value === 0) return '0 ₫';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

const typeOptions = [
  { value: '', label: 'Tất cả loại giảm giá' },
  { value: 'percentage', label: 'Phần trăm (%)' },
  { value: 'fixed', label: 'Số tiền cố định (₫)' },
];

export default function CouponsPage() {
  const toast = useToastContext();
  const [coupons, setCoupons] = useState([]);
  const [courses, setCourses] = useState([]);

  const loadCoupons = async () => {
    try {
      const [couponResult, courseResult] = await Promise.all([couponService.list({ page: 1, limit: 100 }), courseService.getCourses({ page: 1, limit: 100 })]);
      setCourses(courseResult);
      const formatDateTime = (value) => { const date = new Date(value); const pad = (n) => String(n).padStart(2, '0'); return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`; };
      setCoupons(couponResult.map((item) => ({ ...item, startDate: formatDateTime(item.startDate), endDate: formatDateTime(item.endDate), applicableCourse: courseResult.find((course) => course.id === item.courseId)?.title || 'Tất cả khóa học' })));
    } catch (error) { toast.error(error.message || 'Không tải được mã giảm giá.'); }
  };
  useEffect(() => { loadCoupons(); }, []);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal tạo / sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage',
    value: 20,
    startDate: '',
    endDate: '',
    maxUsage: '',
    applicableCourse: 'all',
    isActive: true,
  });

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Lọc danh sách mã giảm giá
  const filteredCoupons = useMemo(() => {
    return coupons.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.applicableCourse.toLowerCase().includes(q);

      const matchType = !typeFilter || item.type === typeFilter;
      const matchStatus =
        statusFilter === ''
          ? true
          : statusFilter === 'active'
          ? item.isActive
          : !item.isActive;

      return matchSearch && matchType && matchStatus;
    });
  }, [coupons, search, typeFilter, statusFilter]);

  // Bật/tắt công tắc kích hoạt
  const handleToggleActive = async (couponId, currentStatus) => {
    try { await couponService.toggle(couponId); toast.success(`Đã ${!currentStatus ? 'kích hoạt' : 'tạm dừng'} mã giảm giá thành công!`); await loadCoupons(); }
    catch (error) { toast.error(error.message || 'Không đổi được trạng thái mã giảm giá.'); }
  };

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      type: 'percentage',
      value: 15,
      startDate: '01/10/2026 00:00',
      endDate: '31/12/2026 23:59',
      maxUsage: '',
      applicableCourse: 'all',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Mở modal sửa
  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      startDate: coupon.startDate,
      endDate: coupon.endDate,
      maxUsage: coupon.maxUsage === null ? '' : coupon.maxUsage.toString(),
      applicableCourse: coupon.courseId || 'all',
      isActive: coupon.isActive,
    });
    setIsModalOpen(true);
  };

  // Lưu mã giảm giá
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();

    if (!cleanCode) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    const numValue = parseFloat(formData.value) || 0;
    if (numValue <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return;
    }

    if (formData.type === 'percentage' && numValue > 100) {
      toast.error('Phần trăm giảm giá tối đa không được vượt quá 100%');
      return;
    }

    const parsedMaxUsage =
      formData.maxUsage === '' ? null : parseInt(formData.maxUsage, 10);

    const payload = { code: cleanCode, type: formData.type, value: numValue, startDate: formData.startDate, endDate: formData.endDate, usageLimit: parsedMaxUsage, courseId: formData.applicableCourse === 'all' || formData.applicableCourse === 'Tất cả khóa học' ? null : formData.applicableCourse, isActive: formData.isActive };
    try {
      if (editingCoupon) { await couponService.update(editingCoupon.id, payload); toast.success(`Cập nhật mã giảm giá "${cleanCode}" thành công!`); }
      else { await couponService.create(payload); toast.success(`Đã tạo mã giảm giá "${cleanCode}" thành công!`); }
      await loadCoupons();
    } catch (error) { toast.error(error.message || 'Không lưu được mã giảm giá.'); return; }

    setIsModalOpen(false);
  };

  // Xác nhận xóa mã
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try { await couponService.remove(deleteTarget.id); toast.success(`Đã xóa mã giảm giá "${deleteTarget.code}"!`); await loadCoupons(); }
    catch (error) { toast.error(error.message || 'Không xóa được mã giảm giá.'); }
    setDeleteTarget(null);
  };

  // Copy mã voucher vào clipboard
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast.success(`Đã sao chép mã "${code}" vào bộ nhớ tạm!`);
  };

  // Cấu hình bảng
  const columns = [
    {
      title: 'Mã Code',
      key: 'code',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs">
            <Tag className="w-3.5 h-3.5 text-indigo-500" />
            <span>{val}</span>
          </div>
          <button
            type="button"
            onClick={() => handleCopyCode(val)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            title="Sao chép mã"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      ),
    },
    {
      title: 'Loại',
      key: 'type',
      render: (val) =>
        val === 'percentage' ? (
          <Badge variant="blue" className="text-xs">
            Phần trăm (%)
          </Badge>
        ) : (
          <Badge variant="purple" className="text-xs">
            Tiền mặt (₫)
          </Badge>
        ),
    },
    {
      title: 'Giá trị',
      key: 'value',
      render: (val, row) => (
        <span className="font-bold text-sm text-gray-900 dark:text-gray-100">
          {row.type === 'percentage' ? `${val}%` : formatVnd(val)}
        </span>
      ),
    },
    {
      title: 'Thời gian hiệu lực',
      key: 'startDate',
      render: (_, row) => (
        <div className="text-xs text-gray-600 dark:text-gray-300 font-mono">
          <span className="block font-medium">{row.startDate}</span>
          <span className="text-gray-400 text-[11px] flex items-center gap-1">
            đến {row.endDate}
          </span>
        </div>
      ),
    },
    {
      title: 'Lượt dùng',
      key: 'usedCount',
      render: (val, row) => {
        const isUnlimited = row.maxUsage === null || row.maxUsage === undefined;
        const percent = isUnlimited
          ? 0
          : Math.min(100, Math.round((val / row.maxUsage) * 100));
        const isFull = !isUnlimited && val >= row.maxUsage;

        return (
          <div className="w-36 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {val} / {isUnlimited ? '∞' : row.maxUsage}
              </span>
              <span
                className={`text-[11px] font-semibold ${
                  isFull ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {isUnlimited ? 'Không giới hạn' : `${percent}%`}
              </span>
            </div>
            {!isUnlimited && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFull
                      ? 'bg-red-500'
                      : percent > 75
                      ? 'bg-amber-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Khóa học áp dụng',
      key: 'applicableCourse',
      render: (val) => (
        <div className="max-w-[180px]">
          {val === 'Tất cả khóa học' || !val ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
              Tất cả khóa học
            </span>
          ) : (
            <span
              className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate block"
              title={val}
            >
              {val}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Kích hoạt',
      key: 'isActive',
      render: (val, row) => (
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={val}
            onChange={() => handleToggleActive(row.id, val)}
          />
          <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 text-gray-500 hover:text-indigo-600"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>

          {/* Yêu cầu: Ẩn nút Xóa ở mã có lượt dùng lớn hơn 0 (chỉ cho tắt kích hoạt) */}
          {(!row.usedCount || row.usedCount <= 0) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-gray-500 hover:text-red-600"
              title="Xóa mã"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mã giảm giá"
        subtitle="Quản lý chiến dịch khuyến mại, mã ưu đãi học phí và giới hạn lượt áp dụng"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Kinh doanh' },
          { label: 'Mã giảm giá' },
        ]}
        actions={
          <Button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Tạo mã giảm giá
          </Button>
        }
      />

      {/* ─── BẢNG MÃ GIẢM GIÁ ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã voucher, khóa học áp dụng..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                options={typeOptions}
              />
            </div>

            <div className="w-40">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'Tất cả trạng thái' },
                  { value: 'active', label: 'Đang hoạt động' },
                  { value: 'inactive', label: 'Tạm dừng' },
                ]}
              />
            </div>

            {(search || typeFilter || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setStatusFilter('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredCoupons}
          emptyText="Không có mã giảm giá nào phù hợp với bộ lọc."
        />
      </div>

      {/* ─── MODAL TẠO / SỬA MÃ GIẢM GIÁ ────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleSaveCoupon}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingCoupon ? 'Lưu thay đổi' : 'Tạo mã ngay'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveCoupon} className="space-y-4 py-2">
          {/* Mã code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mã code voucher <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                })
              }
              placeholder="VD: TOEIC2026, GIAM100K..."
              className="font-mono font-bold uppercase tracking-wider"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Hệ thống tự động chuyển thành chữ in hoa và loại bỏ khoảng trắng.
            </p>
          </div>

          {/* Loại giảm và Giá trị */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loại giảm giá <span className="text-red-500">*</span>
              </label>
              <Select
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value,
                    value: e.target.value === 'percentage' ? 15 : 100000,
                  })
                }
                options={[
                  { value: 'percentage', label: 'Phần trăm (%)' },
                  { value: 'fixed', label: 'Tiền mặt cố định (₫)' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giá trị giảm <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max={formData.type === 'percentage' ? '100' : undefined}
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: e.target.value })
                }
                placeholder={formData.type === 'percentage' ? 'Tối đa 100%' : 'VD: 100000'}
                required
              />
              <p className="text-[11px] text-gray-400 mt-1">
                {formData.type === 'percentage'
                  ? 'Phần trăm khấu trừ (1% - 100%)'
                  : `Quy đổi: ${formatVnd(parseFloat(formData.value) || 0)}`}
              </p>
            </div>
          </div>

          {/* Thời gian hiệu lực */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngày bắt đầu
              </label>
              <Input
                type="text"
                placeholder="dd/MM/yyyy HH:mm"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ngày kết thúc
              </label>
              <Input
                type="text"
                placeholder="dd/MM/yyyy HH:mm"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Số lượng tối đa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Số lượt dùng tối đa
            </label>
            <Input
              type="number"
              min="1"
              value={formData.maxUsage}
              onChange={(e) =>
                setFormData({ ...formData, maxUsage: e.target.value })
              }
              placeholder="Để trống = Không giới hạn lượt dùng"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Để trống nếu muốn áp dụng mã không giới hạn số lượng học viên.
            </p>
          </div>

          {/* Khóa học áp dụng */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Khóa học áp dụng (Tùy chọn)
            </label>
            <Select
              value={formData.applicableCourse}
              onChange={(e) =>
                setFormData({ ...formData, applicableCourse: e.target.value })
              }
              options={[{ value: 'all', label: 'Tất cả khóa học' }, ...courses.map((course) => ({ value: course.id, label: course.title }))]}
            />
          </div>

          {/* Công tắc kích hoạt */}
          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveCoupon"
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />
            <label
              htmlFor="isActiveCoupon"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Kích hoạt cho phép học viên nhập mã này khi thanh toán
            </label>
          </div>
        </form>
      </Modal>

      {/* ─── CONFIRM DIALOG XÓA MÃ ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa mã giảm giá"
        description={`Bạn có chắc chắn muốn xóa mã giảm giá "${deleteTarget?.code}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa vĩnh viễn"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
}
