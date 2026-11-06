// src/pages/admin/CoursesPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Plus, LayoutGrid, List, Eye, Pencil, Trash2,
  Search, Image as ImageIcon, Info, Clock, Calendar,
  Sparkles, DollarSign, Layers, ExternalLink
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import SearchBar from '../../components/shared/SearchBar';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { courseService, categoryService } from '../../services/adminService';
import { COURSE_LEVEL, COURSE_FORMAT, MODERATION_STATUS } from '../../constants/enums';

// TODO: nối API - Thay mockCoursesList bằng GET /api/admin/courses
// - POST /api/admin/courses (Tạo khóa học)
// - PUT /api/admin/courses/:id (Cập nhật khóa học)
// - DELETE /api/admin/courses/:id (Xóa khóa học)

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatVnd = (value) => {
  if (value === null || value === undefined || value === '') return '(Chưa có)';
  if (Number(value) === 0) return 'Miễn phí';
  return `${Number(value).toLocaleString('vi-VN')} ₫`;
};

const hasPrice = (price) =>
  price !== null && price !== undefined && price !== '' && Number(price) > 0;

// ─── Options bộ lọc ──────────────────────────────────────────────────────────
const levelOptions = [
  { value: '', label: 'Tất cả trình độ' },
  { value: 'beginner', label: 'Cơ bản' },
  { value: 'intermediate', label: 'Trung cấp' },
  { value: 'advanced', label: 'Nâng cao' },
];

const examOptions = [
  { value: '', label: 'Tất cả kỳ thi' },
  { value: 'TOEIC', label: 'TOEIC' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'none', label: 'Không áp dụng' },
];

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'published', label: 'Đã xuất bản' },
  { value: 'draft', label: 'Nháp' },
  { value: 'archived', label: 'Đã lưu trữ' },
];

const moderationOptions = [
  { value: '', label: 'Tất cả trạng thái duyệt' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'rejected', label: 'Từ chối' },
];

const visibilityOptions = [
  { value: '', label: 'Tất cả hiển thị' },
  { value: 'visible', label: 'Đang hiển thị' },
  { value: 'hidden', label: 'Đang ẩn' },
];

const formatOptions = [
  { value: 'self_study', label: 'Tự học' },
  { value: 'with_class', label: 'Có lớp' },
];

// ─── Thumbnail component nhỏ ─────────────────────────────────────────────────
function CourseThumbnail({ url, size = 40 }) {
  if (url) {
    return (
      <img
        src={url}
        alt="thumbnail"
        className="rounded-lg object-cover shrink-0 border border-gray-100 dark:border-gray-700"
        style={{ width: size, height: size }}
        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div
      className="rounded-lg shrink-0 bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800"
      style={{ width: size, height: size }}
    >
      <BookOpen className="h-4 w-4 text-indigo-400" />
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function ToggleSwitch({ checked, onChange, title }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
      title={title}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Badge trạng thái duyệt ───────────────────────────────────────────────────
function ModerationBadge({ status, size = 'xs' }) {
  const cfg = MODERATION_STATUS[status] || MODERATION_STATUS.pending;
  return <Badge color={cfg.color} size={size}>{cfg.label}</Badge>;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoursesPage() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('table');

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [moderationFilter, setModerationFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');

  // Modal Thêm / Sửa
  const [modalState, setModalState] = useState({ isOpen: false, mode: 'create', item: null });

  const defaultForm = {
    title: '',
    category: '',
    description: '',
    level: 'intermediate',
    examType: 'TOEIC',
    price: '',
    status: 'draft',
    thumbnailUrl: '',
    entryLevel: '',
    targetScore: '',
    format: 'self_study',
    durationHours: '',
    accessDays: '',
    isVisible: false,
    moderationStatus: 'pending',
  };

  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

  // Confirm Xóa
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, item: null });

  const loadCourses = async () => {
    try {
      const [courseResult, categoryResult] = await Promise.all([
        courseService.getCourses({ page: 1, limit: 100 }), categoryService.list({ page: 1, limit: 100 }),
      ]);
      setCourses(courseResult);
      setCategories(categoryResult);
    } catch (error) { toast.error(error.message || 'Không tải được danh sách khóa học.'); }
  };
  useEffect(() => { loadCourses(); }, []);

  const categoryOptions = useMemo(() => [
    { value: '', label: 'Chọn danh mục...' },
    ...categories.map((c) => ({ value: c.name, label: c.name })),
  ], [categories]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch = !q || c.title.toLowerCase().includes(q) || c.creator.toLowerCase().includes(q);
      const matchCat = !catFilter || c.category === catFilter;
      const matchLevel = !levelFilter || c.level === levelFilter;
      const matchExam = !examFilter || c.examType === examFilter;
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchMod = !moderationFilter || c.moderationStatus === moderationFilter;
      const matchVis = !visibilityFilter
        || (visibilityFilter === 'visible' && c.isVisible !== false)
        || (visibilityFilter === 'hidden' && c.isVisible === false);
      return matchSearch && matchCat && matchLevel && matchExam && matchStatus && matchMod && matchVis;
    });
  }, [courses, search, catFilter, levelFilter, examFilter, statusFilter, moderationFilter, visibilityFilter]);

  const handleOpenCreate = () => {
    setFormData({
      ...defaultForm,
      category: categories[0]?.name || '',
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'create', item: null });
  };

  const handleOpenEdit = (item) => {
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description || '',
      level: item.level,
      examType: item.examType,
      price: item.price ?? '',
      status: item.status,
      thumbnailUrl: item.thumbnailUrl || '',
      entryLevel: item.entryLevel || '',
      targetScore: item.targetScore ?? '',
      format: item.format || 'self_study',
      durationHours: item.durationHours ?? '',
      accessDays: item.accessDays ?? '',
      isVisible: item.isVisible !== false,
      moderationStatus: item.moderationStatus || 'pending',
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'edit', item });
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Tên khóa học không được để trống';
    }
    if (formData.price !== '' && Number(formData.price) < 0) {
      errors.price = 'Học phí không được âm';
    }
    if (formData.isVisible && !hasPrice(formData.price)) {
      errors.price = 'Bắt buộc có học phí trước khi bật Hiển thị';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Vui lòng kiểm tra các trường bị lỗi');
      return;
    }

    const category = categories.find((item) => item.name === formData.category);
    if (!category) { toast.error('Hãy chọn danh mục đã có trong hệ thống.'); return; }
    const payload = { ...formData, categoryId: category.id, price: formData.price === '' ? null : Number(formData.price), targetScore: formData.targetScore === '' ? null : Number(formData.targetScore), durationHours: formData.durationHours === '' ? null : Number(formData.durationHours), accessDays: formData.accessDays === '' ? null : Number(formData.accessDays) };
    try {
      if (modalState.mode === 'create') {
        await courseService.createCourse(payload);
        toast.success(`Đã tạo khóa học "${formData.title}"`);
      } else {
        await courseService.updateCourse(modalState.item.id, payload);
        toast.success(`Đã cập nhật khóa học "${formData.title}"`);
      }
      await loadCourses();
    } catch (error) { toast.error(error.message || 'Không lưu được khóa học.'); return; }
    setModalState({ isOpen: false, mode: 'create', item: null });
  };

  const handleToggleVisibility = async (id) => {
    const course = courses.find((c) => c.id === id);
    if (!course) return;
    const nextVal = course.isVisible === false ? true : false;
    // Kiểm tra học phí khi bật
    if (nextVal && !hasPrice(course.price)) {
      toast.error('Cần nhập học phí trước khi bật Hiển thị');
      return;
    }
    try {
      await courseService.updateCourseVisibility(id, nextVal);
      toast.success(nextVal ? `Đã bật hiển thị cho "${course.title}"` : `Đã tắt hiển thị cho "${course.title}"`);
      await loadCourses();
    } catch (error) { toast.error(error.message || 'Không cập nhật được trạng thái hiển thị.'); }
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    try { await courseService.deleteCourse(item.id); toast.success(`Đã lưu trữ khóa học "${item.title}"`); await loadCourses(); }
    catch (error) { toast.error(error.message || 'Không lưu trữ được khóa học.'); }
    setDeleteConfirm({ isOpen: false, item: null });
  };

  // Gợi ý min/max điểm theo kỳ thi
  const scoreHint = formData.examType === 'TOEIC'
    ? 'TOEIC: 0 – 990 điểm'
    : formData.examType === 'IELTS'
    ? 'IELTS: 0 – 9.0, bước 0.5'
    : '';
  const scoreStep = formData.examType === 'IELTS' ? 0.5 : 1;
  const scoreMax = formData.examType === 'TOEIC' ? 990 : formData.examType === 'IELTS' ? 9 : undefined;

  // ─── Cột bảng ──────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'title',
      title: 'Tên khóa học',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <CourseThumbnail url={row.thumbnailUrl} size={40} />
            {/* fallback nếu img lỗi */}
            <div
              className="rounded-lg shrink-0 bg-indigo-50 dark:bg-indigo-900/30 items-center justify-center border border-indigo-100 dark:border-indigo-800 hidden"
              style={{ width: 40, height: 40, position: 'absolute', top: 0, left: 0 }}
            >
              <BookOpen className="h-4 w-4 text-indigo-400" />
            </div>
          </div>
          <div
            className="cursor-pointer group max-w-xs sm:max-w-sm"
            onClick={() => navigate(`/admin/khoa-hoc/${row.id}`)}
          >
            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
              {row.title}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span className="truncate">GV: {row.creator}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Danh mục',
      render: (v) => <Badge color="indigo" size="xs">{v}</Badge>,
    },
    {
      key: 'level',
      title: 'Trình độ',
      render: (v) => {
        const cfg = COURSE_LEVEL[v] || { label: v, color: 'gray' };
        return <Badge color={cfg.color} size="xs">{cfg.label}</Badge>;
      },
    },
    {
      key: 'price',
      title: 'Học phí',
      render: (v) => (
        <span className={`font-semibold text-sm ${!hasPrice(v) ? 'text-orange-500' : 'text-gray-900 dark:text-gray-100'}`}>
          {formatVnd(v)}
        </span>
      ),
    },
    {
      key: 'isVisible',
      title: 'Hiển thị',
      render: (_, row) => (
        <ToggleSwitch
          checked={row.isVisible !== false}
          onChange={(e) => { e.stopPropagation(); handleToggleVisibility(row.id); }}
          title={row.isVisible !== false ? 'Đang hiển thị – Bấm để ẩn' : 'Đang ẩn – Bấm để hiển thị'}
        />
      ),
    },
    {
      key: 'moderationStatus',
      title: 'Trạng thái duyệt',
      render: (v) => <ModerationBadge status={v} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (v) => <StatusBadge status={v} size="xs" />,
    },
    {
      key: 'updatedAt',
      title: 'Cập nhật',
      render: (v) => <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">{v}</span>,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      headerClass: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Xem chi tiết"
            onClick={() => navigate(`/admin/khoa-hoc/${row.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            title="Chỉnh sửa"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            title="Xóa"
            onClick={() => setDeleteConfirm({ isOpen: true, item: row })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quản lý Khóa học"
        subtitle={`Tổng cộng ${courses.length} chương trình đào tạo`}
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Xem dạng Bảng"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Xem dạng Lưới thẻ"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
            <Button icon={Plus} onClick={handleOpenCreate}>
              Thêm khóa học
            </Button>
          </div>
        }
      />

      {/* ─── BỘ LỌC ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên khóa, giảng viên..."
          className="w-full"
        />
        <Select
          options={[{ value: '', label: 'Tất cả danh mục' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
        />
        <Select options={levelOptions} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} />
        <Select options={examOptions} value={examFilter} onChange={(e) => setExamFilter(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Select options={statusOptions} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        <Select options={moderationOptions} value={moderationFilter} onChange={(e) => setModerationFilter(e.target.value)} />
        <Select options={visibilityOptions} value={visibilityFilter} onChange={(e) => setVisibilityFilter(e.target.value)} />
      </div>

      {/* ─── BẢNG hoặc LƯỚI ─────────────────────────────────────────────────── */}
      {viewMode === 'table' ? (
        <Table
          columns={columns}
          data={filtered}
          pageSize={8}
          emptyState={
            <EmptyState
              icon={BookOpen}
              title="Không tìm thấy khóa học"
              description="Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm"
              action={<Button size="sm" onClick={handleOpenCreate}>Thêm khóa học</Button>}
            />
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Không tìm thấy khóa học"
          description="Hãy thử thay đổi điều kiện lọc hoặc từ khóa tìm kiếm"
          action={<Button size="sm" onClick={handleOpenCreate}>Thêm khóa học</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
            >
              {/* Ảnh đại diện */}
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-36 object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-36 bg-indigo-50 dark:bg-indigo-900/20 items-center justify-center ${course.thumbnailUrl ? 'hidden' : 'flex'}`}
              >
                <BookOpen className="h-10 w-10 text-indigo-300" />
              </div>

              <div className="p-5 flex flex-col flex-1">
                {/* Badges trên đầu */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge color="indigo" size="xs">{course.category}</Badge>
                  <StatusBadge status={course.status} size="xs" />
                  <ModerationBadge status={course.moderationStatus} />
                  {course.isVisible === false && (
                    <Badge color="gray" size="xs">Đang ẩn</Badge>
                  )}
                </div>

                <h3
                  onClick={() => navigate(`/admin/khoa-hoc/${course.id}`)}
                  className="font-bold text-gray-900 dark:text-gray-100 text-sm mb-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer line-clamp-2"
                >
                  {course.title}
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                  {course.description || 'Chương trình đào tạo trọng tâm bám sát đề thi chuẩn hóa.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs py-3 border-y border-gray-100 dark:border-gray-700/60 mb-3">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Trình độ:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {COURSE_LEVEL[course.level]?.label || course.level}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Kỳ thi:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                      {course.examType === 'none' ? 'Không áp dụng' : course.examType}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Hình thức:</span>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {COURSE_FORMAT[course.format]?.label || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Thời lượng:</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {course.durationHours ? `${course.durationHours} giờ` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-1">
                  <div>
                    <span className="text-xs text-gray-400 block">Học phí:</span>
                    <span className={`text-sm font-bold ${!hasPrice(course.price) ? 'text-orange-500' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {formatVnd(course.price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(course)}>Sửa</Button>
                    <Button size="sm" onClick={() => navigate(`/admin/khoa-hoc/${course.id}`)}>Chi tiết</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL THÊM / SỬA ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', item: null })}
        title={modalState.mode === 'create' ? 'Thêm khóa học mới' : `Chỉnh sửa: ${modalState.item?.title}`}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setModalState({ isOpen: false, mode: 'create', item: null })}>
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {modalState.mode === 'create' ? 'Tạo khóa học' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Khung ghi chú xanh nhạt ── */}
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
            <span>
              <strong>Khóa học chỉ hiển thị với học viên khi:</strong>{' '}
              Đã xuất bản + bật Hiển thị + Đã duyệt.
            </span>
          </div>

          {/* ══ KHỐI 1: THÔNG TIN CƠ BẢN ══ */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-indigo-500" /> Thông tin cơ bản
            </h4>
            <div className="space-y-4">
              <Input
                label="Tên khóa học"
                required
                placeholder="Ví dụ: TOEIC 650+ Listening & Reading Cấp tốc"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (formErrors.title) setFormErrors({ ...formErrors, title: '' });
                }}
                error={formErrors.title}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Danh mục"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={categoryOptions}
                />
                <Select
                  label="Trình độ"
                  required
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  options={[
                    { value: 'beginner', label: 'Cơ bản (Mất gốc / Mới bắt đầu)' },
                    { value: 'intermediate', label: 'Trung cấp (Đã có nền tảng)' },
                    { value: 'advanced', label: 'Nâng cao (Chinh phục điểm cao)' },
                  ]}
                />
                <Select
                  label="Loại kỳ thi"
                  required
                  value={formData.examType}
                  onChange={(e) => {
                    setFormData({ ...formData, examType: e.target.value, targetScore: '' });
                  }}
                  options={[
                    { value: 'TOEIC', label: 'TOEIC (Listening & Reading)' },
                    { value: 'IELTS', label: 'IELTS (Academic / General)' },
                    { value: 'none', label: 'Không áp dụng (Giao tiếp / Ngữ pháp)' },
                  ]}
                />
                <Select
                  label="Trạng thái xuất bản"
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'draft', label: 'Bản nháp (Đang biên soạn)' },
                    { value: 'published', label: 'Đã xuất bản (Công khai ghi danh)' },
                    { value: 'archived', label: 'Đã lưu trữ (Ngừng mở lớp)' },
                  ]}
                />
              </div>

              <Textarea
                label="Mô tả khóa học"
                rows={3}
                placeholder="Giới thiệu mục tiêu, đối tượng học viên và phương pháp giảng dạy..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          {/* ══ KHỐI 2: THÔNG SỐ KHÓA HỌC ══ */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-1.5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-indigo-500" /> Thông số khóa học
            </h4>
            <div className="space-y-4">
              {/* Ảnh đại diện + preview */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Ảnh đại diện (URL)
                </label>
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <input
                      type="url"
                      maxLength={500}
                      placeholder="https://example.com/image.jpg"
                      value={formData.thumbnailUrl}
                      onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-400 mt-1">Tối đa 500 ký tự</p>
                  </div>
                  <div className="shrink-0 w-20 h-14 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600 overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                    {formData.thumbnailUrl ? (
                      <img
                        src={formData.thumbnailUrl}
                        alt="preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display='none'; }}
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-indigo-300" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Trình độ đầu vào"
                  placeholder="Ví dụ: Đã biết ngữ pháp cơ bản"
                  maxLength={100}
                  value={formData.entryLevel}
                  onChange={(e) => setFormData({ ...formData, entryLevel: e.target.value })}
                  hint="Tối đa 100 ký tự"
                />
                <Input
                  label="Điểm mục tiêu"
                  type="number"
                  min={0}
                  max={scoreMax}
                  step={scoreStep}
                  placeholder={formData.examType === 'TOEIC' ? 'VD: 650' : formData.examType === 'IELTS' ? 'VD: 7.0' : ''}
                  value={formData.targetScore}
                  onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
                  hint={scoreHint}
                  disabled={formData.examType === 'none'}
                />
                <Select
                  label="Hình thức"
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  options={formatOptions}
                />
                <Input
                  label="Thời lượng (giờ)"
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="VD: 36"
                  value={formData.durationHours}
                  onChange={(e) => setFormData({ ...formData, durationHours: e.target.value })}
                  hint="Cho phép số thập phân (bước 0.5)"
                />
                <Input
                  label="Số ngày truy cập"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="Để trống = không giới hạn"
                  value={formData.accessDays}
                  onChange={(e) => setFormData({ ...formData, accessDays: e.target.value })}
                  hint="Số nguyên, để trống nếu không giới hạn"
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hiển thị</label>
                  <div className="flex items-center gap-3 py-2">
                    <ToggleSwitch
                      checked={formData.isVisible}
                      onChange={() => {
                        const next = !formData.isVisible;
                        if (next && !hasPrice(formData.price)) {
                          setFormErrors({ ...formErrors, price: 'Bắt buộc có học phí trước khi bật Hiển thị' });
                          return;
                        }
                        setFormData({ ...formData, isVisible: next });
                      }}
                      title={formData.isVisible ? 'Đang hiển thị' : 'Đang ẩn'}
                    />
                    <span className="text-xs text-gray-500">
                      {formData.isVisible ? 'Bật – Khóa học xuất hiện với học viên' : 'Tắt – Ẩn khỏi học viên'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">Bật để khóa học xuất hiện với học viên</p>
                </div>
              </div>

              {/* Học phí */}
              <Input
                label="Học phí (VNĐ)"
                type="number"
                min={0}
                placeholder="VD: 1200000"
                value={formData.price}
                onChange={(e) => {
                  setFormData({ ...formData, price: e.target.value });
                  if (formErrors.price) setFormErrors({ ...formErrors, price: '' });
                }}
                error={formErrors.price}
                hint="Nhập 0 nếu miễn phí. Bắt buộc có học phí khi bật Hiển thị."
              />

              {/* Trạng thái duyệt – chỉ đọc */}
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái duyệt</span>
                  <ModerationBadge status={formData.moderationStatus} />
                </div>
                {formData.moderationStatus === 'pending' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                    <Info className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                    Khóa học sẽ được duyệt tại{' '}
                    <Link to="/admin/kiem-duyet" className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium inline-flex items-center gap-0.5" onClick={() => setModalState({ isOpen: false, mode: 'create', item: null })}>
                      Duyệt nội dung <ExternalLink className="h-3 w-3" />
                    </Link>
                  </p>
                )}
                {formData.moderationStatus === 'rejected' && (
                  <p className="text-xs text-red-500 mt-1">Khóa học đã bị từ chối. Vui lòng chỉnh sửa và gửi lại.</p>
                )}
                {formData.moderationStatus === 'approved' && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Khóa học đã được duyệt và sẵn sàng hiển thị.</p>
                )}
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── Confirm Xóa ────────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Xóa khóa học"
        description={`Bạn có chắc muốn xóa khóa học "${deleteConfirm.item?.title}"? Mọi dữ liệu liên quan sẽ bị gỡ bỏ.`}
        variant="danger"
        confirmLabel="Xóa khóa học"
      />
    </div>
  );
}
