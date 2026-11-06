// src/pages/admin/ReportsPage.jsx
import { useState, useEffect } from 'react';
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
import { reportCategories } from '../../mock/reports';
import { reportService, courseService, classService } from '../../services/adminService';

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
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [deleteId, setDeleteId] = useState(null);

  const loadReportData = async () => {
    try {
      const [reportResult, courseResult, classResult] = await Promise.all([
        reportService.list({ page: 1, limit: 100 }), courseService.getCourses({ page: 1, limit: 100 }), classService.list({ page: 1, limit: 100 }),
      ]);
      setReports(reportResult); setCourses(courseResult); setClasses(classResult);
    } catch (error) { showToast(error.message || 'Không tải được báo cáo.', 'error'); }
  };
  useEffect(() => { loadReportData(); }, []);

  // Handle Generate Report - Tên theo mẫu: Báo cáo {loại} {từ ngày} - {đến ngày}
  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const report = await reportService.generate({ type: selectedType, format: exportFormat, startDate, endDate, courseId: courseFilter, classId: classFilter });
      setReports((previous) => [report, ...previous]);
      showToast(`Đã tạo báo cáo ${report.typeLabel} dạng CSV.`);
    } catch (error) { showToast(error.message || 'Không tạo được báo cáo.', 'error'); }
    finally { setIsGenerating(false); }
  };

  // Handle Delete Report
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try { await reportService.remove(deleteId); setReports((prev) => prev.filter((r) => r.id !== deleteId)); showToast('Đã xóa tệp báo cáo khỏi bộ lưu trữ'); }
    catch (error) { showToast(error.message || 'Không xóa được báo cáo.', 'error'); }
    setDeleteId(null);
  };

  const handleDownload = async (report) => {
    try { await reportService.download(report.id); }
    catch (error) { showToast(error.message || 'Không tải được báo cáo.', 'error'); }
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
            onClick={() => handleDownload(row)}
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
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
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
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
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
