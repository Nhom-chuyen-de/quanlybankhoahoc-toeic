// src/pages/admin/ReportsPage.jsx
import { useState, useMemo } from 'react';
import {
  BarChart3, Users, BookOpen, TrendingUp, Download,
  Filter, Plus, Trash2, Clock, RefreshCw
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToastContext } from '../../contexts/ToastContext';
import { reportCategories, mockGeneratedReports } from '../../mock/reports';

// TODO: nối API
// - GET /api/admin/reports (Danh sách báo cáo đã tạo)
// - POST /api/admin/reports/generate (Yêu cầu sinh báo cáo mới)
// - GET /api/admin/reports/:id/download (Tải file báo cáo)
// - DELETE /api/admin/reports/:id (Xóa báo cáo lưu trữ)

const categoryIconMap = {
  Users: Users,
  BookOpen: BookOpen,
  TrendingUp: TrendingUp,
};

const formatBadge = {
  XLSX: { variant: 'green', label: 'Excel (.xlsx)' },
  PDF: { variant: 'red', label: 'PDF (.pdf)' },
  CSV: { variant: 'blue', label: 'CSV (.csv)' },
};

export default function ReportsPage() {
  const toast = useToastContext();
  const showToast = (msg, type = 'success') => {
    if (typeof toast === 'function') toast(msg, type);
    else if (toast?.showToast) toast.showToast(msg, type);
    else if (type === 'error' && toast?.error) toast.error(msg);
    else if (toast?.success) toast.success(msg);
  };

  // Selected Category (1 of 3: users, courses, revenue)
  const [selectedType, setSelectedType] = useState('revenue');

  // Filter Form State - Định dạng dd/MM/yyyy HH:mm
  const [startDate, setStartDate] = useState('01/10/2026 00:00');
  const [endDate, setEndDate] = useState('31/10/2026 23:59');
  const [courseFilter, setCourseFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [exportFormat, setExportFormat] = useState('XLSX');
  const [isGenerating, setIsGenerating] = useState(false);

  // Generated Reports List State
  const [reports, setReports] = useState(mockGeneratedReports);
  const [deleteId, setDeleteId] = useState(null);

  // Handle Generate Report - Tên theo mẫu: Báo cáo {loại} {từ ngày} - {đến ngày}
  const handleGenerateReport = (e) => {
    e.preventDefault();
    setIsGenerating(true);

    const activeCat = reportCategories.find((c) => c.id === selectedType) || reportCategories[0];
    const typeClean = activeCat.title.replace('Báo cáo ', '');

    setTimeout(() => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const createStr = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/2026 ${pad(now.getHours())}:${pad(now.getMinutes())}`;
      
      const expireStr = `${pad(now.getDate())}/${pad(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2)}/2026 ${pad(now.getHours())}:${pad(now.getMinutes())}`;

      // Lấy phần ngày từ ô lọc ngày
      const fromDay = startDate.includes(' ') ? startDate.split(' ')[0] : startDate;
      const toDay = endDate.includes(' ') ? endDate.split(' ')[0] : endDate;

      const newReport = {
        id: `REP-2026-${Math.floor(200 + Math.random() * 800)}`,
        name: `Báo cáo ${typeClean} ${fromDay} - ${toDay}`,
        type: selectedType,
        typeLabel: typeClean,
        author: 'Bùi Văn Nam',
        createdAt: createStr,
        expiresAt: expireStr,
        format: exportFormat,
        fileSize: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
        status: 'ready',
      };

      setReports([newReport, ...reports]);
      setIsGenerating(false);
      showToast(`Đã tạo thành công Báo cáo ${typeClean} (${exportFormat})!`);
    }, 600);
  };

  // Handle Delete Report
  const handleConfirmDelete = () => {
    if (!deleteId) return;
    setReports((prev) => prev.filter((r) => r.id !== deleteId));
    showToast('Đã xóa tệp báo cáo khỏi bộ lưu trữ');
    setDeleteId(null);
  };

  // Table Columns - Đã bỏ cột "Mã tệp" và "Dung lượng", Người tạo chỉ hiện họ tên
  const columns = [
    {
      header: 'Tên báo cáo',
      accessor: 'name',
      render: (_, row) => (
        <div className="max-w-md flex items-center gap-2.5">
          <Badge variant={formatBadge[row.format]?.variant || 'gray'} size="sm">
            {row.format}
          </Badge>
          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm line-clamp-1">
            {row.name}
          </span>
        </div>
      ),
    },
    {
      header: 'Phân loại',
      accessor: 'typeLabel',
      render: (typeLabel) => (
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {typeLabel}
        </span>
      ),
    },
    {
      header: 'Người tạo',
      accessor: 'author',
      render: (author) => (
        <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{author}</span>
      ),
    },
    {
      header: 'Ngày tạo',
      accessor: 'createdAt',
      render: (createdAt) => (
        <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{createdAt}</span>
      ),
    },
    {
      header: 'Hết hạn (30 ngày)',
      accessor: 'expiresAt',
      render: (expiresAt) => (
        <div className="flex items-center gap-1 text-xs font-mono text-gray-500">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{expiresAt}</span>
        </div>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => showToast(`Bắt đầu tải xuống tệp báo cáo (${row.format.toLowerCase()})...`)}
            className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-1 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Tải về
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(row.id)}
            className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5"
            title="Xóa tệp lưu"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Báo cáo & Thống kê"
        subtitle="Xuất dữ liệu chi tiết người dùng, khóa học và doanh thu"
      />

      {/* 3 THẺ CHỌN LOẠI BÁO CÁO (Xóa thẻ Điểm danh, xóa badge trang trí & số liệu quảng bá) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportCategories.map((cat) => {
          const Icon = categoryIconMap[cat.icon] || BarChart3;
          const isSelected = selectedType === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`
                p-5 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden group
                ${isSelected
                  ? 'bg-white dark:bg-gray-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
                }
              `}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isSelected
                    ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 font-bold'
                    : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
                }`}>
                  {isSelected ? '✓ Đang chọn' : 'Chọn loại'}
                </span>
              </div>

              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition-colors">
                {cat.title}
              </h3>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                {cat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* FORM BỘ LỌC VÀ NÚT TẠO BÁO CÁO */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Cấu hình phạm vi xuất dữ liệu
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            Loại đang chọn: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">
              {reportCategories.find((c) => c.id === selectedType)?.title}
            </strong>
          </span>
        </div>

        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Từ ngày
            </label>
            <Input
              type="text"
              placeholder="dd/MM/yyyy HH:mm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Đến ngày
            </label>
            <Input
              type="text"
              placeholder="dd/MM/yyyy HH:mm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Khóa học
            </label>
            <Select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="all">Tất cả khóa học</option>
              <option value="toeic_650">TOEIC 650+ Chinh phục mục tiêu</option>
              <option value="ielts_65">IELTS Intensive 6.5 Cấp tốc</option>
              <option value="toeic_4skills">TOEIC 4 Kỹ năng Chuyên sâu</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Lớp học
            </label>
            <Select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">Tất cả lớp học</option>
              <option value="toeic_k10">Lớp TOEIC-K10 (Tối 2-4-6)</option>
              <option value="ielts_k15">Lớp IELTS-K15 (Tối 3-5-7)</option>
            </Select>
          </div>

          <div className="flex gap-2">
            <div className="w-28 shrink-0">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Định dạng
              </label>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="XLSX">Excel (.xlsx)</option>
                <option value="PDF">PDF (.pdf)</option>
                <option value="CSV">CSV (.csv)</option>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isGenerating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 text-xs h-10 mt-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Tạo báo cáo
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* BẢNG BÁO CÁO ĐÃ TẠO */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">
              Báo cáo đã tạo
            </h3>
            <p className="text-xs text-gray-500">
              Các tệp báo cáo được lưu trữ trong vòng 30 ngày kể từ lúc sinh dữ liệu
            </p>
          </div>
          <Badge variant="blue" size="sm">{reports.length} tệp sẵn sàng</Badge>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <Table
            columns={columns}
            data={reports}
            pageSize={6}
            emptyText="Chưa có báo cáo nào được sinh"
          />
        </div>
      </div>

      {/* CONFIRM DIALOG XÓA BÁO CÁO */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa tệp báo cáo"
        message="Bạn có chắc chắn muốn xóa tệp báo cáo này khỏi bộ nhớ lưu tạm? Tệp sẽ không thể khôi phục."
        confirmText="Xóa tệp"
        cancelText="Hủy"
        variant="danger"
      />
    </div>
  );
}
