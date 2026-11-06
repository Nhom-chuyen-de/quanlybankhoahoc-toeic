// src/pages/admin/CertificatesPage.jsx
import { useState, useMemo, useEffect } from 'react';
import {
  Award, Star, Plus, Eye, Download, ShieldCheck, Sparkles, AlertTriangle
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useToastContext } from '../../contexts/ToastContext';
import { certificateService, certificateEnrollmentService, reviewService } from '../../services/adminService';

// TODO: nối API
// - GET /api/admin/certificates (Danh sách chứng chỉ)
// - POST /api/admin/certificates (Cấp chứng chỉ thủ công)
// - PATCH /api/admin/certificates/:id/revoke (Thu hồi chứng chỉ)
// - GET /api/admin/reviews (Danh sách đánh giá & thống kê)
// - DELETE /api/admin/reviews/:id (Ẩn hoặc xóa đánh giá)

const statusConfig = {
  valid: { label: 'Hợp lệ', variant: 'green', text: 'Hợp lệ', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200' },
  expired: { label: 'Hết hạn', variant: 'gray', text: 'Hết hạn', bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200' },
  revoked: { label: 'Bị thu hồi', variant: 'red', text: 'Bị thu hồi', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200' },
};

export default function CertificatesPage() {
  const toast = useToastContext();
  const showToast = (msg, type = 'success') => {
    if (typeof toast === 'function') toast(msg, type);
    else if (toast?.showToast) toast.showToast(msg, type);
    else if (type === 'error' && toast?.error) toast.error(msg);
    else if (toast?.success) toast.success(msg);
  };

  // Tab 1: Certificates State
  const [certificates, setCertificates] = useState([]);
  const [completedEnrollments, setCompletedEnrollments] = useState([]);
  const [ratingStats, setRatingStats] = useState({ average: 0, total: 0, distribution: {} });
  const [certSearch, setCertSearch] = useState('');
  const [certStatusFilter, setCertStatusFilter] = useState('');
  const [selectedCert, setSelectedCert] = useState(null);
  const [certToRevoke, setCertToRevoke] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  // Form cấp mới thủ công (chỉ có chọn đăng ký hoàn thành, ngày hết hạn tùy chọn, ghi chú tự sinh số chứng chỉ)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState('');
  const [newCertExpiry, setNewCertExpiry] = useState('');

  // Tab 2: Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewSearch, setReviewSearch] = useState('');
  const [starFilter, setStarFilter] = useState('');

  const loadCertificateData = async () => {
    try {
      const [certResult, reviewResult, statsResult, enrollmentResult] = await Promise.all([
        certificateService.list({ page: 1, limit: 100 }), reviewService.list({ page: 1, limit: 100 }),
        reviewService.stats(), certificateEnrollmentService.list(),
      ]);
      const displayDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : null;
      setCertificates(certResult.map((item) => ({ ...item, issueDate: displayDate(item.issueDate), expiryDate: displayDate(item.expiryDate) })));
      setReviews(reviewResult.map((item) => ({ ...item, date: displayDate(item.date), comment: item.comment || '' })));
      setRatingStats(statsResult);
      setCompletedEnrollments(enrollmentResult);
    } catch (error) { showToast(error.message || 'Không tải được chứng chỉ và đánh giá.', 'error'); }
  };
  useEffect(() => { loadCertificateData(); }, []);

  // Filter Certificates
  const filteredCerts = useMemo(() => {
    return certificates.filter((c) => {
      const matchSearch =
        c.certificateNumber.toLowerCase().includes(certSearch.toLowerCase()) ||
        c.student.name.toLowerCase().includes(certSearch.toLowerCase()) ||
        c.student.email.toLowerCase().includes(certSearch.toLowerCase()) ||
        c.courseName.toLowerCase().includes(certSearch.toLowerCase());
      const matchStatus = !certStatusFilter || c.status === certStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [certificates, certSearch, certStatusFilter]);

  // Filter Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchSearch =
        r.student.name.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.courseName.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.comment.toLowerCase().includes(reviewSearch.toLowerCase());
      const matchStar = !starFilter || r.rating === Number(starFilter);
      return matchSearch && matchStar;
    });
  }, [reviews, reviewSearch, starFilter]);

  // Handle Revoke
  const handleConfirmRevoke = async () => {
    if (!certToRevoke) return;
    try { await certificateService.revoke(certToRevoke.id); }
    catch (error) { showToast(error.message || 'Không thu hồi được chứng chỉ.', 'error'); return; }
    setCertificates((prev) =>
      prev.map((c) => (c.id === certToRevoke.id ? { ...c, status: 'revoked' } : c))
    );
    showToast(`Đã thu hồi chứng chỉ ${certToRevoke.certificateNumber} thành công!`);
    setCertToRevoke(null);
  };

  // Handle Issue Certificate
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnrollmentId) {
      showToast('Vui lòng chọn đăng ký khóa học đã hoàn thành', 'error');
      return;
    }

    const enrollment = completedEnrollments.find((en) => en.id === selectedEnrollmentId);
    if (!enrollment) { showToast('Ghi danh đã chọn không còn đủ điều kiện cấp chứng chỉ.', 'error'); return; }
    const generatedCertNum = `CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await certificateService.create({ enrollmentId: selectedEnrollmentId, certificateNumber: generatedCertNum, expiresAt: newCertExpiry || null });
    } catch (error) { showToast(error.message || 'Không cấp được chứng chỉ.', 'error'); return; }

    const newCert = {
      id: `cert-${Date.now()}`,
      certificateNumber: generatedCertNum,
      student: {
        name: enrollment.studentName,
        email: enrollment.studentEmail,
        avatar: enrollment.studentAvatar
      },
      courseName: enrollment.courseName,
      courseCategory: enrollment.courseCategory,
      issueDate: '01/11/2026',
      expiryDate: newCertExpiry ? newCertExpiry.split('-').reverse().join('/') : '01/11/2028',
      score: enrollment.score,
      grade: enrollment.grade,
      status: 'valid'
    };

    setCertificates([newCert, ...certificates]);
    setCompletedEnrollments((items) => items.filter((item) => item.id !== selectedEnrollmentId));
    setIssueModalOpen(false);
    setSelectedEnrollmentId('');
    setNewCertExpiry('');
    showToast(`Đã cấp chứng chỉ ${newCert.certificateNumber} cho học viên ${newCert.student.name}!`);
  };

  // Certificates Table Columns (Xóa dòng "Xếp loại" và "Kết quả" dưới tên khóa học / số chứng chỉ)
  const certColumns = [
    {
      header: 'Số chứng chỉ',
      accessor: 'certificateNumber',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs font-bold text-gray-900 dark:text-gray-100">
            {row.certificateNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Học viên',
      accessor: 'student',
      render: (student) => (
        <div className="flex items-center gap-2.5">
          <img
            src={student?.avatar}
            alt={student?.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 dark:ring-gray-700 shrink-0"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {student?.name}
            </p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Khóa học hoàn thành',
      accessor: 'courseName',
      render: (courseName) => (
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-1 max-w-xs">
          {courseName}
        </p>
      ),
    },
    {
      header: 'Ngày cấp',
      accessor: 'issueDate',
      render: (issueDate) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">{issueDate}</span>
      ),
    },
    {
      header: 'Ngày hết hạn',
      accessor: 'expiryDate',
      render: (expiryDate) => (
        <span className="text-xs text-gray-600 dark:text-gray-400">{expiryDate || '—'}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: 'status',
      render: (status) => {
        const s = statusConfig[status] || statusConfig.valid;
        return <Badge variant={s.variant} size="sm">{s.label}</Badge>;
      },
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCert(row)}
            title="Xem mẫu chứng chỉ điện tử"
            className="text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 p-1.5"
          >
            <Eye className="w-4 h-4" />
          </Button>

          {row.status === 'valid' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCertToRevoke(row)}
              title="Thu hồi chứng chỉ"
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-1.5"
            >
              <AlertTriangle className="w-4 h-4" />
            </Button>
          ) : (
            <span className="text-xs text-gray-400 italic px-2">Đã khóa</span>
          )}
        </div>
      ),
    },
  ];

  // Reviews Table Columns
  const reviewColumns = [
    {
      header: 'Học viên',
      accessor: 'student',
      render: (student) => (
        <div className="flex items-center gap-2.5">
          <img
            src={student?.avatar}
            alt={student?.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              {student?.name}
            </p>
            <p className="text-xs text-gray-400 leading-tight mt-0.5">{student?.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Khóa học',
      accessor: 'courseName',
      render: (courseName) => (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-1 max-w-xs">
          {courseName}
        </span>
      ),
    },
    {
      header: 'Số sao',
      accessor: 'rating',
      render: (rating) => (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          ))}
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">
            {rating}.0
          </span>
        </div>
      ),
    },
    {
      header: 'Nhận xét & Phản hồi',
      accessor: 'comment',
      render: (comment) => (
        <p className="text-xs text-gray-600 dark:text-gray-300 max-w-md leading-relaxed">
          "{comment}"
        </p>
      ),
    },
    {
      header: 'Ngày gửi',
      accessor: 'date',
      render: (date) => (
        <span className="text-xs text-gray-500 dark:text-gray-400">{date}</span>
      ),
    },
    {
      header: 'Thao tác',
      accessor: 'actions',
      render: () => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => showToast('Chức năng phản hồi/ẩn đánh giá sẽ cập nhật sau!')}
          className="text-xs text-indigo-600 hover:bg-indigo-50"
        >
          Phản hồi
        </Button>
      ),
    },
  ];

  const tabs = [
    {
      key: 'certs',
      label: 'Quản lý Chứng chỉ',
      icon: Award,
      count: filteredCerts.length,
      content: (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="w-full sm:w-72">
                <SearchBar
                  value={certSearch}
                  onChange={setCertSearch}
                  placeholder="Tìm theo mã số, tên học viên..."
                />
              </div>

              <Select
                value={certStatusFilter}
                onChange={(e) => setCertStatusFilter(e.target.value)}
                className="w-44 text-xs"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="valid">Hợp lệ</option>
                <option value="expired">Hết hạn</option>
                <option value="revoked">Bị thu hồi</option>
              </Select>

              {(certSearch || certStatusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCertSearch('');
                    setCertStatusFilter('');
                  }}
                  className="text-xs text-gray-500"
                >
                  Xóa lọc
                </Button>
              )}
            </div>

            <Button
              size="sm"
              onClick={() => setIssueModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 self-end sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Cấp chứng chỉ thủ công
            </Button>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <Table
              columns={certColumns}
              data={filteredCerts}
              pageSize={8}
              emptyText="Không tìm thấy chứng chỉ nào phù hợp"
            />
          </div>
        </div>
      ),
    },
    {
      key: 'reviews',
      label: 'Đánh giá & Xếp hạng',
      icon: Star,
      count: filteredReviews.length,
      content: (
        <div className="space-y-6">
          {/* Thống kê điểm trung bình & phân bố số sao */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Điểm số tổng quát */}
            <div className="md:col-span-4 text-center md:border-r border-gray-200 dark:border-gray-800 md:pr-6 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Điểm đánh giá trung bình
              </h4>
              <div className="text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {ratingStats.average}
                <span className="text-xl font-normal text-gray-400">/5.0</span>
              </div>
              <div className="flex items-center justify-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Dựa trên <strong>{ratingStats.total}</strong> lượt đánh giá của học viên
              </p>
            </div>

            {/* Phân bố 1 - 5 sao */}
            <div className="md:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingStats.distribution[rating] || 0;
                const percent = ratingStats.total ? Math.round((count / ratingStats.total) * 100) : 0;
                return (
                  <div key={rating} className="flex items-center gap-3 text-xs">
                    <span className="w-12 flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-300">
                      {rating} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                    </span>
                    <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-medium text-gray-500 dark:text-gray-400">
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Filter */}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
              <div className="w-full sm:w-72">
                <SearchBar
                  value={reviewSearch}
                  onChange={setReviewSearch}
                  placeholder="Tìm theo học viên, nhận xét..."
                />
              </div>

              <Select
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value)}
                className="w-44 text-xs"
              >
                <option value="">Tất cả số sao</option>
                <option value="5">5 Sao (Rất tốt)</option>
                <option value="4">4 Sao (Tốt)</option>
                <option value="3">3 Sao (Bình thường)</option>
                <option value="2">2 Sao (Cần cải thiện)</option>
                <option value="1">1 Sao (Kém)</option>
              </Select>

              {(reviewSearch || starFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReviewSearch('');
                    setStarFilter('');
                  }}
                  className="text-xs text-gray-500"
                >
                  Xóa lọc
                </Button>
              )}
            </div>

            <span className="text-xs text-gray-500 self-center">
              Hiển thị <strong>{filteredReviews.length}</strong> đánh giá
            </span>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <Table
              columns={reviewColumns}
              data={filteredReviews}
              pageSize={6}
              emptyText="Chưa có đánh giá nào phù hợp"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chứng chỉ & Đánh giá"
        subtitle="Quản lý cấp phát chứng chỉ số và theo dõi phản hồi chất lượng đào tạo"
      />

      <Tabs tabs={tabs} defaultTab="certs" />

      {/* MODAL XEM CHỨNG CHỈ ĐIỆN TỬ */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="Bản xem trước Chứng chỉ điện tử"
        size="lg"
      >
        {selectedCert && (
          <div className="space-y-5 py-2">
            {/* Phôi chứng chỉ trang trọng */}
            <div className="relative p-8 bg-gradient-to-br from-amber-50 via-white to-amber-50/50 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 rounded-2xl border-4 border-amber-300/80 dark:border-amber-600/60 shadow-xl text-center space-y-4">
              <div className="flex justify-center mb-1">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-lg ring-4 ring-amber-200/50">
                  <Award className="w-9 h-9" />
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
                  HỆ THỐNG ĐÀO TẠO TOEIC & IELTS TRỰC TUYẾN
                </p>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">
                  CHỨNG CHỈ HOÀN THÀNH KHÓA HỌC
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Mã xác thực: {selectedCert.certificateNumber}
                </p>
              </div>

              <div className="py-2">
                <p className="text-xs text-gray-500 italic">Chứng nhận học viên</p>
                <h3 className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-400 mt-1">
                  {selectedCert.student.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Email: {selectedCert.student.email}</p>
              </div>

              <div className="max-w-md mx-auto text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Đã hoàn thành xuất sắc chương trình đào tạo chuyên sâu:
                <div className="font-bold text-gray-900 dark:text-white text-base mt-1">
                  {selectedCert.courseName}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-amber-200 dark:border-gray-700 text-xs text-gray-500 px-4">
                <div className="text-left">
                  <p>Ngày cấp: <strong>{selectedCert.issueDate}</strong></p>
                  <p>Hạn hiệu lực: <strong>{selectedCert.expiryDate || 'Vô thời hạn'}</strong></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800 dark:text-gray-200">HỘI ĐỒNG ĐÀO TẠO</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 justify-end mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Chữ ký số hợp lệ
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-500">
                Trạng thái: <strong className={selectedCert.status === 'valid' ? 'text-emerald-600' : 'text-rose-600'}>
                  {statusConfig[selectedCert.status]?.label}
                </strong>
              </span>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => showToast('Đang tải file PDF chứng chỉ...')}
                  className="flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Tải PDF
                </Button>
                <Button
                  size="sm"
                  onClick={() => setSelectedCert(null)}
                  className="bg-indigo-600 text-white"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* CONFIRM DIALOG THU HỒI CHỨNG CHỈ */}
      <ConfirmDialog
        isOpen={!!certToRevoke}
        onClose={() => setCertToRevoke(null)}
        onConfirm={handleConfirmRevoke}
        title="Xác nhận thu hồi chứng chỉ"
        message={
          certToRevoke
            ? `Bạn có chắc chắn muốn thu hồi chứng chỉ ${certToRevoke.certificateNumber} của học viên "${certToRevoke.student.name}"? Chứng chỉ sau khi thu hồi sẽ bị hủy hiệu lực trên cổng tra cứu.`
            : ''
        }
        confirmText="Thu hồi chứng chỉ"
        cancelText="Hủy bỏ"
        variant="danger"
      />

      {/* MODAL CẤP CHỨNG CHỈ THỦ CÔNG */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Cấp chứng chỉ thủ công"
        size="md"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4 py-2">
          {/* 1. Chọn đăng ký khóa học đã hoàn thành */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Đăng ký khóa học đã hoàn thành <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedEnrollmentId}
              onChange={(e) => setSelectedEnrollmentId(e.target.value)}
              required
            >
              <option value="">-- Chọn học viên & khóa học hoàn thành --</option>
              {completedEnrollments.map((enr) => (
                <option key={enr.id} value={enr.id}>
                  {enr.studentName} — {enr.courseName} (Đã hoàn thành)
                </option>
              ))}
            </Select>
          </div>

          {/* 2. Ngày hết hạn (tùy chọn) */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Ngày hết hạn <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <Input
              type="date"
              value={newCertExpiry}
              onChange={(e) => setNewCertExpiry(e.target.value)}
              placeholder="Chọn ngày hết hạn (nếu có)..."
            />
          </div>

          {/* 3. Ghi chú "Số chứng chỉ được tạo tự động" */}
          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Số chứng chỉ được tạo tự động</span>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
            <Button variant="outline" type="button" onClick={() => setIssueModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Cấp chứng chỉ
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
