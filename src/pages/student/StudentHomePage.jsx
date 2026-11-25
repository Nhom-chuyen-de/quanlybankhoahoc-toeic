import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, LogOut, BookOpen, Clock, Calendar, CheckCircle,
  PlayCircle, Award, ShoppingCart, HelpCircle, FileText, CheckCircle2,
  XCircle, AlertCircle, Volume2, ChevronRight, ArrowLeft, ExternalLink,
  Sparkles, RefreshCw, QrCode, Copy, Check, Tag, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/useToast';
import {
  studentLearningService,
  studentExamService,
  studentOrderService,
  studentSupportService,
  studentCourseService
} from '../../services/studentService';

export default function StudentHomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'schedule' | 'exam' | 'orders'
  const [isLoading, setIsLoading] = useState(true);

  // Dữ liệu học viên từ Backend
  const [myCourses, setMyCourses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [examScores, setExamScores] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

  // Modal học bài
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [curriculum, setCurriculum] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);

  // Modal làm bài Quiz
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Modal Thanh toán Mã QR (VietQR / MoMo)
  const [purchasingCourse, setPurchasingCourse] = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('vietqr'); // 'vietqr' | 'momo'
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [qrPaymentData, setQrPaymentData] = useState(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Tải dữ liệu ban đầu
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [coursesRes, schedulesRes, attendRes, ordersRes, certsRes, scoresRes, allCoursesRes] = await Promise.allSettled([
        studentLearningService.getMyCourses(),
        studentLearningService.getMySchedules(),
        studentLearningService.getMyAttendance(),
        studentOrderService.getMyOrders(),
        studentSupportService.getMyCertificates(),
        studentExamService.getMyScores(),
        studentCourseService.getAllCourses(),
      ]);

      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data) {
        setMyCourses(coursesRes.value.data);
      }
      if (schedulesRes.status === 'fulfilled' && schedulesRes.value?.data) {
        setSchedules(schedulesRes.value.data);
      }
      if (attendRes.status === 'fulfilled' && attendRes.value?.data) {
        setAttendances(attendRes.value.data);
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        setMyOrders(ordersRes.value.data);
      }
      if (certsRes.status === 'fulfilled' && certsRes.value?.data) {
        setCertificates(certsRes.value.data);
      }
      if (scoresRes.status === 'fulfilled' && scoresRes.value?.data) {
        setExamScores(scoresRes.value.data);
      }
      if (allCoursesRes.status === 'fulfilled' && allCoursesRes.value?.data) {
        setAvailableCourses(allCoursesRes.value.data);
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu từ API:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Sao chép nội dung chuyển khoản
  const handleCopyText = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Áp dụng mã giảm giá
  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || !purchasingCourse) return;
    setIsApplyingCoupon(true);
    try {
      const res = await studentOrderService.validateCoupon(couponInput.trim(), purchasingCourse.gia);
      if (res.success && res.data) {
        setAppliedCoupon(res.data);
        toast.success(`Áp dụng mã giảm giá thành công: -${res.data.discountAmount.toLocaleString('vi-VN')} ₫`);
      }
    } catch (err) {
      toast.error(err.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Tạo mã QR thanh toán
  const handleInitQRPayment = async () => {
    if (!purchasingCourse) return;
    setIsGeneratingQR(true);
    try {
      const res = await studentOrderService.initQRPayment({
        courseId: purchasingCourse.id,
        couponCode: appliedCoupon?.code || null,
        paymentMethod: selectedPaymentMethod,
      });

      if (res.success && res.data) {
        setQrPaymentData(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tạo mã QR thanh toán');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  // Xác nhận đã chuyển khoản
  const handleConfirmQRPayment = async () => {
    if (!qrPaymentData?.order?.id) return;
    setIsConfirmingPayment(true);
    try {
      const res = await studentOrderService.confirmQRPayment(qrPaymentData.order.id);
      if (res.success) {
        setPaymentCompleted(true);
        toast.success('Thanh toán thành công! Khóa học đã được mở khóa ngay lập tức.');
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Xác nhận thanh toán thất bại');
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  // Đóng Modal thanh toán
  const handleClosePaymentModal = () => {
    setPurchasingCourse(null);
    setQrPaymentData(null);
    setAppliedCoupon(null);
    setCouponInput('');
    setPaymentCompleted(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mở khóa học để học bài
  const handleOpenCourse = async (course) => {
    setSelectedCourse(course);
    try {
      const res = await studentLearningService.getCourseCurriculum(course.id);
      if (res.success && res.data) {
        setCurriculum(res.data);
        // Mặc định chọn bài học đầu tiên
        if (res.data[0]?.lessons[0]) {
          setActiveLesson(res.data[0].lessons[0]);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải giáo trình bài học');
    }
  };

  // Hoàn thành bài học
  const handleCompleteLesson = async (lessonId) => {
    if (!selectedCourse) return;
    try {
      await studentLearningService.completeLesson(selectedCourse.id, lessonId);
      toast.success('Đã ghi nhận hoàn thành bài học!');
      // Cập nhật lại trạng thái local
      setCurriculum((prev) =>
        prev.map((ch) => ({
          ...ch,
          lessons: ch.lessons.map((l) => (l.id === lessonId ? { ...l, daHoanThanh: true } : l)),
        }))
      );
      if (activeLesson?.id === lessonId) {
        setActiveLesson((prev) => ({ ...prev, daHoanThanh: true }));
      }
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || 'Lỗi khi cập nhật tiến độ');
    }
  };

  // Bắt đầu làm bài Quiz mẫu
  const handleStartQuiz = async (quizId = 'QZ001') => {
    try {
      const res = await studentExamService.getQuiz(quizId);
      if (res.success && res.data) {
        setActiveQuiz(res.data);
        setQuizAnswers({});
        setQuizResult(null);
      }
    } catch (err) {
      toast.error(err.message || 'Không thể tải đề thi trắc nghiệm');
    }
  };

  // Nộp bài Quiz
  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    setIsSubmittingQuiz(true);
    try {
      const res = await studentExamService.submitQuiz(activeQuiz.id, quizAnswers);
      if (res.success && res.data) {
        setQuizResult(res.data);
        toast.success(`Chấm điểm hoàn tất! Điểm TOEIC dự kiến: ${res.data.diemTOEIC}/990`);
        loadDashboardData();
      }
    } catch (err) {
      toast.error(err.message || 'Lỗi khi nộp bài');
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* ─── HEADER HỌC VIÊN ────────────────────────────────────── */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base leading-none text-slate-900 dark:text-white">TOEIC Master</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Online Backend v1.0
              </span>
            </div>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase">
              Cổng học viên cá nhân
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{user?.hoTen || 'Phạm Minh Đức'}</p>
            <p className="text-[11px] text-slate-400">{user?.email || 'student@toeic.vn'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* ─── NỘI DUNG CHÍNH DASHBOARD HỌC VIÊN ──────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Banner chào mừng & Thống kê nhanh */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium backdrop-blur-sm mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Mục tiêu TOEIC 650+ / IELTS 7.0
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xin chào, {user?.hoTen || 'Học viên'}!
              </h2>
              <p className="mt-1 text-sm text-indigo-100 max-w-xl">
                Chúc bạn có một buổi học năng suất. Hãy tiếp tục lộ trình luyện đề ETS hôm nay để bứt phá mục tiêu điểm số!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartQuiz('QZ001')}
                className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-bold text-xs sm:text-sm hover:bg-indigo-50 shadow-md transition-all flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Làm bài Quiz ngay</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Thẻ KPI Học tập */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Khóa học đã đăng ký</span>
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{myCourses.length || 1}</p>
            <span className="text-[11px] text-slate-400">Đang theo học tích cực</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tiến độ hoàn thành</span>
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {myCourses[0]?.progressPercent || 3}%
            </p>
            <span className="text-[11px] text-slate-400">Theo chuẩn khung đề cương</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Điểm thi thử cao nhất</span>
              <Award className="w-5 h-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {examScores[0]?.diemTOEIC ? `${examScores[0].diemTOEIC}/990` : '990/990'}
            </p>
            <span className="text-[11px] text-emerald-600 font-medium">Đạt mục tiêu ban đầu</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lịch học tiếp theo</span>
              <Calendar className="w-5 h-5" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white truncate">19:30 Tối nay</p>
            <span className="text-[11px] text-indigo-600 font-medium">Lớp TOEIC-K24 Google Meet</span>
          </div>
        </div>

        {/* Thanh Điều hướng Tab Chức năng */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
          {[
            { key: 'courses', label: 'Khóa học của tôi (LMS)', icon: BookOpen },
            { key: 'schedule', label: 'Thời khóa biểu & Lớp học', icon: Calendar },
            { key: 'exam', label: 'Luyện đề & Thi trắc nghiệm', icon: FileText },
            { key: 'orders', label: 'Lịch sử Mua & Chứng chỉ', icon: ShoppingCart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: KHÓA HỌC CỦA TÔI & KHÁM PHÁ KHÓA HỌC ─── */}
        {activeTab === 'courses' && (
          <div className="space-y-8">
            {/* Mục 1: Khóa học đang học */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                  <span>Khóa học đang học ({myCourses.length})</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((item) => {
                  const c = item.course || item;
                  const percent = item.progressPercent || 3;
                  return (
                    <div
                      key={item.enrollmentId || c.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                    >
                      <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                        <img
                          src={c.hinhAnh || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop'}
                          alt={c.tieuDe}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm">
                          {c.danhMuc || 'TOEIC'}
                        </span>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{c.tieuDe}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{c.moTa}</p>
                          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-2">
                            Giảng viên: {c.giangVien || 'ThS. Trần Thị Mai Phương'}
                          </p>
                        </div>

                        {/* Tiến độ học */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-500">Tiến độ bài học</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenCourse(c)}
                          className="w-full h-10 rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Vào bài học chi tiết</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mục 2: Khám phá & Đăng ký Khóa học Mới với Mã QR */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <span>Khám phá & Đăng ký Khóa học mới (Thanh toán Mã QR)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hỗ trợ quét mã VietQR tự động qua ứng dụng mọi ngân hàng hoặc Ví MoMo, kích hoạt tức thì.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCourses
                  .filter((c) => !myCourses.some((mc) => (mc.course?.id || mc.id) === c.id))
                  .map((course) => (
                    <div
                      key={course.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-44 w-full relative overflow-hidden bg-slate-100">
                          <img src={course.hinhAnh} alt={course.tieuDe} className="w-full h-full object-cover" />
                          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 text-white shadow-sm">
                            {course.danhMuc}
                          </span>
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-400 text-slate-900 shadow-sm">
                            {course.trinhDo}
                          </span>
                        </div>

                        <div className="p-5 space-y-2">
                          <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{course.tieuDe}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{course.moTa}</p>
                          <p className="text-xs text-slate-400">Giảng viên: <strong className="text-slate-700 dark:text-slate-300">{course.giangVien}</strong></p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-baseline justify-between pt-3">
                          <div>
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                              {course.gia.toLocaleString('vi-VN')} ₫
                            </span>
                            {course.giaGoc && (
                              <span className="text-xs text-slate-400 line-through ml-2">
                                {course.giaGoc.toLocaleString('vi-VN')} ₫
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 rounded-md">
                            Khai giảng ngay
                          </span>
                        </div>

                        <button
                          onClick={() => setPurchasingCourse(course)}
                          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Đăng ký ngay (Quét mã QR)</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: THỜI KHÓA BIỂU & ĐIỂM DANH ────────────────── */}
        {activeTab === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lịch học sắp tới */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  <span>Thời khóa biểu trực tuyến</span>
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 font-semibold">
                  Google Meet
                </span>
              </div>

              <div className="space-y-3">
                {(schedules.length > 0 ? schedules : [
                  { id: '1', ngayHoc: 'Tối Thứ Tư, 25/11/2026', gioHoc: '19:30 - 21:00', chuDe: 'Luyện đề Part 3 Conversation & Kỹ năng Skimming', linkPhongHoc: 'https://meet.google.com/toeic-k24-master' },
                  { id: '2', ngayHoc: 'Tối Thứ Sáu, 27/11/2026', gioHoc: '19:30 - 21:00', chuDe: 'Phân tích cấu trúc ngữ pháp khó Part 5', linkPhongHoc: 'https://meet.google.com/toeic-k24-master' },
                ]).map((sch) => (
                  <div key={sch.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{sch.ngayHoc} • {sch.gioHoc}</p>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{sch.chuDe}</h4>
                    </div>
                    <a
                      href={sch.linkPhongHoc || 'https://meet.google.com'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                    >
                      <span>Vào lớp</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Lịch sử điểm danh */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Nhật ký điểm danh (Điểm chuyên cần: 100%)</span>
              </h3>
              <div className="space-y-2.5">
                {(attendances.length > 0 ? attendances : [
                  { buoiHoc: 'Buổi 1: Tổng quan format TOEIC 2026', coMat: true },
                  { buoiHoc: 'Buổi 2: Bí quyết Listening Part 1 & 2', coMat: true },
                  { buoiHoc: 'Buổi 3: Luyện phản xạ câu hỏi Wh-questions', coMat: true },
                ]).map((att, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{att.buoiHoc}</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" /> Có mặt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: LUYỆN ĐỀ & THI TRẮC NGHIỆM ───────────────── */}
        {activeTab === 'exam' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Luyện thi thử ETS TOEIC 2026</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Đề thi chuẩn format kèm file nghe audio thực tế, tự động bấm giờ và quy đổi điểm số TOEIC 990.
                </p>
              </div>
              <button
                onClick={() => handleStartQuiz('QZ001')}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Bắt đầu làm bài thi mẫu (QZ001)</span>
              </button>
            </div>

            {/* Lịch sử điểm thi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Lịch sử bài thi đã nộp</h4>
              {examScores.length > 0 ? (
                <div className="space-y-3">
                  {examScores.map((score) => (
                    <div key={score.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{score.tieuDe}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Số câu đúng: {score.soCauDung}/{score.tongSoCau} câu</p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-indigo-600">{score.diemTOEIC} / 990</span>
                        <p className="text-[10px] text-emerald-600 font-semibold">Thành tích cao</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Bạn chưa nộp bài thi nào. Hãy bấm "Bắt đầu làm bài thi mẫu" ở trên!</p>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: ĐƠN HÀNG & CHỨNG CHỈ ─────────────────────── */}
        {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Đơn hàng */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>Đơn hàng đã thanh toán</span>
              </h3>
              <div className="space-y-3">
                {myOrders.map((ord) => (
                  <div key={ord.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-mono font-bold text-indigo-600">{ord.id}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                        Đã thanh toán
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{ord.khoaHocTen}</p>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Cổng: {ord.phuongThuc?.toUpperCase()}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{ord.tongTien?.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chứng chỉ */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Chứng nhận hoàn thành khóa học</span>
              </h3>
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <div key={cert.id} className="p-4 rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-slate-800 dark:to-slate-800/60 border border-amber-200 dark:border-slate-700 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Mã: {cert.maChungChi || cert.certificateNumber}</span>
                      <span className="text-xs font-bold text-emerald-600">Xếp loại: {cert.xepLoai || 'Xuất sắc'}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{cert.tenKhoaHoc || cert.courseName}</p>
                    <p className="text-xs text-slate-500">Ngày cấp: {cert.ngayCap || cert.issueDate} • Điểm đạt: {cert.diemSo || cert.score}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL HỌC BÀI (LMS LEARNING MODAL) ──────────────────── */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCourse(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-lg">
                  {selectedCourse.tieuDe}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCourse(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>

            {/* Modal Body: Cột video và Cột danh sách bài học */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Player & Bài học hiện tại */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {activeLesson?.videoUrl ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md">
                    <video
                      controls
                      src={activeLesson.videoUrl}
                      className="w-full h-full"
                      poster={selectedCourse.hinhAnh}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full rounded-xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center p-6 text-center">
                    <div>
                      <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                      <p className="font-bold text-sm text-slate-800 dark:text-white">Bài học tài liệu / Trắc nghiệm</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">{activeLesson?.tieuDe}</h4>
                    <span className="text-xs text-slate-400">Thời lượng: {activeLesson?.thoiLuong || '30 phút'}</span>
                  </div>
                  {activeLesson && (
                    <button
                      onClick={() => handleCompleteLesson(activeLesson.id)}
                      disabled={activeLesson.daHoanThanh}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        activeLesson.daHoanThanh
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{activeLesson.daHoanThanh ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Danh sách giáo trình bên phải */}
              <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Nội dung khóa học</h5>
                <div className="space-y-4">
                  {curriculum.map((chapter) => (
                    <div key={chapter.id} className="space-y-1.5">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{chapter.tieuDe}</p>
                      <div className="space-y-1">
                        {chapter.lessons.map((les) => (
                          <button
                            key={les.id}
                            onClick={() => setActiveLesson(les)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-all ${
                              activeLesson?.id === les.id
                                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                                : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate pr-2">{les.tieuDe}</span>
                            {les.daHoanThanh && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL LÀM QUIZ TRẮC NGHIỆM ──────────────────────────── */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <span>{activeQuiz.tieuDe}</span>
              </h3>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Thoát
              </button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {quizResult ? (
                /* Kết quả bài thi */
                <div className="space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">Chúc mừng bạn đã hoàn thành bài thi!</h4>
                    <p className="text-sm text-slate-500 mt-1">Kết quả đã được ghi nhận vào hệ thống quản lý đào tạo.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 inline-flex items-center gap-6">
                    <div>
                      <span className="text-xs text-slate-500 block">Số câu đúng</span>
                      <span className="text-xl font-bold text-indigo-600">{quizResult.soCauDung} / {quizResult.tongSoCau}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <span className="text-xs text-slate-500 block">Điểm TOEIC quy đổi</span>
                      <span className="text-2xl font-black text-indigo-600">{quizResult.diemTOEIC} / 990</span>
                    </div>
                  </div>

                  {/* Lời giải chi tiết */}
                  <div className="text-left space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="font-bold text-sm">Đáp án & Lời giải chi tiết:</h5>
                    {quizResult.chiTietKetQua.map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span>Câu {idx + 1}: {item.cauHoi}</span>
                          <span className={item.dung ? 'text-emerald-600' : 'text-red-500'}>
                            {item.dung ? 'Đúng' : 'Sai'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Bạn chọn: <strong className="text-slate-800 dark:text-slate-200">{item.luaChonHocVien || 'Chưa chọn'}</strong> | Đáp án đúng: <strong className="text-emerald-600">{item.dapAnDung}</strong>
                        </p>
                        <p className="text-[11px] text-slate-500 italic mt-1">{item.giaiThich}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Form trả lời câu hỏi */
                <div className="space-y-6">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <p className="font-bold text-sm text-slate-900 dark:text-white">
                        Câu {idx + 1}: {q.cauHoi}
                      </p>

                      {q.hinhAnh && (
                        <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={q.hinhAnh} alt="Quiz ETS Part 1" className="w-full h-auto" />
                        </div>
                      )}

                      {q.amThanh && (
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
                          <Volume2 className="w-5 h-5 text-indigo-600" />
                          <audio controls src={q.amThanh} className="w-full h-8" />
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        {q.luaChon.map((opt) => (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                              quizAnswers[q.id] === opt.id
                                ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-semibold'
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.id}
                              checked={quizAnswers[q.id] === opt.id}
                              onChange={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                              className="w-4 h-4 text-indigo-600"
                            />
                            <span>{opt.noiDung}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-16 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0">
              {!quizResult ? (
                <>
                  <span className="text-xs text-slate-400">
                    Đã trả lời: {Object.keys(quizAnswers).length} / {activeQuiz.tongSoCau} câu
                  </span>
                  <button
                    onClick={handleSubmitQuiz}
                    disabled={isSubmittingQuiz}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <span>{isSubmittingQuiz ? 'Đang chấm điểm...' : 'Nộp bài thi'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                >
                  Đóng kết quả
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL THANH TOÁN MÃ QR (VIETQR / MOMO) ─────────────── */}
      {purchasingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 my-auto animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Thanh toán đăng ký khóa học</h3>
                  <p className="text-xs text-slate-400">Kích hoạt tự động qua quét mã QR</p>
                </div>
              </div>
              <button
                onClick={handleClosePaymentModal}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>

            {/* Màn hình 1: Thanh toán Thành công */}
            {paymentCompleted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900 dark:text-white">Thanh toán & Ghi danh thành công!</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Khóa học <strong>{purchasingCourse.tieuDe}</strong> đã được thêm vào tài khoản của bạn.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const c = purchasingCourse;
                    handleClosePaymentModal();
                    handleOpenCourse(c);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Vào học khóa này ngay
                </button>
              </div>
            ) : !qrPaymentData ? (
              /* Màn hình 2: Xác nhận đơn & Áp mã giảm giá */
              <div className="space-y-4">
                {/* Thông tin khóa học */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                  <img src={purchasingCourse.hinhAnh} alt={purchasingCourse.tieuDe} className="w-16 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{purchasingCourse.tieuDe}</h5>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">{purchasingCourse.gia.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>

                {/* Ô nhập mã giảm giá */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mã ưu đãi / Voucher (Gợi ý: TOEIC2026 hoặc GIAM100K)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá..."
                      className="flex-1 h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none uppercase font-mono"
                    />
                    <button
                      type="button"
                      disabled={!couponInput.trim() || isApplyingCoupon}
                      onClick={handleApplyCoupon}
                      className="px-4 h-10 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {isApplyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng'}
                    </button>
                  </div>
                </div>

                {/* Phương thức thanh toán */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chọn phương thức quét mã QR:</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('vietqr')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'vietqr'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="font-bold text-xs flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-indigo-600" />
                        <span>VietQR 24/7 (MBBank)</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Mọi ứng dụng ngân hàng</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('momo')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedPaymentMethod === 'momo'
                          ? 'border-pink-600 bg-pink-50/50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <p className="font-bold text-xs flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-pink-600 text-white flex items-center justify-center text-[10px] font-black">M</span>
                        <span>Ví MoMo QR</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Quét bằng app MoMo</p>
                    </button>
                  </div>
                </div>

                {/* Tóm tắt số tiền */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Học phí gốc:</span>
                    <span>{purchasingCourse.gia.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Giảm giá ({appliedCoupon.code}):</span>
                      <span>-{appliedCoupon.discountAmount.toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                    <span>Tổng thanh toán:</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {(appliedCoupon ? appliedCoupon.finalAmount : purchasingCourse.gia).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isGeneratingQR}
                  onClick={handleInitQRPayment}
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{isGeneratingQR ? 'Đang tạo mã QR...' : 'Tạo mã QR thanh toán'}</span>
                </button>
              </div>
            ) : (
              /* Màn hình 3: Quét mã QR & Xác nhận thanh toán */
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  {/* Ảnh mã QR */}
                  <div className="w-48 h-48 bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm shrink-0 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={qrPaymentData.paymentInfo.qrImageUrl}
                      alt="VietQR Code"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        // Fallback sang API QR code dự phòng nếu VietQR bị chặn mạng
                        e.target.onerror = null;
                        const data = `2|99|${qrPaymentData.paymentInfo.accountNo}|${qrPaymentData.paymentInfo.accountName}|${qrPaymentData.paymentInfo.amount}|${qrPaymentData.paymentInfo.transferContent}`;
                        e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
                      }}
                    />
                  </div>

                  {/* Thông tin chuyển khoản */}
                  <div className="flex-1 space-y-2 text-xs w-full">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Ngân hàng</span>
                      <p className="font-bold text-slate-900 dark:text-white">{qrPaymentData.paymentInfo.bankName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Số tài khoản</span>
                      <div className="flex items-center justify-between font-mono font-bold text-sm text-indigo-600">
                        <span>{qrPaymentData.paymentInfo.accountNo}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(qrPaymentData.paymentInfo.accountNo, 'Số tài khoản')}
                          className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500"
                        >
                          {copiedField === 'Số tài khoản' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Chủ tài khoản</span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{qrPaymentData.paymentInfo.accountName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Nội dung chuyển khoản</span>
                      <div className="flex items-center justify-between font-mono font-bold text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                        <span>{qrPaymentData.paymentInfo.transferContent}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(qrPaymentData.paymentInfo.transferContent, 'Nội dung chuyển khoản')}
                          className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-900 rounded text-amber-800"
                        >
                          {copiedField === 'Nội dung chuyển khoản' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Số tiền</span>
                      <p className="text-base font-black text-emerald-600">
                        {qrPaymentData.paymentInfo.amount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Mở ứng dụng ngân hàng hoặc MoMo quét mã QR trên để hoàn tất chuyển khoản tự động.</span>
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setQrPaymentData(null)}
                    className="w-1/3 h-11 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={isConfirmingPayment}
                    onClick={handleConfirmQRPayment}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isConfirmingPayment ? 'Đang đối soát giao dịch...' : 'Tôi đã chuyển khoản xong'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
