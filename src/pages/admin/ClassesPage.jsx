// src/pages/admin/ClassesPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  School, Plus, Search, Filter, Eye, Pencil, Trash2,
  Calendar, Users, BookOpen, MapPin, Link2, Clock
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
import EmptyState from '../../components/shared/EmptyState';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { classService, courseService, teacherService } from '../../services/adminService';

// TODO: nối API - Thay thế bằng các endpoint /api/admin/classes
const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'ongoing', label: 'Đang diễn ra' },
  { value: 'completed', label: 'Đã hoàn thành' },
  { value: 'cancelled', label: 'Đã hủy' },
];

export default function ClassesPage() {
  const navigate = useNavigate();
  const toast = useToastContext();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const loadClasses = async () => {
    try {
      const [classResult, courseResult, teacherResult] = await Promise.all([
        classService.list({ page: 1, limit: 100 }), courseService.getCourses({ page: 1, limit: 100 }), teacherService.list({ page: 1, limit: 100 }),
      ]);
      setClasses(classResult.map((item) => ({ ...item, startDate: String(item.startDate).slice(0, 10), endDate: String(item.endDate).slice(0, 10), teacher: item.teacherName, maxStudents: item.capacity, enrolled: item.studentsCount })));
      setCourses(courseResult); setTeachers(teacherResult);
    } catch (error) { toast.error(error.message || 'Không tải được danh sách lớp học.'); }
  };
  useEffect(() => { loadClasses(); }, []);

  // Bộ lọc
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');

  // Danh sách khóa học và giảng viên để lọc
  const courseOptions = useMemo(() => {
    const list = Array.from(new Set(classes.map((c) => c.courseName).filter(Boolean)));
    return [
      { value: '', label: 'Tất cả khóa học' },
      ...list.map((c) => ({ value: c, label: c })),
    ];
  }, [classes]);

  const teacherOptions = useMemo(() => {
    const list = Array.from(new Set(classes.map((c) => c.teacher).filter(Boolean)));
    return [
      { value: '', label: 'Tất cả giảng viên' },
      ...list.map((t) => ({ value: t, label: t })),
    ];
  }, [classes]);

  // Modal Thêm / Sửa
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create',
    item: null,
  });

  const [formData, setFormData] = useState({
    name: '',
    courseName: 'TOEIC 650+ Listening & Reading Cấp tốc',
    teacher: 'ThS. Trần Thị Mai Phương',
    maxStudents: 25,
    startDate: '2024-11-15',
    endDate: '2025-01-30',
  });

  const [formErrors, setFormErrors] = useState({});

  // Confirm Xóa
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    item: null,
  });

  const filtered = useMemo(() => {
    return classes.filter((cls) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        cls.name.toLowerCase().includes(q) ||
        cls.teacher.toLowerCase().includes(q) ||
        cls.courseName.toLowerCase().includes(q);
      const matchStatus = !statusFilter || cls.status === statusFilter;
      const matchCourse = !courseFilter || cls.courseName === courseFilter;
      const matchTeacher = !teacherFilter || cls.teacher === teacherFilter;
      return matchSearch && matchStatus && matchCourse && matchTeacher;
    });
  }, [classes, search, statusFilter, courseFilter, teacherFilter]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      courseName: courses[0]?.title || '',
      teacher: teachers[0]?.name || '',
      maxStudents: 25,
      startDate: '2024-11-15',
      endDate: '2025-01-30',
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'create', item: null });
  };

  const handleOpenEdit = (item) => {
    setFormData({
      name: item.name,
      courseName: item.courseName,
      teacher: item.teacher,
      maxStudents: item.maxStudents,
      startDate: item.startDate,
      endDate: item.endDate,
    });
    setFormErrors({});
    setModalState({ isOpen: true, mode: 'edit', item });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên lớp học không được để trống';
    if (!formData.maxStudents || Number(formData.maxStudents) <= 0) {
      errors.maxStudents = 'Sĩ số tối đa phải lớn hơn 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const course = courses.find((item) => item.title === formData.courseName), teacher = teachers.find((item) => item.name === formData.teacher);
    if (!course || !teacher) { toast.error('Chọn khóa học và giảng viên có trong hệ thống.'); return; }
    const payload = { name: formData.name, courseId: course.id, teacherId: teacher.id, capacity: Number(formData.maxStudents), startDate: formData.startDate, endDate: formData.endDate };
    try {
      if (modalState.mode === 'create') { await classService.create(payload); toast.success(`Đã tạo lớp học "${formData.name}"`); }
      else { await classService.update(modalState.item.id, payload); toast.success(`Đã cập nhật lớp học "${formData.name}"`); }
      await loadClasses();
    } catch (error) { toast.error(error.message || 'Không lưu được lớp học.'); return; }

    setModalState({ isOpen: false, mode: 'create', item: null });
  };

  const handleDelete = async () => {
    const item = deleteConfirm.item;
    try { await classService.remove(item.id); toast.success(`Đã xóa lớp học "${item.name}"`); await loadClasses(); }
    catch (error) { toast.error(error.message || 'Không thể xóa lớp học.'); }
    setDeleteConfirm({ isOpen: false, item: null });
  };

  const columns = [
    {
      key: 'name',
      title: 'Tên lớp học & Khóa học',
      render: (_, row) => (
        <div
          className="cursor-pointer group max-w-xs"
          onClick={() => navigate(`/admin/lop-hoc/${row.id}`)}
        >
          <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {row.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-gray-400">
            <BookOpen className="h-3 w-3 inline shrink-0" />
            <span className="truncate">{row.courseName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'teacher',
      title: 'Giảng viên',
      render: (v) => (
        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">
          {v}
        </span>
      ),
    },
    {
      key: 'enrolled',
      title: 'Sĩ số học viên',
      render: (_, row) => {
        const percent = Math.min(Math.round((row.enrolled / row.maxStudents) * 100), 100);
        const isFull = row.enrolled >= row.maxStudents;
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {row.enrolled}/{row.maxStudents}
              </span>
              <span className={`font-semibold ${isFull ? 'text-amber-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {percent}%
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-amber-500' : 'bg-indigo-600'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'dates',
      title: 'Thời gian đào tạo',
      render: (_, row) => (
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
          <p className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            {row.startDate} → {row.endDate}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (v) => <StatusBadge status={v} size="xs" />,
    },
    {
      key: 'actions',
      title: 'Thao tác',
      headerClass: 'text-right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Xem chi tiết lớp học"
            onClick={() => navigate(`/admin/lop-hoc/${row.id}`)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            title="Chỉnh sửa lớp học"
            onClick={() => handleOpenEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            title="Xóa lớp học"
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
        title="Quản lý Lớp học"
        subtitle={`Theo dõi sĩ số và thời gian đào tạo của ${classes.length} lớp học`}
        actions={
          <Button icon={Plus} onClick={handleOpenCreate}>
            Tạo lớp học
          </Button>
        }
      />

      {/* Bộ lọc */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm tên lớp, giảng viên, khóa học..."
          className="w-full"
        />

        <Select
          options={courseOptions}
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        />

        <Select
          options={teacherOptions}
          value={teacherFilter}
          onChange={(e) => setTeacherFilter(e.target.value)}
        />

        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        />
      </div>

      {(search || statusFilter || courseFilter || teacherFilter) && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setCourseFilter('');
              setTeacherFilter('');
            }}
          >
            Xóa lọc
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        data={filtered}
        pageSize={8}
        emptyState={
          <EmptyState
            icon={School}
            title="Không tìm thấy lớp học"
            description="Hãy thử thay đổi điều kiện lọc hoặc tạo lớp học mới"
            action={<Button size="sm" onClick={handleOpenCreate}>Tạo lớp học</Button>}
          />
        }
      />

      {/* ─── MODAL TẠO / SỬA LỚP HỌC ───────────────────────────────────────── */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', item: null })}
        title={modalState.mode === 'create' ? 'Tạo lớp học mới' : `Chỉnh sửa: ${modalState.item?.name}`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="secondary"
              onClick={() => setModalState({ isOpen: false, mode: 'create', item: null })}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit}>
              {modalState.mode === 'create' ? 'Tạo lớp' : 'Lưu thay đổi'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Select
              label="Khóa học trực thuộc"
              required
              value={formData.courseName}
              onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
              options={courses.map((c) => ({ value: c.title, label: c.title }))}
            />
          </div>

          <div>
            <Input
              label="Tên lớp học"
              required
              placeholder="Ví dụ: TOEIC 650+ K26 - Tối 2-4-6"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
              }}
              error={formErrors.name}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label="Giảng viên phụ trách"
                required
                value={formData.teacher}
                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                options={teachers.map((teacher) => ({ value: teacher.name, label: teacher.name }))}
              />
            </div>
            <div>
              <Input
                label="Sĩ số tối đa"
                required
                type="number"
                placeholder="25"
                value={formData.maxStudents}
                onChange={(e) => {
                  setFormData({ ...formData, maxStudents: e.target.value });
                  if (formErrors.maxStudents) setFormErrors({ ...formErrors, maxStudents: '' });
                }}
                error={formErrors.maxStudents}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Ngày bắt đầu"
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Ngày kết thúc"
                required
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Xóa */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, item: null })}
        onConfirm={handleDelete}
        title="Xóa lớp học"
        description={`Bạn có chắc muốn xóa lớp học "${deleteConfirm.item?.name}"? Dữ liệu liên quan đến lớp học sẽ bị gỡ bỏ.`}
        variant="danger"
        confirmLabel="Xóa lớp học"
      />
    </div>
  );
}
