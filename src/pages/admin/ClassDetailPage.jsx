// src/pages/admin/ClassDetailPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, School, Users, Calendar, Clock, MapPin, Link2,
  UserPlus, UserMinus, Check, AlertCircle, Pencil, BookOpen,
  ShieldCheck
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { useToastContext } from '../../contexts/ToastContext';
import { mockClassesList } from '../../mock/training';
import { classService } from '../../services/adminService';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastContext();

  const fallbackClass = useMemo(() => {
    return mockClassesList.find((c) => c.id === id) || mockClassesList[0];
  }, [id]);
  const [classData, setClassData] = useState(fallbackClass);

  const [students, setStudents] = useState(classData.students || []);
  useEffect(() => {
    classService.getById(id)
      .then((result) => { setClassData(result); setStudents(result.students || []); })
      .catch((error) => toast.error(error.message || 'Không tải được chi tiết lớp học.'));
  }, [id]);

  // Modal Thêm học viên
  const [addStudentModal, setAddStudentModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    phone: '',
    targetScore: '700/990',
  });

  // Confirm Cho nghỉ
  const [dropConfirm, setDropConfirm] = useState({
    isOpen: false,
    student: null,
  });

  const handleAddStudent = async (e) => {
    e?.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim()) {
      toast.error('Vui lòng điền đầy đủ họ tên và email học viên');
      return;
    }

    let item;
    try {
      item = await classService.addStudent(id, { email: newStudent.email.trim(), targetScore: newStudent.targetScore });
    } catch (error) { toast.error(error.message || 'Không thêm được học viên. Học viên cần có tài khoản đang hoạt động.'); return; }
    setStudents((previous) => [...previous, item]);
    toast.success(`Đã thêm học viên "${item.name}" vào lớp`);
    setAddStudentModal(false);
    setNewStudent({ name: '', email: '', phone: '', targetScore: '700/990' });
  };

  const handleDropStudent = async () => {
    const student = dropConfirm.student;
    try { await classService.updateStudent(id, student.id, 'dropped'); }
    catch (error) { toast.error(error.message || 'Không cập nhật được ghi danh.'); return; }
    setStudents((prev) =>
      prev.map((s) => (s.id === student.id ? { ...s, status: 'dropped' } : s))
    );
    toast.info(`Đã chuyển trạng thái học viên "${student.name}" sang Đã nghỉ`);
    setDropConfirm({ isOpen: false, student: null });
  };

  const percentEnrolled = Math.min(
    Math.round((students.filter((s) => s.status === 'studying').length / classData.maxStudents) * 100),
    100
  );

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate('/admin/lop-hoc')}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Quay lại danh sách lớp học
        </button>

        <PageHeader
          title={classData.name}
          subtitle={`Khóa học: ${classData.courseName} • Giảng viên: ${classData.teacher}`}
          breadcrumbs={[
            { label: 'Admin', path: '/admin' },
            { label: 'Lớp học', path: '/admin/lop-hoc' },
            { label: classData.name },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <StatusBadge status={classData.status} />
              <Button size="sm" variant="secondary" icon={Pencil} onClick={() => toast.wip()}>
                Chỉnh sửa lớp
              </Button>
            </div>
          }
        />
      </div>

      <Card padding={false} className="p-6">
        <Tabs
          tabs={[
            // ─── TAB 1: TỔNG QUAN LỚP HỌC ────────────────────────────────────
            {
              key: 'overview',
              label: 'Tổng quan',
              icon: School,
              content: (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1">Khóa học trực thuộc</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {classData.courseName}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1">Giảng viên phụ trách</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {classData.teacher}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1">Sĩ số học viên</span>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-base">
                          {students.filter((s) => s.status === 'studying').length}/{classData.maxStudents}
                        </span>
                        <span className="text-xs font-semibold text-gray-500">{percentEnrolled}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                        <div
                          className="bg-indigo-600 h-full rounded-full"
                          style={{ width: `${percentEnrolled}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1">Thời gian khóa học</span>
                      <span className="font-mono text-gray-800 dark:text-gray-200 text-xs">
                        {classData.startDate} → {classData.endDate}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> Địa điểm học trực tiếp
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {classData.room || 'Không tổ chức trực tiếp (Lớp 100% Online)'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700">
                      <span className="text-xs text-gray-400 block mb-1 flex items-center gap-1">
                        <Link2 className="h-3.5 w-3.5" /> Link phòng học trực tuyến (Online)
                      </span>
                      {classData.onlineLink ? (
                        <a
                          href={classData.onlineLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-mono text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                        >
                          {classData.onlineLink}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">Không áp dụng link online</span>
                      )}
                    </div>
                  </div>

                  {classData.note && (
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                      <strong>Ghi chú điều hành:</strong> {classData.note}
                    </div>
                  )}
                </div>
              ),
            },

            // ─── TAB 2: HỌC VIÊN CỦA LỚP ─────────────────────────────────────
            {
              key: 'students',
              label: 'Học viên',
              icon: Users,
              count: students.length,
              content: (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        Danh sách học viên trong lớp
                      </h4>
                      <p className="text-xs text-gray-400">
                        {students.filter((s) => s.status === 'studying').length} đang học •{' '}
                        {students.filter((s) => s.status === 'dropped').length} đã nghỉ
                      </p>
                    </div>
                    <Button size="sm" icon={UserPlus} onClick={() => setAddStudentModal(true)}>
                      Thêm học viên
                    </Button>
                  </div>

                  {students.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 text-xs">
                      Lớp học chưa có học viên nào. Nhấn "Thêm học viên" để ghi danh.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 uppercase text-[10px] font-semibold border-b border-gray-100 dark:border-gray-700">
                          <tr>
                            <th className="py-3 px-3">Họ và tên</th>
                            <th className="py-3 px-3">Email</th>
                            <th className="py-3 px-3">Điện thoại</th>
                            <th className="py-3 px-3">Mục tiêu điểm số</th>
                            <th className="py-3 px-3">Trạng thái học</th>
                            <th className="py-3 px-3 text-right">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                          {students.map((stu) => {
                            const isStudying = stu.status === 'studying';
                            return (
                              <tr key={stu.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <td className="py-3 px-3 font-bold text-gray-900 dark:text-gray-100">
                                  {stu.name}
                                </td>
                                <td className="py-3 px-3 text-gray-500">{stu.email}</td>
                                <td className="py-3 px-3 font-mono text-gray-600 dark:text-gray-300">
                                  {stu.phone}
                                </td>
                                <td className="py-3 px-3">
                                  <Badge color="blue" size="xs">{stu.targetScore}</Badge>
                                </td>
                                <td className="py-3 px-3">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                                      isStudying
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                    }`}
                                  >
                                    {isStudying ? 'Đang học' : 'Đã nghỉ'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  {isStudying ? (
                                    <button
                                      onClick={() => setDropConfirm({ isOpen: true, student: stu })}
                                      className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium hover:underline inline-flex items-center gap-1"
                                      title="Cho học viên nghỉ"
                                    >
                                      <UserMinus className="h-3.5 w-3.5" /> Cho nghỉ
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 text-xs italic">Đã ngừng học</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Modal Thêm học viên */}
      <Modal
        isOpen={addStudentModal}
        onClose={() => setAddStudentModal(false)}
        title="Thêm học viên vào lớp"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" onClick={() => setAddStudentModal(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddStudent}>Thêm học viên</Button>
          </div>
        }
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <Input
              label="Họ và tên học viên"
              required
              placeholder="Ví dụ: Nguyễn Văn An"
              value={newStudent.name}
              onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            />
          </div>

          <div>
            <Input
              label="Email"
              required
              type="email"
              placeholder="an.nguyen@example.com"
              value={newStudent.email}
              onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Số điện thoại"
                placeholder="0901234567"
                value={newStudent.phone}
                onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Mục tiêu điểm số"
                placeholder="Ví dụ: 750/990"
                value={newStudent.targetScore}
                onChange={(e) => setNewStudent({ ...newStudent, targetScore: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Confirm Cho nghỉ */}
      <ConfirmDialog
        isOpen={dropConfirm.isOpen}
        onClose={() => setDropConfirm({ isOpen: false, student: null })}
        onConfirm={handleDropStudent}
        title="Xác nhận cho học viên nghỉ học"
        description={`Bạn có chắc muốn chuyển trạng thái của học viên "${dropConfirm.student?.name}" sang Đã nghỉ?`}
        variant="warning"
        confirmLabel="Đồng ý cho nghỉ"
      />
    </div>
  );
}
