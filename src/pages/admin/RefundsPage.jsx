// src/pages/admin/RefundsPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw, Search, Filter, Eye, CheckCircle, XCircle,
  Clock, AlertCircle, Building2, User, CreditCard, FileText,
  DollarSign, Check, X, ArrowUpRight, MessageSquare
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Drawer from '../../components/ui/Drawer';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/shared/EmptyState';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { refundService } from '../../services/adminService';

const formatVnd = (value) => {
  if (value === null || value === undefined || value === 0) return '0 ₫';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'approved', label: 'Đã chấp nhận' },
  { value: 'rejected', label: 'Từ chối' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

export default function RefundsPage() {
  const toast = useToastContext();
  const [refunds, setRefunds] = useState([]);
  const loadRefunds = () => refundService.list({ page: 1, limit: 100 }).then((r) => setRefunds(r || []));
  useEffect(() => { loadRefunds().catch((e) => toast.error(e.message || 'Không tải được yêu cầu hoàn tiền.')); }, []);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Drawer chi tiết xử lý
  const [selectedRefund, setSelectedRefund] = useState(null);

  // Modal từ chối yêu cầu
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Lọc dữ liệu
  const filteredRefunds = useMemo(() => {
    return refunds.filter((item) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        (item.user || '').toLowerCase().includes(q) ||
        (item.userEmail || '').toLowerCase().includes(q) ||
        (item.paymentId || '').toLowerCase().includes(q) ||
        (item.orderId || '').toLowerCase().includes(q) ||
        (item.reason || '').toLowerCase().includes(q);

      const matchStatus = !statusFilter || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [refunds, search, statusFilter]);

  const getNowStr = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/2026 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };

  // Hành động: Chấp nhận yêu cầu hoàn tiền
  const handleApprove = async () => {
    if (!selectedRefund) return;
    try { await refundService.approve(selectedRefund.id); await loadRefunds(); setSelectedRefund((r) => ({ ...r, status: 'approved' })); toast.success(`Đã chấp nhận yêu cầu hoàn tiền ${selectedRefund.id}!`); }
    catch (e) { toast.error(e.message || 'Không thể chấp nhận yêu cầu.'); }
  };

  // Hành động: Mở modal từ chối
  const handleOpenReject = () => {
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  // Xác nhận từ chối kèm lý do
  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối yêu cầu hoàn tiền');
      return;
    }

    try { await refundService.reject(selectedRefund.id, rejectReason.trim()); await loadRefunds(); setSelectedRefund((r) => ({ ...r, status: 'rejected', adminNote: `Từ chối: ${rejectReason}` })); setIsRejectModalOpen(false); toast.success(`Đã từ chối yêu cầu hoàn tiền ${selectedRefund.id}.`); }
    catch (e) { toast.error(e.message || 'Không thể từ chối yêu cầu.'); }
  };

  // Hành động: Đánh dấu đã hoàn tiền
  const handleMarkAsRefunded = async () => {
    if (!selectedRefund) return;
    try { await refundService.complete(selectedRefund.id); await loadRefunds(); setSelectedRefund((r) => ({ ...r, status: 'refunded' })); toast.success(`Đã đánh dấu hoàn tất chuyển tiền cho yêu cầu ${selectedRefund.id}!`); }
    catch (e) { toast.error(e.message || 'Không thể hoàn tất yêu cầu.'); }
  };

  // Cấu hình bảng
  const columns = [
    {
      title: 'Học viên',
      key: 'user',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center justify-center shrink-0">
            {val ? val.split(' ').slice(-1)[0][0] : 'U'}
          </div>
          <div>
            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm block">
              {val}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 block">
              {row.userEmail}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Mã thanh toán',
      key: 'paymentId',
      render: (val, row) => (
        <div>
          <span className="font-mono text-xs font-semibold text-gray-800 dark:text-gray-200 block">
            {val}
          </span>
          <span className="font-mono text-[11px] text-gray-400 block">
            Đơn: {row.orderId}
          </span>
        </div>
      ),
    },
    {
      title: 'Lý do hoàn tiền',
      key: 'reason',
      render: (val, row) => (
        <div className="max-w-xs">
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 block truncate" title={row.courseName}>
            {row.courseName}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic" title={val}>
            "{val}"
          </span>
        </div>
      ),
    },
    {
      title: 'Số tiền hoàn',
      key: 'refundAmount',
      render: (val) => (
        <span className="font-semibold text-red-600 dark:text-red-400 text-sm">
          {formatVnd(val)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (val) => <StatusBadge status={val} />,
    },
    {
      title: 'Ngày yêu cầu',
      key: 'requestDate',
      render: (val) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {val}
        </span>
      ),
    },
    {
      title: 'Ngày xử lý',
      key: 'processedDate',
      render: (val) => (
        <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium">
          {val || '—'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, row) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedRefund(row)}
          className="text-xs flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40"
        >
          <Eye className="w-3.5 h-3.5" />
          {row.status === 'pending' ? 'Xử lý ngay' : 'Chi tiết'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yêu cầu hoàn tiền"
        subtitle="Tiếp nhận, thẩm định và xử lý hoàn trả học phí cho học viên"
        breadcrumbs={[
          { label: 'Admin', path: '/admin' },
          { label: 'Kinh doanh' },
          { label: 'Hoàn tiền' },
        ]}
      />

      {/* ─── BẢNG DANH SÁCH HOÀN TIỀN ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Tìm theo học viên, email, mã GD, mã đơn, lý do..."
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="w-52">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
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
                className="text-gray-500 hover:text-gray-700 text-xs"
              >
                Đặt lại
              </Button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredRefunds}
          emptyText="Không có yêu cầu hoàn tiền nào phù hợp bộ lọc."
        />
      </div>

      {/* ─── DRAWER XỬ LÝ HOÀN TIỀN ─────────────────────────────────────────── */}
      <Drawer
        isOpen={!!selectedRefund}
        onClose={() => setSelectedRefund(null)}
        title={
          selectedRefund ? `Xử lý yêu cầu hoàn tiền ${selectedRefund.id}` : ''
        }
        size="md"
      >
        {selectedRefund && (
          <div className="space-y-6 pb-12">
            {/* Header thông tin nhanh */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500 uppercase font-semibold">
                  Số tiền đề nghị hoàn
                </span>
                <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                  {formatVnd(selectedRefund.refundAmount)}
                </p>
              </div>
              <div>
                <StatusBadge status={selectedRefund.status} />
              </div>
            </div>

            {/* Thông tin đơn hàng gốc */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 dark:border-gray-800">
                <FileText className="w-4 h-4 text-indigo-600" />
                Thông tin đơn hàng & thanh toán gốc
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-500 block mb-0.5">Mã đơn hàng:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRefund.orderId}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-gray-500 block mb-0.5">Mã thanh toán:</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRefund.paymentId}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-1">
                <span className="text-gray-500 block">Khóa học đăng ký:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  {selectedRefund.courseName}
                </span>
              </div>
            </div>

            {/* Thông tin học viên & Tài khoản nhận */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 dark:border-gray-800">
                <User className="w-4 h-4 text-indigo-600" />
                Học viên & Tài khoản thụ hưởng
              </h4>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Họ tên:</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedRefund.user}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedRefund.userEmail}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-semibold">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Tài khoản nhận tiền hoàn trả:</span>
                </div>
                <p className="font-mono text-gray-800 dark:text-gray-200 font-medium pl-6">
                  {selectedRefund.bankAccount}
                </p>
              </div>
            </div>

            {/* Lý do và dòng thời gian */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 border-b pb-2 dark:border-gray-800">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Lý do hoàn trả từ học viên
              </h4>
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed italic">
                "{selectedRefund.reason}"
              </div>
            </div>

            {/* Ghi chú quản trị & Ngày xử lý */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b dark:border-gray-800">
                <span className="text-gray-500">Ngày học viên gửi yêu cầu:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedRefund.requestDate}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-800">
                <span className="text-gray-500">Ngày hoàn tất thẩm định:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {selectedRefund.processedDate || 'Chưa xử lý'}
                </span>
              </div>
              {selectedRefund.adminNote && (
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg mt-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Ghi chú của Admin:
                  </span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRefund.adminNote}
                  </p>
                </div>
              )}
            </div>

            {/* ─── KHU VỰC CÁC NÚT HÀNH ĐỘNG ─────────────────────────────────── */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Thao tác phê duyệt
              </h5>

              {/* Nút Chấp nhận & Từ chối (chỉ khi đang chờ xử lý) */}
              {selectedRefund.status === 'pending' && (
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleApprove}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Chấp nhận yêu cầu
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenReject}
                    className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/40 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium"
                  >
                    <XCircle className="w-4 h-4" />
                    Từ chối
                  </Button>
                </div>
              )}

              {/* Nút Đánh dấu đã hoàn tiền (khi đã chấp nhận hoặc đang pending) */}
              {selectedRefund.status === 'approved' && (
                <Button
                  onClick={handleMarkAsRefunded}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 py-2.5 text-xs font-medium"
                >
                  <Check className="w-4 h-4" />
                  Đánh dấu đã hoàn tiền thành công
                </Button>
              )}

              {/* Khi đã hoàn tất */}
              {(selectedRefund.status === 'refunded' || selectedRefund.status === 'rejected') && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl text-center text-xs text-gray-500 font-medium">
                  Yêu cầu này đã được đóng với kết quả:{' '}
                  <strong className="text-gray-900 dark:text-gray-100">
                    {selectedRefund.status === 'refunded' ? 'Đã hoàn trả tiền' : 'Đã từ chối'}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── MODAL NHẬP LÝ DO TỪ CHỐI ────────────────────────────────────────── */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Từ chối yêu cầu hoàn tiền"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsRejectModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
      >
        <form onSubmit={handleConfirmReject} className="space-y-3 py-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ghi lý do để Admin tham khảo khi xử lý yêu cầu:
          </p>
          <textarea
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-2.5 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="VD: Không đủ điều kiện hoàn trả do đã học vượt quá 30% thời lượng khóa học..."
            required
          />
        </form>
      </Modal>
    </div>
  );
}
