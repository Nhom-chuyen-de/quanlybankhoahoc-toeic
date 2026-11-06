import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, Layers, Users, School, Video, FileText,
  Headphones, HelpCircle, Plus, Clock, Award,
  Calendar, DollarSign, Tag, ChevronDown, ChevronRight,
  Pencil, ExternalLink, Info, Eye, EyeOff, Target, Monitor,
  Search, CheckCircle2, XCircle
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { mockCoursesList, mockCourseEnrollments } from '../../mock/training';
import { courseService } from '../../services/adminService';
import { COURSE_LEVEL, COURSE_FORMAT, MODERATION_STATUS } from '../../constants/enums';

const formatVnd = (v) => {
  if (v === null || v === undefined || v === '') return 'Chưa có';
  if (Number(v) === 0) return 'Miễn phí';
  return `${Number(v).toLocaleString('vi-VN')} ₫`;
};

// Icon map theo loại bài học
const lessonTypeConfig = {
  video: { icon: Video, label: 'Video bài giảng', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  reading: { icon: BookOpen, label: 'Bài đọc hiểu', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
  document: { icon: FileText, label: 'Tài liệu PDF', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30' },
  audio: { icon: Headphones, label: 'File âm thanh', color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30' },
  quiz: { icon: HelpCircle, label: 'Bài tập trắc nghiệm', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  exercise: { icon: HelpCircle, label: 'Bài tập thực hành', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
};

// ─── Badge trạng thái duyệt ───────────────────────────────────────────────────
function ModerationBadge({ status }) {
  const cfg = MODERATION_STATUS[status] || MODERATION_STATUS.pending;
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-2 py-2.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div className="flex items-center gap-1.5 min-w-[140px] text-xs text-gray-400 dark:text-gray-500 shrink-0">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</div>
    </div>
  );
}

// ─── Status map cho Học viên đăng ký khóa học ──────────────────────────────────
const enrollmentStatusMap = {
  active: { label: 'Đang học', color: 'green' },
  completed: { label: 'Hoàn thành', color: 'blue' },
  expired: { label: 'Hết hạn', color: 'yellow' },
  cancelled: { label: 'Đã hủy', color: 'gray' },
};

// Parse dd/MM/yyyy sang Date object
function parseDdMmYyyy(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

// Chuyển Date sang YYYY-MM-DD
function formatYyyyMmDd(date) {
  if (!date || isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Chuyển YYYY-MM-DD sang dd/MM/yyyy
function yyyyMmDdToDisplay(isoStr) {
  if (!isoStr) return '';
  const parts = isoStr.split('-');
  if (parts.length !== 3) return isoStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Kiểm tra xem hạn còn dưới 7 ngày không (so với ngày hiện tại)
function isExpiringSoon(expireDateStr, status) {
  if (!expireDateStr || status !== 'active') return false;
  const expireDate = parseDdMmYyyy(expireDateStr);
  if (!expireDate) return false;

  const now = new Date();
  expireDate.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = expireDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= 7;
}

export default function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();

  const fallbackCourse = useMemo(() => mockCoursesList.find((c) => c.id === id) || mockCoursesList[0], [id]);
  const [course, setCourse] = useState(fallbackCourse);
  useEffect(() => {
    let cancelled = false;
    Promise.all([courseService.getCourseById(id), courseService.getEnrollments(id)])
      .then(([courseData, enrollmentData]) => {
        if (cancelled) return;
        const toDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : null;
        setCourse(courseData);
        setStudents(enrollmentData.map((student) => ({ ...student, expireDate: toDate(student.expireDate), startDate: toDate(student.startDate) })));
      })
      .catch((error) => toast.error(error.message || 'Không tải được dữ liệu khóa học.'));
    return () => { cancelled = true; };
  }, [id]);

  const [collapsedChapters, setCollapsedChapters] = useState({});

  const toggleChapter = (chapterId) => {
    setCollapsedChapters((prev) => ({ ...prev, [chapterId]: !prev[chapterId] }));
  };

  const modCfg = MODERATION_STATUS[course.moderationStatus] || MODERATION_STATUS.pending;

  // ── State quản lý tab Học viên đăng ký ──
  const [students, setStudents] = useState(() => {
    return course.students && course.students.length > 0
      ? course.students
      : mockCourseEnrollments;
  });

  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('');

  // Modal Gia hạn
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendStudent, setExtendStudent] = useState(null);
  const [newExpireDateRaw, setNewExpireDateRaw] = useState('');
  const [dateError, setDateError] = useState('');

  // ConfirmDialog Hủy đăng ký
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelStudent, setCancelStudent] = useState(null);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  // 1. Thống kê nhanh: Đang học, Hoàn thành, Hết hạn, Đã hủy
  const enrollmentStats = useMemo(() => {
    const active = students.filter((s) => s.status === 'active').length;
    const completed = students.filter((s) => s.status === 'completed').length;
    const expired = students.filter((s) => s.status === 'expired').length;
    const cancelled = students.filter((s) => s.status === 'cancelled').length;
    return { active, completed, expired, cancelled };
  }, [students]);

  // 2. Bộ lọc danh sách học viên
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (studentStatusFilter && s.status !== studentStatusFilter) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase();
        const matchName = s.name?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        return matchName || matchEmail;
      }
      return true;
    });
  }, [students, studentStatusFilter, studentSearch]);

  // Mở modal Gia hạn
  const openExtendModal = (stu) => {
    setExtendStudent(stu);
    setDateError('');

    let base = today;
    if (stu.expireDate) {
      const curExp = parseDdMmYyyy(stu.expireDate);
      if (curExp && curExp > today) {
        base = curExp;
      }
    }
    // Mặc định tăng thêm 30 ngày
    const defaultNext = new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    setNewExpireDateRaw(formatYyyyMmDd(defaultNext));
    setExtendModalOpen(true);
  };

  // Nút phụ thêm 30 ngày hoặc 90 ngày
  const handleQuickAddDays = (days) => {
    if (!extendStudent) return;
    let base = today;
    if (extendStudent.expireDate) {
      const curExp = parseDdMmYyyy(extendStudent.expireDate);
      if (curExp && curExp > today) {
        base = curExp;
      }
    }
    const nextDate = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    setNewExpireDateRaw(formatYyyyMmDd(nextDate));
    setDateError('');
  };

  // Xác nhận gia hạn
  const handleConfirmExtend = async () => {
    if (!newExpireDateRaw) {
      setDateError('Vui lòng chọn ngày hết hạn mới.');
      return;
    }
    const chosenDate = new Date(newExpireDateRaw + 'T00:00:00');
    if (isNaN(chosenDate.getTime())) {
      setDateError('Ngày không hợp lệ.');
      return;
    }

    let base = today;
    if (extendStudent.expireDate) {
      const curExp = parseDdMmYyyy(extendStudent.expireDate);
      if (curExp && curExp > today) {
        base = curExp;
      }
    }

    if (chosenDate <= base) {
      setDateError('Ngày hết hạn mới phải sau ngày hết hạn hiện tại (hoặc sau ngày hôm nay nếu đã hết hạn).');
      return;
    }

    const newFormatted = yyyyMmDdToDisplay(newExpireDateRaw);
    try {
      await courseService.updateEnrollment(id, extendStudent.id, { expireDate: new Date(`${newExpireDateRaw}T00:00:00`).toISOString(), status: 'active' });
    } catch (error) { toast.error(error.message || 'Không gia hạn được ghi danh.'); return; }
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === extendStudent.id) {
          return {
            ...s,
            expireDate: newFormatted,
            status: 'active', // nếu trước đó là 'expired' thì chuyển lại 'active'
          };
        }
        return s;
      })
    );

    toast.success(`Gia hạn thành công đến ngày ${newFormatted} cho học viên ${extendStudent.name}`);
    setExtendModalOpen(false);
    setExtendStudent(null);
  };

  // Mở hộp thoại Hủy đăng ký
  const openCancelDialog = (stu) => {
    setCancelStudent(stu);
    setCancelConfirmOpen(true);
  };

  // Xác nhận hủy đăng ký
  const handleConfirmCancel = async () => {
    if (cancelStudent) {
      try { await courseService.updateEnrollment(id, cancelStudent.id, { status: 'cancelled' }); }
      catch (error) { toast.error(error.message || 'Không hủy được ghi danh.'); return; }
      setStudents((prev) =>
        prev.map((s) => (s.id === cancelStudent.id ? { ...s, status: 'cancelled' } : s))
      );
      toast.success(`Đã hủy đăng ký khóa học của học viên ${cancelStudent.name}`);
      setCancelConfirmOpen(false);
      setCancelStudent(null);
    }
  };

  // Ngày tối thiểu có thể chọn cho modal gia hạn
  const minExtendIso = useMemo(() => {
    if (!extendStudent) return '';
    let base = today;
    if (extendStudent.expireDate) {
      const curExp = parseDdMmYyyy(extendStudent.expireDate);
      if (curExp && curExp > today) {
        base = curExp;
      }
    }
    const minD = new Date(base.getTime() + 24 * 60 * 60 * 1000);
    return formatYyyyMmDd(minD);
  }, [extendStudent, today]);

  return (
    <div className="space-y-6">
      {/* ─── Breadcrumb + Header ──────────────────────────────────────────────── */}
      <div>
        <button
          onClick={() => navigate('/admin/khoa-hoc')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách khóa học
        </button>

        <PageHeader
          title={course.title}
          subtitle={`Giảng viên: ${course.creator} • Cập nhật: ${course.updatedAt}`}
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'Khóa học', path: '/admin/khoa-hoc' },
            { label: course.title },
          ]}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Trạng thái xuất bản */}
              <StatusBadge status={course.status} />
              {/* Hiển thị */}
              {course.isVisible !== false ? (
                <Badge color="green" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Hiển thị
                </Badge>
              ) : (
                <Badge color="gray" className="flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Đang ẩn
                </Badge>
              )}
              {/* Trạng thái duyệt */}
              <ModerationBadge status={course.moderationStatus} />
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => toast.wip()}>
                Chỉnh sửa
              </Button>
            </div>
          }
        />
      </div>

      {/* ─── 4 TABS CHI TIẾT ─────────────────────────────────────────────────── */}
      <Card padding={false} className="p-6">
        <Tabs
          tabs={[
            // ─── TAB 1: THÔNG TIN CHUNG ──────────────────────────────────────
            {
              key: 'info',
              label: 'Thông tin chung',
              icon: BookOpen,
              content: (
                <div className="space-y-6 pt-2">
                  {/* Ảnh đại diện 16:9 + lưới thông tin */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Cột trái: Ảnh 16:9 */}
                    <div className="lg:col-span-2">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="w-full aspect-video rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-sm"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full aspect-video rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-gray-200 dark:border-gray-700 items-center justify-center ${course.thumbnailUrl ? 'hidden' : 'flex'}`}
                      >
                        <BookOpen className="h-12 w-12 text-indigo-200 dark:text-indigo-700" />
                      </div>
                      {/* Mô tả khóa học */}
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">Mô tả khóa học</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed p-3.5 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                          {course.description || 'Chưa có mô tả chi tiết cho khóa học này.'}
                        </p>
                      </div>
                    </div>

                    {/* Cột phải: Lưới thông tin */}
                    <div className="lg:col-span-3">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin chi tiết</h4>
                        </div>
                        <div className="px-4 divide-y divide-gray-50 dark:divide-gray-700/40">
                          <InfoRow label="Danh mục" icon={Tag} value={<Badge color="indigo" size="xs">{course.category}</Badge>} />
                          <InfoRow
                            label="Trình độ"
                            icon={Award}
                            value={
                              <Badge color={COURSE_LEVEL[course.level]?.color || 'gray'} size="xs">
                                {COURSE_LEVEL[course.level]?.label || course.level}
                              </Badge>
                            }
                          />
                          <InfoRow
                            label="Kỳ thi áp dụng"
                            value={
                              <Badge color={course.examType === 'TOEIC' ? 'blue' : course.examType === 'IELTS' ? 'purple' : 'gray'} size="xs">
                                {course.examType === 'none' ? 'Không áp dụng' : course.examType}
                              </Badge>
                            }
                          />
                          <InfoRow
                            label="Học phí"
                            icon={DollarSign}
                            value={
                              <span className={`font-bold text-sm ${!course.price ? 'text-orange-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                {formatVnd(course.price)}
                              </span>
                            }
                          />
                          <InfoRow
                            label="Trình độ đầu vào"
                            value={course.entryLevel || <span className="text-gray-400 text-xs">Không yêu cầu</span>}
                          />
                          <InfoRow
                            label="Điểm mục tiêu"
                            icon={Target}
                            value={
                              course.targetScore != null
                                ? <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                    {course.targetScore}{course.examType === 'TOEIC' ? '/990' : ''}
                                  </span>
                                : <span className="text-gray-400 text-xs">Không áp dụng</span>
                            }
                          />
                          <InfoRow
                            label="Hình thức"
                            icon={Monitor}
                            value={
                              course.format
                                ? <Badge color={COURSE_FORMAT[course.format]?.color || 'gray'} size="xs">
                                    {COURSE_FORMAT[course.format]?.label || course.format}
                                  </Badge>
                                : <span className="text-gray-400 text-xs">—</span>
                            }
                          />
                          <InfoRow
                            label="Thời lượng (giờ)"
                            icon={Clock}
                            value={course.durationHours ? `${course.durationHours} giờ` : <span className="text-gray-400 text-xs">—</span>}
                          />
                          <InfoRow
                            label="Số ngày truy cập"
                            icon={Calendar}
                            value={
                              course.accessDays
                                ? `${course.accessDays} ngày`
                                : <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium">Không giới hạn</span>
                            }
                          />
                          <InfoRow
                            label="Hiển thị"
                            icon={Eye}
                            value={
                              course.isVisible !== false
                                ? <Badge color="green" size="xs">Đang hiển thị</Badge>
                                : <Badge color="gray" size="xs">Đang ẩn</Badge>
                            }
                          />
                          <InfoRow
                            label="Trạng thái duyệt"
                            value={
                              <div className="space-y-1">
                                <ModerationBadge status={course.moderationStatus} />
                                {course.moderationStatus === 'pending' && (
                                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                    <Info className="h-3 w-3 text-yellow-500" />
                                    Duyệt tại{' '}
                                    <Link to="/admin/kiem-duyet" className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5">
                                      Duyệt nội dung <ExternalLink className="h-3 w-3" />
                                    </Link>
                                  </p>
                                )}
                                {course.moderationStatus === 'rejected' && (
                                  <p className="text-xs text-red-500 mt-1">Khóa học đã bị từ chối.</p>
                                )}
                              </div>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ),
            },

            // ─── TAB 2: CHƯƠNG & NỘI DUNG ─────────────────────────────────────
            {
              key: 'curriculum',
              label: 'Chương & Nội dung',
              icon: Layers,
              count: course.chapters?.length || 0,
              content: (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Cấu trúc chương trình học</h4>
                      <p className="text-xs text-gray-400">
                        Tổng số {course.chapters?.length || 0} chương • {course.totalLessons || 0} bài học
                      </p>
                    </div>
                    <Button size="sm" icon={Plus} onClick={() => toast.wip()}>
                      Thêm chương mới
                    </Button>
                  </div>

                  {(!course.chapters || course.chapters.length === 0) ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Khóa học chưa được cập nhật cây chương mục bài giảng.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {course.chapters.map((chp) => {
                        const isCollapsed = collapsedChapters[chp.id];
                        return (
                          <div
                            key={chp.id}
                            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm"
                          >
                            <div
                              onClick={() => toggleChapter(chp.id)}
                              className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-750 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                {isCollapsed ? (
                                  <ChevronRight className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-400" />
                                )}
                                <div>
                                  <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{chp.title}</span>
                                  <span className="text-xs text-gray-400 ml-2 font-mono">
                                    ({chp.lessons?.length || 0} bài học • {chp.duration})
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={(e) => { e.stopPropagation(); toast.wip(); }}
                              >
                                + Bài học
                              </Button>
                            </div>

                            {!isCollapsed && (
                              <div className="divide-y divide-gray-100 dark:divide-gray-700/60 p-2">
                                {chp.lessons?.map((lesson) => {
                                  const cfg = lessonTypeConfig[lesson.type] || lessonTypeConfig.video;
                                  const LessonIcon = cfg.icon;
                                  return (
                                    <div
                                      key={lesson.id}
                                      className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors text-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-md ${cfg.color}`}>
                                          <LessonIcon className="h-4 w-4" />
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-900 dark:text-gray-100">{lesson.title}</span>
                                          <span className="text-gray-400 block text-[11px]">Định dạng: {cfg.label}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 text-gray-400">
                                        <span className="font-mono text-[11px]">{lesson.duration}</span>
                                        <button
                                          onClick={() => toast.wip()}
                                          className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                                        >
                                          Xem trước
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ),
            },

            // ─── TAB 3: LỚP HỌC ───────────────────────────────────────────────
            {
              key: 'classes',
              label: 'Lớp học',
              icon: School,
              count: course.classes?.length || 0,
              content: (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      Các lớp học đang mở & đã tuyển sinh
                    </h4>
                    <Button size="sm" icon={Plus} onClick={() => navigate('/admin/lop-hoc')}>
                      Mở lớp mới
                    </Button>
                  </div>

                  {(!course.classes || course.classes.length === 0) ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Chưa có lớp học nào được mở cho khóa này.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="py-3 px-3">Mã lớp / Tên lớp</th>
                            <th className="py-3 px-3">Giảng viên</th>
                            <th className="py-3 px-3">Sĩ số học viên</th>
                            <th className="py-3 px-3">Lịch học</th>
                            <th className="py-3 px-3 text-center">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {course.classes.map((cls) => (
                            <tr
                              key={cls.id}
                              onClick={() => navigate(`/admin/lop-hoc/${cls.id}`)}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-3">
                                <span className="font-bold text-gray-900 dark:text-gray-100 block">{cls.name}</span>
                                <span className="font-mono text-gray-400">{cls.classCode}</span>
                              </td>
                              <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">{cls.teacher}</td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {cls.enrolled}/{cls.max} học viên
                                </span>
                              </td>
                              <td className="py-3 px-3 text-gray-500 dark:text-gray-400">{cls.schedule}</td>
                              <td className="py-3 px-3 text-center">
                                <StatusBadge status={cls.status} size="xs" />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ),
            },

            // ─── TAB 4: HỌC VIÊN ĐĂNG KÝ ─────────────────────────────────────
            {
              key: 'students',
              label: 'Học viên đăng ký',
              icon: Users,
              count: students.length,
              content: (
                <div className="space-y-5 pt-2">
                  {/* 1. THỐNG KÊ NHANH: 4 ô nhỏ Đang học, Hoàn thành, Hết hạn, Đã hủy */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">Đang học</p>
                        <p className="text-xl font-bold text-green-900 dark:text-green-200 mt-0.5">{enrollmentStats.active}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 flex items-center justify-center">
                        <BookOpen className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Hoàn thành</p>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-200 mt-0.5">{enrollmentStats.completed}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50/50 dark:bg-yellow-950/20 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Hết hạn</p>
                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-200 mt-0.5">{enrollmentStats.expired}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                        <Clock className="h-4 w-4" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Đã hủy</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-gray-200 mt-0.5">{enrollmentStats.cancelled}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center">
                        <XCircle className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* 2. BỘ LỌC: tìm kiếm tên/email & select Trạng thái */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Tìm học viên (tên, email)..."
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                      />
                    </div>

                    <div className="w-full sm:w-48 shrink-0">
                      <Select
                        value={studentStatusFilter}
                        onChange={(e) => setStudentStatusFilter(e.target.value)}
                        options={[
                          { value: '', label: 'Tất cả trạng thái' },
                          { value: 'active', label: 'Đang học' },
                          { value: 'completed', label: 'Hoàn thành' },
                          { value: 'expired', label: 'Hết hạn' },
                          { value: 'cancelled', label: 'Đã hủy' },
                        ]}
                      />
                    </div>
                  </div>

                  {/* 3. BẢNG DANH SÁCH HỌC VIÊN ĐĂNG KÝ */}
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-100 dark:border-gray-700">
                        <tr>
                          <th className="py-3 px-3">Học viên</th>
                          <th className="py-3 px-3">Ngày bắt đầu</th>
                          <th className="py-3 px-3">Ngày hết hạn</th>
                          <th className="py-3 px-3">Tiến độ</th>
                          <th className="py-3 px-3">Nguồn đăng ký</th>
                          <th className="py-3 px-3 text-center">Trạng thái</th>
                          <th className="py-3 px-3 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 bg-white dark:bg-gray-800">
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                              Không tìm thấy học viên nào phù hợp với bộ lọc.
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((stu) => {
                            const cfg = enrollmentStatusMap[stu.status] || enrollmentStatusMap.active;
                            const expiring = isExpiringSoon(stu.expireDate, stu.status);

                            return (
                              <tr key={stu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                {/* Cột 1: Học viên (avatar + họ tên + email) */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <img
                                      src={stu.avatar}
                                      alt={stu.name}
                                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-semibold text-gray-900 dark:text-gray-100 block truncate">{stu.name}</span>
                                      <span className="text-gray-400 text-[11px] block truncate">{stu.email}</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Cột 2: Ngày bắt đầu (dd/MM/yyyy) */}
                                <td className="py-3 px-3 text-gray-600 dark:text-gray-300 font-mono">
                                  {stu.startDate}
                                </td>

                                {/* Cột 3: Ngày hết hạn (dd/MM/yyyy; để trống hiện "Không giới hạn"; nếu còn dưới 7 ngày thì hiện thêm chữ nhỏ màu vàng "Sắp hết hạn") */}
                                <td className="py-3 px-3">
                                  {stu.expireDate ? (
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 font-mono text-gray-600 dark:text-gray-300">
                                      <span>{stu.expireDate}</span>
                                      {expiring && (
                                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 inline-flex items-center whitespace-nowrap">
                                          Sắp hết hạn
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">Không giới hạn</span>
                                  )}
                                </td>

                                {/* Cột 4: Tiến độ (thanh tiến độ + %) */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2 min-w-[120px]">
                                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${
                                          stu.progress === 100
                                            ? 'bg-blue-600 dark:bg-blue-500'
                                            : stu.status === 'cancelled'
                                            ? 'bg-gray-400'
                                            : 'bg-indigo-600'
                                        }`}
                                        style={{ width: `${stu.progress}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-xs text-gray-700 dark:text-gray-300 font-mono shrink-0">
                                      {stu.progress}%
                                    </span>
                                  </div>
                                </td>

                                {/* Cột 5: Nguồn đăng ký */}
                                <td className="py-3 px-3">
                                  {stu.orderId ? (
                                    <Link
                                      to="/admin/don-hang"
                                      className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                      Đơn {stu.orderId}
                                    </Link>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded font-medium">
                                      Thêm thủ công
                                    </span>
                                  )}
                                </td>

                                {/* Cột 6: Trạng thái */}
                                <td className="py-3 px-3 text-center">
                                  <Badge color={cfg.color}>{cfg.label}</Badge>
                                </td>

                                {/* Cột 7: Thao tác theo trạng thái */}
                                <td className="py-3 px-3 text-right">
                                  {stu.status === 'active' && (
                                    <div className="inline-flex items-center gap-2">
                                      <button
                                        onClick={() => openExtendModal(stu)}
                                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                                      >
                                        Gia hạn
                                      </button>
                                      <span className="text-gray-300 dark:text-gray-600">•</span>
                                      <button
                                        onClick={() => openCancelDialog(stu)}
                                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:underline"
                                      >
                                        Hủy đăng ký
                                      </button>
                                    </div>
                                  )}
                                  {stu.status === 'expired' && (
                                    <button
                                      onClick={() => openExtendModal(stu)}
                                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                                    >
                                      Gia hạn
                                    </button>
                                  )}
                                  {(stu.status === 'completed' || stu.status === 'cancelled') && (
                                    <span className="text-gray-400 font-medium">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* 5. MODAL GIA HẠN */}
      <Modal
        isOpen={extendModalOpen}
        onClose={() => {
          setExtendModalOpen(false);
          setExtendStudent(null);
        }}
        title="Gia hạn thời gian học"
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setExtendModalOpen(false);
                setExtendStudent(null);
              }}
            >
              Hủy
            </Button>
            <Button variant="primary" onClick={handleConfirmExtend}>
              Xác nhận gia hạn
            </Button>
          </>
        }
      >
        {extendStudent && (
          <div className="space-y-4 py-1">
            {/* Thông tin học viên */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-100 dark:border-gray-700">
              <img
                src={extendStudent.avatar}
                alt={extendStudent.name}
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-600"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">
                  {extendStudent.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{extendStudent.email}</p>
              </div>
            </div>

            {/* Ngày hết hạn hiện tại */}
            <div className="flex items-center justify-between py-2 text-xs border-b border-gray-100 dark:border-gray-700/60">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Ngày hết hạn hiện tại:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                {extendStudent.expireDate || 'Không giới hạn'}
              </span>
            </div>

            {/* Ô chọn Ngày hết hạn mới */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ngày hết hạn mới <span className="text-red-500">*</span>
                </label>
                {newExpireDateRaw && (
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 font-mono">
                    Hiển thị: {yyyyMmDdToDisplay(newExpireDateRaw)}
                  </span>
                )}
              </div>

              <input
                type="date"
                min={minExtendIso}
                value={newExpireDateRaw}
                onChange={(e) => {
                  setNewExpireDateRaw(e.target.value);
                  setDateError('');
                }}
                className={`
                  w-full px-3 py-2 text-sm rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors
                  ${dateError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}
                `}
              />
              {dateError && <p className="text-xs text-red-500 font-medium">{dateError}</p>}

              {/* Nút phụ chọn nhanh +30 ngày, +90 ngày */}
              <div className="flex items-center gap-2 pt-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">Chọn nhanh:</span>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(30)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  Gia hạn thêm 30 ngày
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAddDays(90)}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  Gia hạn thêm 90 ngày
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. HỘP XÁC NHẬN HỦY ĐĂNG KÝ */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        onClose={() => {
          setCancelConfirmOpen(false);
          setCancelStudent(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Xác nhận hủy đăng ký"
        description={`Hủy đăng ký của ${cancelStudent?.name}? Học viên sẽ không truy cập được khóa học này nữa.`}
        confirmLabel="Xác nhận hủy"
        cancelLabel="Hủy"
        variant="danger"
      />
    </div>
  );
}
