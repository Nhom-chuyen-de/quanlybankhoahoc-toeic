// src/pages/admin/OrdersPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  ShoppingCart, Filter, Eye, Receipt, Printer,
  CreditCard, FileText, CheckCircle2
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
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { orderService, paymentService } from '../../services/adminService';

const formatVnd = (value) => {
  if (value === null || value === undefined || value === 0) return '0 ₫';
  return `${value.toLocaleString('vi-VN')} ₫`;
};

// Đổi nhãn trạng thái "Chờ xử lý" thành "Chờ thanh toán"
const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'pending', label: 'Chờ thanh toán' },
  { value: 'paid', label: 'Đã thanh toán' },
  { value: 'failed', label: 'Thất bại' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'partial_refunded', label: 'Hoàn tiền một phần' },
  { value: 'refunded', label: 'Đã hoàn tiền' },
];

export default function OrdersPage() {
  const toast = useToastContext();
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    orderService.getOrders({ page: 1, limit: 100 }).then((response) => setOrders(response || []))
      .catch((error) => toast.error(error.message || 'Không tải được đơn hàng.'));
  }, []);

  const openOrder = async (row) => {
    setSelectedOrder(row);
    try {
      const response = await orderService.getOrderById(row.id);
      setSelectedOrder(response);
    } catch (error) {
      toast.error(error.message || 'Không tải được chi tiết đơn hàng.');
    }
  };

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Drawer chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Modal xem trước hóa đơn
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // ConfirmDialog xuất hóa đơn
  const [isExportConfirmOpen, setIsExportConfirmOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // ConfirmDialog xác nhận thanh toán thủ công
  const [manualConfirmPayment, setManualConfirmPayment] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Helper chuyển chuỗi ngày dd/MM/yyyy hoặc dd/MM/yyyy HH:mm sang timestamp so sánh
  const parseDateTimestamp = (str) => {
    if (!str) return null;
    const match = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return new Date(`${year}-${month}-${day}T00:00:00`).getTime();
    }
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const year = isoMatch[1];
      const month = isoMatch[2].padStart(2, '0');
      const day = isoMatch[3].padStart(2, '0');
      return new Date(`${year}-${month}-${day}T00:00:00`).getTime();
    }
    return null;
  };

  const filteredOrders = useMemo(() => {
    const fromTs = parseDateTimestamp(fromDate);
    const toTs = parseDateTimestamp(toDate);

    return orders.filter((o) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.user.toLowerCase().includes(q) ||
        (o.userEmail || o.email || '').toLowerCase().includes(q);

      const matchStatus = !statusFilter || o.status === statusFilter;

      let matchDate = true;
      if (fromTs || toTs) {
        const orderTs = parseDateTimestamp(o.createdAt);
        if (orderTs) {
          if (fromTs && orderTs < fromTs) matchDate = false;
          if (toTs && orderTs > toTs + 86400000 - 1) matchDate = false;
        }
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, search, statusFilter, fromDate, toDate]);

  // Xử lý xác nhận xuất hóa đơn
  const handleConfirmExportInvoice = () => {
    if (!selectedOrder) return;
    setExportLoading(true);

    orderService.createInvoice(selectedOrder.id).then((data) => {
      const updatedOrder = { ...selectedOrder, invoice: { number: data.invoiceNumber } };
      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o)));
      setExportLoading(false);
      setIsExportConfirmOpen(false);
      toast.success('Đã xuất hóa đơn');
    }).catch((error) => { setExportLoading(false); toast.error(error.message || 'Không xuất được hóa đơn.'); });
  };

  // Xử lý xác nhận thanh toán thủ công cho mốc Chờ xử lý
  const handleConfirmManualPayment = () => {
    if (!manualConfirmPayment || !selectedOrder) return;
    setConfirmLoading(true);

    paymentService.confirm(manualConfirmPayment.id).then(async () => {
      const updatedOrder = await orderService.getOrderById(selectedOrder.id);
      setSelectedOrder(updatedOrder);
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: 'paid' } : o));

      setConfirmLoading(false);
      setManualConfirmPayment(null);
      toast.success(
        `Xác nhận thành công giao dịch ${manualConfirmPayment.id} (${formatVnd(manualConfirmPayment.amount)})!`
      );
    }).catch((error) => toast.error(error.message || 'Không xác nhận được thanh toán.'))
      .finally(() => { setConfirmLoading(false); setManualConfirmPayment(null); });
  };

  const columns = [
    {
      key: 'id',
      title: 'Mã đơn hàng',
      render: (_, row) => {
        const displayCode = row.id.slice(0, 8);
        return (
          <div
            onClick={() => openOrder(row)}
            className="cursor-pointer group"
          >
            <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              #{displayCode}
            </span>
          </div>
        );
      },
    },
    {
      key: 'user',
      title: 'Học viên',
      render: (_, row) => (
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{row.user}</p>
          <p className="text-xs text-gray-400 truncate">{row.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'couponCode',
      title: 'Mã giảm giá',
      render: (v) =>
        v ? (
          <Badge color="purple" size="xs">
            {v}
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: 'totalAmount',
      title: 'Tổng tiền',
      render: (v) => (
        <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">
          {formatVnd(v)}
        </span>
      ),
    },
    {
      key: 'discountAmount',
      title: 'Số tiền giảm',
      render: (v) =>
        v > 0 ? (
          <span className="font-medium text-emerald-600 dark:text-emerald-400 text-sm">
            -{formatVnd(v)}
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: 'finalAmount',
      title: 'Phải trả',
      render: (v) => (
        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
          {formatVnd(v)}
        </span>
      ),
    },
    {
      // Đổi nhãn trạng thái "Chờ xử lý" thành "Chờ thanh toán"
      key: 'status',
      title: 'Trạng thái',
      render: (v) =>
        v === 'pending' ? (
          <Badge color="yellow" size="xs">
            Chờ thanh toán
          </Badge>
        ) : (
          <StatusBadge status={v} size="xs" />
        ),
    },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      render: (v) => (
        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">
          {v}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Thao tác',
      headerClass: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Xem chi tiết đơn hàng"
            onClick={() => openOrder(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý Đơn hàng"
        subtitle={`Theo dõi doanh số và trạng thái của ${orders.length} đơn hàng trong hệ thống`}
        breadcrumbs={[{ label: 'Admin', path: '/admin' }, { label: 'Kinh doanh' }, { label: 'Đơn hàng' }]}
      />

      {/* ─── BỘ LỌC TÌM KIẾM ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Tìm kiếm
          </label>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Tìm học viên, mã đơn..."
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Trạng thái đơn
          </label>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Từ ngày
          </label>
          <Input
            type="text"
            placeholder="dd/MM/yyyy HH:mm"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Đến ngày
          </label>
          <Input
            type="text"
            placeholder="dd/MM/yyyy HH:mm"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div>
          {(search || statusFilter || fromDate || toDate) ? (
            <Button
              variant="ghost"
              size="sm"
              icon={Filter}
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
              }}
              className="w-full h-10 text-xs"
            >
              Xóa bộ lọc
            </Button>
          ) : (
            <div className="h-10" />
          )}
        </div>
      </div>

      {/* ─── BẢNG ĐƠN HÀNG ────────────────────────────────────────────────── */}
      <Table
        columns={columns}
        data={filteredOrders}
        pageSize={8}
        emptyState={
          <EmptyState
            icon={ShoppingCart}
            title="Không tìm thấy đơn hàng"
            description="Hãy thử thay đổi khoảng ngày, từ khóa hoặc trạng thái lọc"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setFromDate('');
                  setToDate('');
                }}
              >
                Đặt lại bộ lọc
              </Button>
            }
          />
        }
      />

      {/* ─── DRAWER CHI TIẾT ĐƠN HÀNG ─────────────────────────────────────── */}
      <Drawer
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `Đơn hàng #${selectedOrder.id}` : 'Chi tiết đơn hàng'}
        width="w-full sm:w-[560px] lg:w-[600px]"
        footer={
          <div className="flex items-center justify-end w-full">
            <Button variant="secondary" onClick={() => setSelectedOrder(null)}>
              Đóng
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-6">
            {/* 1. Thẻ thông tin khách hàng & đơn hàng */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Mã đơn: #{selectedOrder.id}
                </span>
                {selectedOrder.status === 'pending' ? (
                  <Badge color="yellow" size="xs">
                    Chờ thanh toán
                  </Badge>
                ) : (
                  <StatusBadge status={selectedOrder.status} size="xs" />
                )}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Khách hàng:</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{selectedOrder.user}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Số điện thoại:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200">{selectedOrder.userPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[11px]">Email:</span>
                  <span className="text-gray-700 dark:text-gray-300">{selectedOrder.userEmail}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[11px]">Thời gian đặt hàng:</span>
                  <span className="font-mono text-gray-600 dark:text-gray-400">{selectedOrder.createdAt}</span>
                </div>
              </div>
            </div>

            {/* 2. Danh sách khóa học trong đơn (CHỈ hiện đơn giá, bỏ Số lượng) */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Danh sách khóa học đăng ký
              </h4>

              <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 text-xs flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
                        {item.courseName}
                      </p>
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        Đơn giá: {formatVnd(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-gray-100 shrink-0 text-sm font-mono">
                      {formatVnd(item.amount || item.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Tóm tắt thanh toán */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2.5 text-xs">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wider text-gray-400 mb-2">
                Tóm tắt thanh toán
              </h4>

              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                <span>Tổng tiền khóa học:</span>
                <span className="font-medium font-mono">{formatVnd(selectedOrder.totalAmount)}</span>
              </div>

              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>
                  Giảm giá {selectedOrder.couponCode && `(Mã ${selectedOrder.couponCode})`}:
                </span>
                <span className="font-medium font-mono">
                  {selectedOrder.discountAmount > 0 ? `-${formatVnd(selectedOrder.discountAmount)}` : '0 ₫'}
                </span>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                <span className="font-bold text-gray-900 dark:text-gray-100">Số tiền phải trả:</span>
                <span className="font-black text-indigo-600 dark:text-indigo-400 text-base font-mono">
                  {formatVnd(selectedOrder.finalAmount)}
                </span>
              </div>
            </div>

            {/* 4. KHỐI LỊCH SỬ THANH TOÁN (Timeline dọc, mới nhất ở trên) */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Lịch sử thanh toán
              </h4>

              {(!selectedOrder.payments || selectedOrder.payments.length === 0) ? (
                <div className="py-6 px-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center bg-gray-50/50 dark:bg-gray-800/40">
                  <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Chưa có giao dịch thanh toán
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2.5 before:bottom-2.5 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                  {selectedOrder.payments.map((p) => {
                    const isSuccess = p.status === 'success';
                    const isPending = p.status === 'pending';
                    const isFailed = p.status === 'failed';

                    const dotColor = isSuccess
                      ? 'bg-emerald-500 ring-emerald-100 dark:ring-emerald-950/50'
                      : isPending
                      ? 'bg-amber-500 ring-amber-100 dark:ring-amber-950/50 animate-pulse'
                      : isFailed
                      ? 'bg-red-500 ring-red-100 dark:ring-red-950/50'
                      : 'bg-gray-400 ring-gray-100 dark:ring-gray-800';

                    return (
                      <div key={p.id} className="relative">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-6 top-2 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ring-4 ${dotColor}`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                        </div>

                        {/* Thẻ nội dung mốc thanh toán */}
                        <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2 text-xs shadow-sm">
                          {/* Dòng 1: Mã thanh toán, Cổng thanh toán, Badge trạng thái */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                                {p.id}
                              </span>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span className="font-medium text-gray-800 dark:text-gray-200">
                                {p.gateway}
                              </span>
                            </div>

                            <div>
                              {p.status === 'pending' ? (
                                <Badge color="yellow" size="xs">Chờ xử lý</Badge>
                              ) : p.status === 'success' ? (
                                <Badge color="green" size="xs">Thành công</Badge>
                              ) : p.status === 'failed' ? (
                                <Badge color="red" size="xs">Thất bại</Badge>
                              ) : (
                                <Badge color="gray" size="xs">Đã hủy</Badge>
                              )}
                            </div>
                          </div>

                          {/* Dòng 2: Số tiền & Mã giao dịch của cổng (font đơn cách) */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {formatVnd(p.amount)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-gray-400">Mã GD cổng:</span>
                              <span className="font-mono text-xs bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                                {p.transactionCode || '—'}
                              </span>
                            </div>
                          </div>

                          {/* Dòng 3: Thời gian tạo & Xác nhận bởi */}
                          <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-500 dark:text-gray-400">
                            <span className="font-mono">{p.time}</span>
                            {p.confirmedBy ? (
                              <span className="text-gray-700 dark:text-gray-300 font-medium">
                                {p.confirmedBy.toLowerCase().includes('tự động')
                                  ? 'Tự động'
                                  : `Xác nhận bởi: ${p.confirmedBy.replace(/^Admin\s+/i, '')}`}
                              </span>
                            ) : (
                              <span>—</span>
                            )}
                          </div>

                          {/* Nút nhỏ Xác nhận thủ công nếu Chờ xử lý */}
                          {p.status === 'pending' && (
                            <div className="pt-2 flex justify-end">
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => setManualConfirmPayment(p)}
                                className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-700 dark:hover:bg-emerald-950/40 text-[11px] py-1 px-2.5 flex items-center gap-1 font-medium"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Xác nhận thủ công
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 5. KHỐI HÓA ĐƠN (Ngay dưới Lịch sử thanh toán) */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                Hóa đơn
              </h4>

              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3 text-xs">
                {selectedOrder.invoice ? (
                  // Đơn ĐÃ có hóa đơn
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Số hóa đơn:</span>
                        <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">
                          {selectedOrder.invoice.number}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Ngày xuất:</span>
                        <span className="font-mono text-gray-800 dark:text-gray-200">
                          {selectedOrder.invoice.issuedAt}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 block text-[11px]">Người xuất:</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {selectedOrder.invoice.issuer}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        Xem hóa đơn
                      </Button>
                    </div>
                  </div>
                ) : selectedOrder.status === 'paid' ? (
                  // Đơn ĐÃ thanh toán và CHƯA có hóa đơn
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        Chưa xuất hóa đơn
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        Đơn hàng đã thanh toán, sẵn sàng xuất hóa đơn điện tử VAT.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsExportConfirmOpen(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 flex items-center gap-1.5 font-medium"
                    >
                      <FileText className="w-4 h-4" />
                      Xuất hóa đơn
                    </Button>
                  </div>
                ) : ['partial_refunded', 'refunded'].includes(selectedOrder.status) ? (
                  // Đơn Hoàn tiền một phần hoặc Đã hoàn tiền mà chưa có hóa đơn
                  <div className="py-1">
                    <p className="text-xs text-gray-400 italic">
                      Không thể xuất hóa đơn mới cho đơn hàng ở trạng thái hoàn tiền.
                    </p>
                  </div>
                ) : (
                  // Đơn ở trạng thái khác: chờ thanh toán, thất bại, đã hủy
                  <div className="py-1">
                    <p className="text-xs text-gray-400 italic">
                      Chưa thể xuất hóa đơn vì đơn chưa được thanh toán
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* ─── MODAL XEM HÓA ĐƠN (Dạng bản xem trước tờ hóa đơn trên nền trắng) ── */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Bản xem trước hóa đơn điện tử"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Hóa đơn điện tử có giá trị pháp lý theo Nghị định 123/2020/NĐ-CP
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsInvoiceModalOpen(false)}
              >
                Đóng
              </Button>
              <Button
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 font-medium"
              >
                <Printer className="w-4 h-4" />
                In hóa đơn
              </Button>
            </div>
          </div>
        }
      >
        {/* Style để khi window.print() chỉ in tờ hóa đơn */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-sheet, #printable-invoice-sheet * {
              visibility: visible !important;
            }
            #printable-invoice-sheet {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: auto !important;
              padding: 24px !important;
              margin: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              box-shadow: none !important;
              border: none !important;
              z-index: 999999 !important;
            }
          }
        `}</style>

        {selectedOrder && selectedOrder.invoice && (
          <div
            id="printable-invoice-sheet"
            className="bg-white text-gray-900 p-8 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto space-y-6"
          >
            {/* Header: Tên hệ thống "TOEIC/IELTS", Tiêu đề "HÓA ĐƠN", Số HĐ, Ngày xuất */}
            <div className="border-b border-gray-200 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      TI
                    </div>
                    <span className="text-lg font-black tracking-tight text-indigo-700">
                      TOEIC/IELTS
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Hệ thống Đào tạo & Khảo thí Tiếng Anh Trực tuyến
                  </p>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-mono text-xs font-semibold">
                    Mã đơn: #{selectedOrder.id}
                  </span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <h1 className="text-2xl font-black tracking-wider text-gray-900 uppercase">
                  HÓA ĐƠN
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  (Bản thể hiện của hóa đơn điện tử dịch vụ đào tạo)
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-gray-600 pt-3 border-t border-dashed border-gray-200">
                <div>
                  <span className="text-gray-500">Số hóa đơn: </span>
                  <span className="font-mono font-bold text-gray-900">
                    {selectedOrder.invoice.number}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Ngày xuất: </span>
                  <span className="font-mono font-semibold text-gray-900">
                    {selectedOrder.invoice.issuedAt}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin khách hàng: họ tên, email, số điện thoại */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-xs space-y-1.5">
              <h4 className="font-bold text-gray-800 uppercase tracking-wide text-[11px] mb-2 text-indigo-900">
                Thông tin khách hàng
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Họ và tên: </span>
                  <span className="font-semibold text-gray-900">{selectedOrder.user}</span>
                </div>
                <div>
                  <span className="text-gray-500">Số điện thoại: </span>
                  <span className="font-mono text-gray-900">{selectedOrder.userPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Email: </span>
                  <span className="text-gray-900">{selectedOrder.userEmail}</span>
                </div>
              </div>
            </div>

            {/* Bảng khóa học: STT, tên khóa học, đơn giá */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                    <th className="py-2.5 px-3">Tên khóa học</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-2.5 px-3 text-center text-gray-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">
                        {item.courseName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-gray-900 font-mono">
                        {formatVnd(item.unitPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cuối: Tổng tiền khóa học, Giảm giá (kèm mã giảm giá nếu có), Số tiền đã thanh toán (in đậm) */}
            <div className="space-y-2 border-t border-gray-200 pt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tổng tiền khóa học:</span>
                <span className="font-medium font-mono">{formatVnd(selectedOrder.totalAmount)}</span>
              </div>

              <div className="flex justify-between text-emerald-600">
                <span>
                  Giảm giá {selectedOrder.couponCode ? `(Mã: ${selectedOrder.couponCode})` : ''}:
                </span>
                <span className="font-medium font-mono">
                  {selectedOrder.discountAmount > 0 ? `-${formatVnd(selectedOrder.discountAmount)}` : '0 ₫'}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm pt-2 border-t border-dashed border-gray-200">
                <span className="font-bold text-gray-900">Số tiền đã thanh toán:</span>
                <span className="font-black text-indigo-700 text-base font-mono">
                  {formatVnd(selectedOrder.finalAmount)}
                </span>
              </div>
            </div>

            {/* Chữ ký điện tử & bên lập */}
            <div className="pt-6 grid grid-cols-2 text-center text-xs text-gray-500">
              <div>
                <p className="font-semibold text-gray-800">Người mua hàng</p>
                <p className="text-[11px] text-gray-400 mt-0.5">(Ký, ghi rõ họ tên)</p>
                <div className="h-14 flex items-end justify-center">
                  <span className="font-medium text-gray-700">{selectedOrder.user}</span>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-800">Người lập hóa đơn</p>
                <p className="text-[11px] text-gray-400 mt-0.5">(Ký điện tử)</p>
                <div className="h-14 flex flex-col items-center justify-end">
                  <span className="text-[11px] text-emerald-600 font-medium">✓ Đã ký điện tử</span>
                  <span className="font-semibold text-gray-800">{selectedOrder.invoice.issuer}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── CONFIRM DIALOG XUẤT HÓA ĐƠN ──────────────────────────────────── */}
      <ConfirmDialog
        isOpen={isExportConfirmOpen}
        onClose={() => setIsExportConfirmOpen(false)}
        onConfirm={handleConfirmExportInvoice}
        title="Xác nhận xuất hóa đơn điện tử"
        description={`Bạn có chắc chắn muốn xuất hóa đơn cho đơn hàng #${selectedOrder?.id} (${formatVnd(selectedOrder?.finalAmount)}) của học viên ${selectedOrder?.user}? Sau khi xuất, học viên và quản trị viên có thể xem và in hóa đơn bất cứ lúc nào.`}
        confirmLabel="Xuất hóa đơn"
        cancelLabel="Hủy"
        variant="warning"
        loading={exportLoading}
      />

      {/* ─── CONFIRM DIALOG XÁC NHẬN THANH TOÁN THỦ CÔNG ───────────────────── */}
      <ConfirmDialog
        isOpen={!!manualConfirmPayment}
        onClose={() => setManualConfirmPayment(null)}
        onConfirm={handleConfirmManualPayment}
        title="Xác nhận thanh toán thủ công"
        description={`Bạn có chắc chắn muốn xác nhận giao dịch "${manualConfirmPayment?.id}" của đơn hàng "${selectedOrder?.id}" với số tiền ${formatVnd(manualConfirmPayment?.amount)} không? Trạng thái sẽ chuyển thành Thành công và đơn hàng sẽ được cập nhật thành Đã thanh toán.`}
        confirmLabel="Xác nhận thành công"
        cancelLabel="Hủy"
        variant="warning"
        loading={confirmLoading}
      />
    </div>
  );
}
