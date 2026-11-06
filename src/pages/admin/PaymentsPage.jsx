// src/pages/admin/PaymentsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  CreditCard, CheckCircle2, Plus, Wallet
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { paymentService } from '../../services/adminService';

// TODO: nối API
// - GET /api/admin/payments (Lấy danh sách giao dịch)
// - POST /api/admin/payments/:id/manual-confirm (Xác nhận thủ công)
// - GET /api/admin/payment-gateways (Danh sách cổng thanh toán)
// - PUT /api/admin/payment-gateways/:id (Cập nhật cấu hình cổng)

const formatVnd = (value) => {
  if (value === null || value === undefined || value === 0) return '0 ₫';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'success', label: 'Thành công' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function PaymentsPage() {
  const toast = useToastContext();

  // Dữ liệu cổng thanh toán và giao dịch
  const [gateways, setGateways] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadPaymentData = async () => {
    try {
      const [gatewayResult, paymentResult] = await Promise.all([paymentService.gateways({ page: 1, limit: 100 }), paymentService.list({ page: 1, limit: 100 })]);
      setGateways(gatewayResult); setPayments(paymentResult.map((item) => ({ ...item, gatewayTransId: item.gatewayTransId || '—' })));
    } catch (error) { toast.error(error.message || 'Không tải được dữ liệu thanh toán.'); }
  };
  useEffect(() => { loadPaymentData(); }, []);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal quản lý cổng thanh toán (Thêm / Sửa)
  const [isGatewayModalOpen, setIsGatewayModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [gatewayFormData, setGatewayFormData] = useState({
    name: '',
    feePercent: 0,
    isActive: true,
  });

  // Confirm dialog xác nhận thanh toán thủ công
  const [confirmPayment, setConfirmPayment] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Lọc danh sách giao dịch
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.gatewayTransId.toLowerCase().includes(q) ||
        item.user?.toLowerCase().includes(q);

      const matchGateway = !gatewayFilter || item.gatewayCode === gatewayFilter;
      const matchStatus = !statusFilter || item.status === statusFilter;

      return matchSearch && matchGateway && matchStatus;
    });
  }, [payments, search, gatewayFilter, statusFilter]);

  // Bật/tắt công tắc kích hoạt cổng thanh toán
  const handleToggleGateway = async (gwId, currentStatus) => {
    try { await paymentService.toggleGateway(gwId); toast.success(`Đã ${!currentStatus ? 'kích hoạt' : 'tạm dừng'} cổng thanh toán thành công!`); await loadPaymentData(); }
    catch (error) { toast.error(error.message || 'Không đổi được trạng thái cổng thanh toán.'); }
  };

  // Mở modal thêm cổng mới
  const handleOpenAddGateway = () => {
    setEditingGateway(null);
    setGatewayFormData({
      name: '',
      feePercent: 1.5,
      isActive: true,
    });
    setIsGatewayModalOpen(true);
  };

  // Lưu cấu hình cổng thanh toán
  const handleSaveGateway = async (e) => {
    e.preventDefault();
    if (!gatewayFormData.name.trim()) {
      toast.error('Vui lòng nhập tên cổng thanh toán');
      return;
    }

    const payload = { name: gatewayFormData.name.trim(), feePercent: parseFloat(gatewayFormData.feePercent) || 0, isActive: gatewayFormData.isActive };
    try {
      if (editingGateway) { await paymentService.updateGateway(editingGateway.id, payload); toast.success(`Cập nhật cổng "${gatewayFormData.name}" thành công!`); }
      else { await paymentService.createGateway(payload); toast.success(`Đã thêm cổng thanh toán "${gatewayFormData.name}"!`); }
      await loadPaymentData();
    } catch (error) { toast.error(error.message || 'Không lưu được cổng thanh toán.'); return; }

    setIsGatewayModalOpen(false);
  };

  // Xác nhận thủ công cho giao dịch chờ xử lý - Chỉ ghi nhận họ tên Admin
  const handleConfirmManualPayment = async () => {
    if (!confirmPayment) return;
    setConfirmLoading(true);
    try { await paymentService.confirm(confirmPayment.id); await loadPaymentData(); toast.success(`Xác nhận thành công giao dịch ${confirmPayment.id} (${formatVnd(confirmPayment.amount)})!`); }
    catch (error) { toast.error(error.message || 'Không xác nhận được thanh toán.'); }
    finally { setConfirmLoading(false); setConfirmPayment(null); }
  };

  // Cấu hình cột bảng giao dịch
  const columns = [
    {
      title: 'Mã GD',
      key: 'id',
      render: (val) => (
        <span className="font-mono font-semibold text-gray-900 dark:text-gray-100 text-xs">
          {val}
        </span>
      ),
    },
    {
      title: 'Mã đơn',
      key: 'orderId',
      render: (val) => (
        <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded text-xs">
          {val}
        </span>
      ),
    },
    {
      title: 'Cổng thanh toán',
      key: 'gateway',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300 font-bold shrink-0">
            {row.gatewayCode === 'momo' ? (
              <span className="text-pink-600 font-extrabold text-[10px]">MO</span>
            ) : row.gatewayCode === 'vnpay' ? (
              <span className="text-blue-600 font-extrabold text-[10px]">VN</span>
            ) : row.gatewayCode === 'vietqr' ? (
              <span className="text-emerald-600 font-extrabold text-[10px]">QR</span>
            ) : (
              <CreditCard className="w-3.5 h-3.5 text-gray-500" />
            )}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {val}
          </span>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      key: 'amount',
      render: (val) => (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
          {formatVnd(val)}
        </span>
      ),
    },
    {
      title: 'Mã GD cổng',
      key: 'gatewayTransId',
      render: (val) => (
        <span className="font-mono text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-2 py-0.5 rounded">
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (val) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
          {val}
        </span>
      ),
    },
    {
      // Yêu cầu: Cột "Admin xác nhận" chỉ hiện họ tên admin hoặc "Tự động"
      title: 'Admin xác nhận',
      key: 'confirmedBy',
      render: (val) => {
        if (!val || val === '—') return <span className="text-gray-400 text-xs">—</span>;
        if (val.toLowerCase().includes('tự động')) {
          return <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Tự động</span>;
        }
        // Chuẩn hóa chỉ giữ họ tên admin (loại bỏ prefix "Admin " nếu có)
        const cleanName = val.replace(/^Admin\s+/i, '').replace(/\s*\(.*\)/, '').trim();
        return (
          <span className="text-xs text-gray-800 dark:text-gray-200 font-medium">
            {cleanName}
          </span>
        );
      },
    },
    {
      // Yêu cầu: Cột Thao tác: chỉ dòng "Chờ xử lý" có nút "Xác nhận thủ công", các dòng khác hiện "—"
      title: 'Thao tác',
      key: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmPayment(row)}
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950/40 text-xs py-1 px-2.5 flex items-center gap-1 font-medium"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Xác nhận thủ công
            </Button>
          ) : (
            <span className="text-xs text-gray-400 px-2">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thanh toán"
        subtitle="Quản lý cổng thanh toán trực tuyến và đối soát dòng tiền giao dịch"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Kinh doanh' },
          { label: 'Thanh toán' },
        ]}
        actions={
          <Button
            onClick={handleOpenAddGateway}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Thêm cổng thanh toán
          </Button>
        }
      />

      {/* ─── KHU VỰC QUẢN LÝ CỔNG THANH TOÁN DẠNG THẺ ────────────────────────── */}
      {/* Yêu cầu: Thẻ cổng chỉ giữ tên cổng, phí giao dịch và công tắc kích hoạt (xóa mã cổng, mô tả, badge Đang bật/Tạm dừng) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Cổng thanh toán liên kết
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cấu hình tỷ lệ phí và kích hoạt phương thức thanh toán cho học viên
            </p>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
            {gateways.filter((g) => g.isActive).length}/{gateways.length} cổng đang hoạt động
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {gateways.map((gw) => (
            <div
              key={gw.id}
              className={`p-4 rounded-xl border transition-all duration-200 bg-white dark:bg-gray-900 flex flex-col justify-between ${
                gw.isActive
                  ? 'border-indigo-200 dark:border-indigo-900/50 shadow-sm hover:shadow-md'
                  : 'border-gray-200 dark:border-gray-800 opacity-70 bg-gray-50/50 dark:bg-gray-900/40'
              }`}
            >
              <div>
                {/* Header card: Tên cổng + Công tắc kích hoạt */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate"
                        title={gw.name}
                      >
                        {gw.name}
                      </h3>
                    </div>
                  </div>

                  {/* Công tắc kích hoạt Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={gw.isActive}
                      onChange={() => handleToggleGateway(gw.id, gw.isActive)}
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Phí giao dịch */}
                <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Phí giao dịch:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">
                    {gw.feePercent === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        0% (Miễn phí)
                      </span>
                    ) : (
                      `${gw.feePercent}%`
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── BẢNG GIAO DỊCH THANH TOÁN ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo mã GD, mã đơn, mã cổng, học viên..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Select
                value={gatewayFilter}
                onChange={(e) => setGatewayFilter(e.target.value)}
                options={[
                  { value: '', label: 'Tất cả cổng' },
                  ...gateways.map((g) => ({ value: g.code, label: g.name })),
                ]}
              />
            </div>

            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>

            {(search || gatewayFilter || statusFilter) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setGatewayFilter('');
                  setStatusFilter('');
                }}
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        {/* Bảng */}
        <Table
          columns={columns}
          data={filteredPayments}
          emptyText="Không tìm thấy giao dịch thanh toán nào phù hợp."
        />
      </div>

      {/* ─── MODAL THÊM / SỬA CỔNG THANH TOÁN ──────────────────────────────── */}
      <Modal
        isOpen={isGatewayModalOpen}
        onClose={() => setIsGatewayModalOpen(false)}
        title={editingGateway ? 'Sửa cổng thanh toán' : 'Thêm cổng thanh toán mới'}
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsGatewayModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveGateway}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {editingGateway ? 'Lưu thay đổi' : 'Thêm cổng'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveGateway} className="space-y-4 py-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên cổng thanh toán <span className="text-red-500">*</span>
            </label>
            <Input
              value={gatewayFormData.name}
              onChange={(e) =>
                setGatewayFormData({ ...gatewayFormData, name: e.target.value })
              }
              placeholder="VD: Cổng thanh toán ZaloPay QR"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phí giao dịch (%)
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={gatewayFormData.feePercent}
                onChange={(e) =>
                  setGatewayFormData({
                    ...gatewayFormData,
                    feePercent: e.target.value,
                  })
                }
                placeholder="VD: 1.5"
              />
              <p className="text-[11px] text-gray-400 mt-1">Để 0 nếu miễn phí</p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="isActiveGateway"
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
              checked={gatewayFormData.isActive}
              onChange={(e) =>
                setGatewayFormData({
                  ...gatewayFormData,
                  isActive: e.target.checked,
                })
              }
            />
            <label
              htmlFor="isActiveGateway"
              className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
            >
              Kích hoạt cổng này ngay lập tức cho học viên sử dụng
            </label>
          </div>
        </form>
      </Modal>

      {/* ─── CONFIRM DIALOG XÁC NHẬN THỦ CÔNG ─────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!confirmPayment}
        onClose={() => setConfirmPayment(null)}
        onConfirm={handleConfirmManualPayment}
        title="Xác nhận thanh toán thủ công"
        description={`Bạn có chắc chắn muốn xác nhận giao dịch "${confirmPayment?.id}" của đơn hàng "${confirmPayment?.orderId}" với số tiền ${formatVnd(confirmPayment?.amount)} không? Trạng thái sẽ chuyển thành Thành công và kích hoạt khóa học cho học viên.`}
        confirmLabel="Xác nhận thành công"
        cancelLabel="Hủy bỏ"
        variant="warning"
        loading={confirmLoading}
      />
    </div>
  );
}
