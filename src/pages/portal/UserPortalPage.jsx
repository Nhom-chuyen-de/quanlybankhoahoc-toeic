// src/pages/portal/UserPortalPage.jsx
// GIAO DIỆN TỐI ƯU TOÀN DIỆN & RESPONSIVE CHUẨN ĐA THIẾT BỊ (MOBILE - TABLET - DESKTOP)
// Chuẩn phong cách TOEIC Master - Hỗ trợ đầy đủ tất cả nghiệp vụ Giảng viên & Học viên

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen, Award, GraduationCap, Calendar, CheckSquare, Clock, FileText,
  Upload, Video, Headphones, Mic, Star, ShoppingCart, CreditCard, ChevronRight,
  ChevronDown, CheckCircle, XCircle, AlertCircle, Search, Filter, Download,
  MessageSquare, User, LogOut, Moon, Sun, ArrowRight, Play, Pause,
  Send, Layers, Eye, Edit3, Plus, Check, ExternalLink, Menu, X, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

// ==========================================
// DỮ LIỆU MOCK CHUẨN CƠ SỞ DỮ LIỆU TOEIC MASTER
// ==========================================

const MOCK_DATA = {
  teacher: {
    name: 'ThS. Nguyễn Minh Quân',
    title: 'Giảng viên Chuyên gia TOEIC 985/990',
    email: 'quan.nguyen@toeicmaster.vn',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    stats: {
      totalClasses: 4,
      totalStudents: 128,
      avgAttendance: 94.6,
      pendingGrading: 6,
    },
    upcomingClasses: [
      { id: 'c1', name: 'Lớp TOEIC Cấp Tốc 750+ (K28)', code: 'TOEIC-K28-T246', time: '18:00 - 20:00 Hôm nay', room: 'Phòng P.402 (Offline)', students: 32, type: 'offline' },
      { id: 'c2', name: 'Lớp Luyện Đề ETS 2024 (K15)', code: 'ETS-K15-T357', time: '20:15 - 22:15 Tối nay', link: 'https://meet.google.com/xyz-toeic', students: 35, type: 'online' },
      { id: 'c3', name: 'Lớp Chữa Đề Listening Part 3 & 4', code: 'LIS-PART-09', time: '18:00 - 20:00 Ngày mai', room: 'Phòng P.201 (Offline)', students: 28, type: 'offline' },
    ],
    pendingSubmissions: [
      { id: 'sub1', studentName: 'Trần Bảo Ngọc', studentCode: 'HV-9021', examTitle: 'Speaking Part 2 - Describe a Picture', classCode: 'TOEIC-K28-T246', type: 'audio', submittedAt: '10 phút trước', deadline: '23:59 Hôm nay' },
      { id: 'sub2', studentName: 'Lê Hoàng Long', studentCode: 'HV-8842', examTitle: 'Writing Part 2 - Respond to a Request', classCode: 'ETS-K15-T357', type: 'text', submittedAt: '45 phút trước', deadline: '23:59 Hôm nay' },
      { id: 'sub3', studentName: 'Vũ Minh Anh', studentCode: 'HV-7619', examTitle: 'Quiz Kiểm tra từ vựng Business Collocations', classCode: 'TOEIC-K28-T246', type: 'quiz', submittedAt: '2 giờ trước', deadline: 'Hôm qua' },
    ],
    courses: [
      {
        id: 'CRS-01',
        title: 'TOEIC Bứt Phá 750+ Toàn Diện 4 Kỹ Năng',
        level: '750+ Target',
        chaptersCount: 12,
        lessonsCount: 48,
        status: 'da duyet',
        statusText: 'Đã duyệt',
        studentsCount: 342,
        rating: 4.9,
        chapters: [
          { id: 'ch1', title: 'Chương 1: Chiến thuật xử lý bẫy Listening Part 1 & 2', duration: '4 bài • 120 phút' },
          { id: 'ch2', title: 'Chương 2: Phân tích biểu đồ và hội thoại 3 người Part 3', duration: '5 bài • 150 phút' },
          { id: 'ch3', title: 'Chương 3: Cấu trúc ngữ pháp trọng điểm Part 5 & 6', duration: '6 bài • 180 phút' },
          { id: 'ch4', title: 'Chương 4: Kỹ năng Skimming & Scanning bài đọc Part 7', duration: '7 bài • 210 phút' },
        ]
      },
      {
        id: 'CRS-02',
        title: 'Luyện Đề ETS 2024 & Giải Đề Thi Thật',
        level: 'Luyện Đề 600-800',
        chaptersCount: 10,
        lessonsCount: 30,
        status: 'cho duyet',
        statusText: 'Chờ duyệt',
        studentsCount: 0,
        rating: 0,
        chapters: [
          { id: 'ch21', title: 'Test 01: Full Actual Test ETS 2024 RC & LC', duration: '2 bài • 120 phút' },
          { id: 'ch22', title: 'Test 02: Phân tích chuyên sâu bẫy từ vựng đồng âm', duration: '3 bài • 90 phút' },
        ]
      },
      {
        id: 'CRS-03',
        title: 'Chinh Phục TOEIC Speaking & Writing Tự Tin',
        level: 'SW 300+',
        chaptersCount: 8,
        lessonsCount: 24,
        status: 'tu choi',
        statusText: 'Từ chối duyệt',
        rejectReason: 'Chất lượng video bài giảng số 3 bị rè âm thanh, vui lòng chuẩn hóa âm lượng theo tiêu chuẩn -14 LUFS.',
        studentsCount: 0,
        rating: 0,
        chapters: [
          { id: 'ch31', title: 'Chương 1: Phát âm và ngữ điệu câu hỏi đuôi', duration: '3 bài • 60 phút' },
        ]
      }
    ],
    classDetails: {
      id: 'TOEIC-K28-T246',
      name: 'Lớp TOEIC Cấp Tốc 750+ (K28)',
      schedule: 'Thứ 2 - 4 - 6 (18:00 - 20:00)',
      target: 'Mục tiêu 750+ điểm chuẩn ETS',
      students: [
        { id: 'st1', name: 'Trần Bảo Ngọc', code: 'HV-9021', target: 'TOEIC 800', attendance: 96, scoreAvg: 820, status: 'Đang học' },
        { id: 'st2', name: 'Phạm Đức Duy', code: 'HV-9022', target: 'TOEIC 750', attendance: 88, scoreAvg: 740, status: 'Đang học' },
        { id: 'st3', name: 'Nguyễn Thúy Hằng', code: 'HV-9023', target: 'TOEIC 750', attendance: 100, scoreAvg: 790, status: 'Đang học' },
        { id: 'st4', name: 'Hoàng Văn Nam', code: 'HV-9024', target: 'TOEIC 850', attendance: 92, scoreAvg: 860, status: 'Đang học' },
        { id: 'st5', name: 'Lê Minh Tuấn', code: 'HV-9025', target: 'TOEIC 700', attendance: 78, scoreAvg: 680, status: 'Cần kèm cặp' },
      ],
      lessons: [
        { session: 1, title: 'Buổi 1: Định hướng đề thi TOEIC mới & Chiến thuật Part 1', status: 'Đã hoàn thành', doc: 'Slide_Buoi_01.pdf' },
        { session: 2, title: 'Buổi 2: Xử lý câu hỏi phủ định, câu hỏi gắn thẻ Part 2', status: 'Đã hoàn thành', doc: 'Vocab_Part2.docx' },
        { session: 3, title: 'Buổi 3: Luyện tập hội thoại thương mại 3 người Part 3', status: 'Sắp tới', doc: 'Audio_Practice_03.mp3' },
        { session: 4, title: 'Buổi 4: Các thì hoàn thành & cấu trúc giả định Part 5', status: 'Chưa diễn ra', doc: 'Grammar_Drills_04.pdf' },
      ],
      assignments: [
        { id: 'a1', title: 'Bài tập về nhà: Nghe chép chính tả 10 audio Part 2', deadline: '23:59 - 18/11/2026', submitted: '29/32', status: 'Đang mở' },
        { id: 'a2', title: 'Mini-Test Ngữ Pháp Part 5 & 6 (30 câu trắc nghiệm)', deadline: '23:59 - 20/11/2026', submitted: '31/32', status: 'Đang mở' },
      ]
    }
  },

  student: {
    name: 'Hoàng Văn Nam',
    code: 'HV-9024',
    email: 'nam.hoang@student.toeicmaster.vn',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    target: 'TOEIC 850+',
    enrolledCourses: [
      {
        id: 'CRS-01',
        title: 'TOEIC Bứt Phá 750+ Toàn Diện 4 Kỹ Năng',
        teacher: 'ThS. Nguyễn Minh Quân',
        progress: 75,
        totalLessons: 48,
        completedLessons: 36,
        lastAccessed: 'Bài 36: Skimming kỹ năng đọc email Part 7',
        banner: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'CRS-04',
        title: 'Kho 1000 Từ Vựng TOEIC Cốt Lõi Đi Thi Hay Gặp',
        teacher: 'Cô Trần Mai Lan (990 TOEIC)',
        progress: 92,
        totalLessons: 20,
        completedLessons: 18,
        lastAccessed: 'Chương 9: Finance & Investment Terms',
        banner: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80'
      }
    ],
    enrolledClasses: [
      { id: 'cls1', name: 'Lớp TOEIC Cấp Tốc 750+ (K28)', teacher: 'ThS. Nguyễn Minh Quân', schedule: 'T2 - T4 - T6 (18:00 - 20:00)', room: 'P.402 (Offline)', attendanceRate: 92 },
    ],
    catalogCourses: [
      {
        id: 'CAT-01',
        title: 'Khóa TOEIC Nền Tảng Cho Người Mất Gốc (0 - 450+)',
        teacher: 'Thầy Lê Hoàng Nam',
        level: 'Cơ bản (0-450)',
        exam: 'TOEIC 2 Kỹ Năng',
        format: 'Video kèm Mentor',
        price: 1450000,
        originalPrice: 2200000,
        rating: 4.8,
        reviewsCount: 420,
        lessonsCount: 36,
        description: 'Lấy lại toàn bộ ngữ pháp căn bản, mẹo nghe phân biệt âm đuôi và 600 từ vựng cốt lõi thường xuất hiện trong đề thi TOEIC.',
        syllabus: ['Ngữ âm nền tảng IPA', '8 Chủ điểm ngữ pháp sống còn', 'Giải mã Part 1 & Part 2', 'Luyện kỹ thuật đọc lướt Part 5']
      },
      {
        id: 'CAT-02',
        title: 'TOEIC Chuyên Sâu Mục Tiêu 750+ / 850+ Điểm Cao',
        teacher: 'ThS. Nguyễn Minh Quân (985 TOEIC)',
        level: 'Nâng cao (650+)',
        exam: 'TOEIC 2 Kỹ Năng',
        format: 'Lớp Trực Tuyến Tương Tác',
        price: 2890000,
        originalPrice: 4200000,
        rating: 4.95,
        reviewsCount: 890,
        lessonsCount: 48,
        description: 'Tập trung bẻ bẫy hội thoại Part 3 & 4, tối ưu tốc độ đọc Part 7 kép/ba, nắm chắc 900+ từ vựng Business cao cấp.',
        syllabus: ['Bẻ khóa bẫy gián tiếp Part 2 & 3', 'Phân tích bảng biểu Part 3 & 4', 'Tốc độ đọc Scanning 60s/đoạn Part 7', 'Thực chiến 10 đề ETS mới nhất']
      },
      {
        id: 'CAT-03',
        title: 'Chiến Binh TOEIC Speaking & Writing 300+ / 400',
        teacher: 'Cô Emma Vũ (IELTS 8.5 / TOEIC 990)',
        level: 'Mọi trình độ',
        exam: 'TOEIC 4 Kỹ Năng',
        format: 'Lớp Chấm Bài 1-1',
        price: 3200000,
        originalPrice: 4500000,
        rating: 4.9,
        reviewsCount: 310,
        lessonsCount: 30,
        description: 'Rèn luyện ngữ điệu chuẩn tự nhiên, cấu trúc trả lời 3 bước cho Part 1 - Part 5 Speaking và mẫu viết Email thương mại Part 2 Writing.',
        syllabus: ['Phát âm nhấn trọng âm và ngữ điệu', 'Mô tả hình ảnh chuẩn bố cục', 'Trả lời phỏng vấn & đề xuất giải pháp', 'Viết luận thể hiện quan điểm Part 3']
      }
    ],
    certificates: [
      {
        id: 'CERT-2026-9024',
        courseName: 'Khóa TOEIC Nền Tảng Cho Người Mất Gốc (0 - 450+)',
        code: 'TM-CERT-88921-VN',
        issueDate: '15/10/2026',
        score: '585/990 TOEIC Mock Test',
        status: 'hoan thanh',
      }
    ],
    transactions: [
      { id: 'INV-2026-0089', date: '01/11/2026', course: 'TOEIC Bứt Phá 750+ Toàn Diện', amount: 2890000, method: 'VNPAY QR', status: 'Thành công', canRefund: true },
      { id: 'INV-2026-0012', date: '10/09/2026', course: 'Kho 1000 Từ Vựng TOEIC Cốt Lõi', amount: 690000, method: 'Ví MoMo', status: 'Thành công', canRefund: false },
    ]
  }
};

// ==========================================
// CẤU HÌNH MENU PHÂN HỆ
// ==========================================

const TEACHER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Tổng quan', shortLabel: 'Tổng quan', icon: Layers },
  { id: 'courses', label: 'Khóa học & Biên soạn', shortLabel: 'Khóa học', icon: BookOpen },
  { id: 'classes', label: 'Quản lý Lớp học', shortLabel: 'Lớp học', icon: GraduationCap },
  { id: 'grading', label: 'Đề thi & Chấm bài', shortLabel: 'Chấm bài', icon: CheckSquare },
  { id: 'schedule', label: 'Lịch dạy & Điểm danh', shortLabel: 'Lịch dạy', icon: Calendar },
  { id: 'reports', label: 'Báo cáo & Thống kê', shortLabel: 'Báo cáo', icon: FileText },
  { id: 'profile', label: 'Hồ sơ & Hỗ trợ Admin', shortLabel: 'Cá nhân', icon: User },
];

const STUDENT_NAV_ITEMS = [
  { id: 'mylearning', label: 'Góc học tập của tôi', shortLabel: 'Học tập', icon: BookOpen },
  { id: 'catalog', label: 'Khám phá Khóa học', shortLabel: 'Khám phá', icon: Search },
  { id: 'checkout', label: 'Giỏ hàng & Thanh toán', shortLabel: 'Thanh toán', icon: ShoppingCart },
  { id: 'player', label: 'Trình phát Bài học', shortLabel: 'Bài học', icon: Video },
  { id: 'exam', label: 'Phòng thi & Làm bài (ETS)', shortLabel: 'Phòng thi', icon: Clock },
  { id: 'schedule', label: 'Lịch học & Điểm danh', shortLabel: 'Thời khóa biểu', icon: Calendar },
  { id: 'certificates', label: 'Chứng chỉ & Đánh giá', shortLabel: 'Chứng chỉ', icon: Award },
  { id: 'history', label: 'Lịch sử & Hỗ trợ', shortLabel: 'Lịch sử', icon: CreditCard },
];

// ==========================================
// COMPONENT CHÍNH TOÀN DIỆN & RESPONSIVE
// ==========================================

export default function UserPortalPage({ defaultRole = 'teacher' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Xác định vai trò nghiêm ngặt theo tài khoản đã đăng nhập
  const role = user?.vaiTro === ROLES.TEACHER
    ? 'teacher'
    : (user?.vaiTro === ROLES.STUDENT
      ? 'student'
      : (location.pathname.includes('giang-vien') ? 'teacher' : (location.pathname.includes('hoc-vien') ? 'student' : defaultRole)));

  const [teacherTab, setTeacherTab] = useState('dashboard');
  const [studentTab, setStudentTab] = useState('mylearning');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('adminDarkMode') === 'true';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('adminDarkMode', String(darkMode));
  }, [darkMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = role === 'teacher' ? TEACHER_NAV_ITEMS : STUDENT_NAV_ITEMS;
  const currentTab = role === 'teacher' ? teacherTab : studentTab;
  const setCurrentTab = role === 'teacher' ? setTeacherTab : setStudentTab;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 overflow-x-hidden pb-20 md:pb-6">
      
      {/* ======================================================== */}
      {/* 1. HEADER CHÍNH RESPONSIVE                                */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Tên nền tảng */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Mở menu điều hướng"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all shrink-0 ${
              role === 'teacher' ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : 'bg-gradient-to-br from-indigo-600 to-blue-700'
            }`}>
              {role === 'teacher' ? <Award className="w-4 h-4 sm:w-5 sm:h-5" /> : <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">TOEIC Master</span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                  Chuẩn ETS
                </span>
              </div>
              <p className="hidden xs:block text-[10px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5">
                {role === 'teacher' ? 'Cổng Nghiệp Vụ Giảng Viên' : 'Không Gian Học Tập Học Viên'}
              </p>
            </div>
          </div>

          {/* Huy hiệu vai trò cố định của tài khoản đăng nhập (Không thể tự chuyển đổi qua lại) */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            {role === 'teacher' ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Award className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Tài Khoản Giảng Viên</span>
                <span className="sm:hidden">Giảng Viên</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline">Tài Khoản Học Viên</span>
                <span className="sm:hidden">Học Viên</span>
              </div>
            )}
          </div>

          {/* User Profile & Công cụ phải */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => navigate('/store')}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-500/20 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              title="Đến Cửa Hàng Bán Khóa Học"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cửa Hàng Khóa Học</span>
              <span className="sm:hidden">Store</span>
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Chuyển chế độ sáng/tối"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <img
                src={role === 'teacher' ? MOCK_DATA.teacher.avatar : MOCK_DATA.student.avatar}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
              <div className="hidden lg:block text-left text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200 max-w-[130px] truncate">
                  {user?.hoTen || (role === 'teacher' ? MOCK_DATA.teacher.name : MOCK_DATA.student.name)}
                </p>
                <p className="text-[10px] text-slate-400">
                  {role === 'teacher' ? 'Giảng viên chính thức' : (user?.email || MOCK_DATA.student.target)}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SUB-NAVIGATOR THANH CUỘN NGANG TRÊN DESKTOP/TABLET   */}
        {/* ======================================================== */}
        <div className="border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              const activeClass = role === 'teacher' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-indigo-600 text-white shadow-xs';
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? activeClass
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{idx + 1}. {item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MENU DRAWER TRÊN MOBILE KHI NHẤP ICON HAMBURGER */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1 shadow-xl animate-in slide-in-from-top-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Danh mục trang:</p>
            {navItems.map((item, idx) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? role === 'teacher' ? 'bg-emerald-600 text-white font-bold' : 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{idx + 1}. {item.label}</span>
                  </div>
                  {active && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ======================================================== */}
      {/* 3. NỘI DUNG CHÍNH (TỐI ƯU CONTAINER & VIEW CHUẨN)         */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 sm:p-6 lg:p-8">
        {role === 'teacher' ? (
          <TeacherViews currentTab={teacherTab} setTab={setTeacherTab} />
        ) : (
          <StudentViews currentTab={studentTab} setTab={setStudentTab} />
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY CHO THIẾT BỊ DI ĐỘNG (MOBILE)*/}
      {/* ======================================================== */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden flex items-center justify-around py-1.5 px-2 shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = currentTab === item.id;
          const activeText = role === 'teacher' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-indigo-600 dark:text-indigo-400 font-bold';
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] transition-colors ${
                active ? activeText : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate max-w-[58px]">{item.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-4 bg-white dark:bg-slate-900 text-center text-[11px] sm:text-xs text-slate-400 px-4">
        © 2026 TOEIC Master System • Giao diện chuẩn đa thiết bị (Desktop / Tablet / Mobile).
      </footer>
    </div>
  );
}

// ====================================================================
// ==================== CÁC VIEW CỦA GIẢNG VIÊN =======================
// ====================================================================

function TeacherViews({ currentTab, setTab }) {
  switch (currentTab) {
    case 'dashboard':
      return <TeacherDashboardView setTab={setTab} />;
    case 'courses':
      return <TeacherCoursesView />;
    case 'classes':
      return <TeacherClassDetailView />;
    case 'grading':
      return <TeacherGradingView />;
    case 'schedule':
      return <TeacherScheduleView />;
    case 'reports':
      return <TeacherReportsView />;
    case 'profile':
      return <TeacherProfileSupportView />;
    default:
      return <TeacherDashboardView setTab={setTab} />;
  }
}

// --- 1. Teacher Dashboard View ---
function TeacherDashboardView({ setTab }) {
  const teacher = MOCK_DATA.teacher;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero chào mừng */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-2xl p-4 sm:p-6 lg:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wider">
            Bảng Điều Khiển Giảng Viên
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 tracking-tight">
            Xin chào, {teacher.name}!
          </h2>
          <p className="text-emerald-50 text-xs sm:text-sm mt-1 leading-relaxed">
            Hôm nay bạn có 2 buổi dạy và 6 bài thi kỹ năng Speaking/Writing chờ chấm điểm.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-4">
            <button
              onClick={() => setTab('grading')}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Chấm ngay 6 bài chờ</span>
            </button>
            <button
              onClick={() => setTab('schedule')}
              className="px-4 py-2.5 rounded-xl bg-emerald-700/60 border border-white/20 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Xem lịch dạy hôm nay</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Thẻ thống kê vw_lop_hoc_tong_quan responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {[
          { label: 'Lớp phụ trách', val: teacher.stats.totalClasses, unit: 'lớp', icon: GraduationCap, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50' },
          { label: 'Tổng số học viên', val: teacher.stats.totalStudents, unit: 'học viên', icon: User, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/50' },
          { label: 'Tỉ lệ chuyên cần', val: `${teacher.stats.avgAttendance}%`, unit: 'tháng này', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' },
          { label: 'Bài thi chờ chấm', val: teacher.stats.pendingGrading, unit: 'bài nộp', icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-900 p-3.5 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{stat.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-black mt-2 text-slate-900 dark:text-white">
                {stat.val} <span className="text-[11px] font-normal text-slate-400">{stat.unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lịch dạy sắp tới */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Lịch dạy sắp tới (Trong ngày / Tuần)</h3>
              <p className="text-[11px] text-slate-400">Các ca học cần có mặt hoặc chuẩn bị link lớp</p>
            </div>
            <button onClick={() => setTab('schedule')} className="text-xs font-semibold text-emerald-600 hover:underline shrink-0">
              Toàn bộ lịch →
            </button>
          </div>

          <div className="space-y-2.5">
            {teacher.upcomingClasses.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 ${
                    item.type === 'online' ? 'bg-blue-600' : 'bg-emerald-600'
                  }`}>
                    {item.type === 'online' ? <Video className="w-4 h-4 sm:w-5 sm:h-5" /> : <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{item.name}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="font-semibold text-emerald-600">{item.code}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                      <span>•</span>
                      <span>{item.students} HV</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center w-full sm:w-auto justify-end">
                  {item.type === 'online' ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-none text-center px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Vào Meet</span>
                    </a>
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                      {item.room}
                    </span>
                  )}
                  <button
                    onClick={() => setTab('schedule')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Điểm danh
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách bài tập chờ chấm */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">Bài chờ chấm điểm</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold">
              6 bài
            </span>
          </div>

          <div className="space-y-2.5">
            {teacher.pendingSubmissions.map((sub) => (
              <div key={sub.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{sub.examTitle}</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      HV: <span className="font-medium text-slate-700 dark:text-slate-300">{sub.studentName}</span> ({sub.studentCode})
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    sub.type === 'audio' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {sub.type === 'audio' ? 'Speaking' : 'Writing'}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px]">
                  <span className="text-slate-400">{sub.submittedAt}</span>
                  <button
                    onClick={() => setTab('grading')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Chấm ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 2. Quản lý Khóa học & Biên soạn Nội dung ---
function TeacherCoursesView() {
  const [courses, setCourses] = useState(MOCK_DATA.teacher.courses);
  const [selectedCourse, setSelectedCourse] = useState(courses[0]);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [uploadProgress, setUploadProgress] = useState(null);

  const handleAddChapter = (e) => {
    e.preventDefault();
    if (!newChapterTitle.trim()) return;
    const newChap = {
      id: 'ch_' + Date.now(),
      title: `Chương ${selectedCourse.chapters.length + 1}: ${newChapterTitle}`,
      duration: '0 bài • 0 phút'
    };
    const updated = { ...selectedCourse, chapters: [...selectedCourse.chapters, newChap] };
    setSelectedCourse(updated);
    setCourses(courses.map(c => c.id === updated.id ? updated : c));
    setNewChapterTitle('');
    setIsAddingChapter(false);
  };

  const handleSimulateUpload = () => {
    setUploadProgress(10);
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => setUploadProgress(null), 1200);
          return 100;
        }
        return prev + 30;
      });
    }, 250);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Quản lý Khóa học & Biên soạn Nội dung</h2>
          <p className="text-xs text-slate-400 mt-0.5">Soạn thảo đề cương, tải video/tài liệu và theo dõi trạng thái duyệt</p>
        </div>
        <button
          onClick={() => alert('Mở form tạo khóa học mới')}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Khóa Học Mới</span>
        </button>
      </div>

      {/* Danh sách khóa học */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {courses.map((course) => {
          const isSelected = selectedCourse.id === course.id;
          return (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={`p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {course.level}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  course.status === 'da duyet' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                  course.status === 'cho duyet' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                  'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                }`}>
                  {course.status === 'da duyet' && <CheckCircle className="w-3 h-3" />}
                  {course.status === 'cho duyet' && <Clock className="w-3 h-3" />}
                  {course.status === 'tu choi' && <AlertCircle className="w-3 h-3" />}
                  <span>{course.statusText}</span>
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-2.5 line-clamp-1">{course.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{course.chapters.length} chương • {course.lessonsCount} bài học</p>

              {course.status === 'tu choi' && (
                <div className="mt-2.5 p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-[11px] text-red-700 dark:text-red-300">
                  <span className="font-bold">Lý do từ chối: </span>
                  <span>{course.rejectReason}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Khu vực biên soạn chương & tải tài liệu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
          <div>
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Đang biên soạn đề cương</span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedCourse.title}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSimulateUpload}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải Video / Slide</span>
            </button>
            <button
              onClick={() => setIsAddingChapter(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm chương</span>
            </button>
          </div>
        </div>

        {uploadProgress !== null && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span>Đang tải lên bài giảng: Lesson_Part7_Master.mp4</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}

        {isAddingChapter && (
          <form onSubmit={handleAddChapter} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-emerald-500/40 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Tên chương học mới</h4>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="VD: Chương 5: Xử lý đoạn hội thoại 3 người..."
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-emerald-500"
              />
              <div className="flex gap-2">
                <button type="submit" className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700">
                  Lưu
                </button>
                <button type="button" onClick={() => setIsAddingChapter(false)} className="flex-1 sm:flex-none px-3 py-2 text-slate-500 text-xs hover:bg-slate-200 rounded-xl">
                  Hủy
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          <p className="text-xs font-medium text-slate-400">Danh sách chương học ({selectedCourse.chapters.length}):</p>
          {selectedCourse.chapters.map((chap, idx) => (
            <div
              key={chap.id}
              className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{chap.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{chap.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100" title="Sửa">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200">
                  + Bài
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 3. Quản lý Lớp học chi tiết (Responsive bảng sang card trên mobile) ---
function TeacherClassDetailView() {
  const cls = MOCK_DATA.teacher.classDetails;
  const [subTab, setSubTab] = useState('students');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner lớp */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {cls.id}
            </span>
            <span className="text-xs text-slate-400">• {cls.schedule}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-1">{cls.name}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{cls.target}</p>
        </div>

        {/* Tab chuyển đổi */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto scrollbar-none w-full sm:w-auto">
          {[
            { id: 'students', label: 'Học viên', count: cls.students.length },
            { id: 'lessons', label: 'Bài giảng & Lộ trình', count: cls.lessons.length },
            { id: 'assignments', label: 'Bài tập & Quiz', count: cls.assignments.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                subTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: Học viên ghi danh (Card trên Mobile, Table trên Tablet/Desktop) */}
      {subTab === 'students' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Danh sách học viên ghi danh ({cls.students.length})</h4>
            <button className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1">
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel</span>
            </button>
          </div>

          {/* Dạng Cards trên Mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
            {cls.students.map((st) => (
              <div key={st.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{st.name}</h5>
                    <span className="text-[10px] text-slate-400">{st.code}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    st.status === 'Đang học' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {st.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400">Target: <strong className="text-indigo-600">{st.target}</strong></span>
                  <span className="text-slate-400">Mock Test: <strong>{st.scoreAvg} pts</strong></span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 font-medium">Chuyên cần: {st.attendance}%</span>
                  <button className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-semibold">
                    Xem hồ sơ
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Dạng Table trên Tablet & Desktop */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã HV & Họ Tên</th>
                  <th className="py-3 px-4">Mục tiêu đầu ra</th>
                  <th className="py-3 px-4">Chuyên cần (%)</th>
                  <th className="py-3 px-4">Điểm TB Mock Test</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cls.students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      <div>{st.name}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{st.code}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">{st.target}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{st.attendance}%</span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${st.attendance >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${st.attendance}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-slate-800 dark:text-slate-200">{st.scoreAvg} pts</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        st.status === 'Đang học' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {st.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[11px] font-semibold">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Lộ trình & Tài liệu */}
      {subTab === 'lessons' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Lộ trình 24 buổi học</h4>
            <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm buổi</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cls.lessons.map((les) => (
              <div key={les.session} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600">Buổi #{les.session}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">{les.status}</span>
                </div>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1">{les.title}</h5>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate">File: <strong className="text-slate-700 dark:text-slate-300">{les.doc}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bài tập & Quiz */}
      {subTab === 'assignments' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Bài tập & Quiz</h4>
            <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Giao bài mới</span>
            </button>
          </div>
          <div className="space-y-2.5">
            {cls.assignments.map((asg) => (
              <div key={asg.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{asg.title}</h5>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>Hạn: <strong className="text-amber-600">{asg.deadline}</strong></span>
                    <span>•</span>
                    <span>Đã nộp: <strong className="text-emerald-600">{asg.submitted}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100">
                    Xem bài
                  </button>
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700">
                    Chấm bài
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. Ngân hàng Đề thi & Chấm điểm 4 Kỹ Năng ---
function TeacherGradingView() {
  const [selectedSub, setSelectedSub] = useState(MOCK_DATA.teacher.pendingSubmissions[0]);
  const [gradeScore, setGradeScore] = useState('85');
  const [feedback, setFeedback] = useState('Phát âm tốt, ngữ điệu tự nhiên. Chú ý nhấn trọng âm các từ 3 âm tiết.');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveGrade = (e) => {
    e.preventDefault();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Ngân hàng Đề thi & Chấm điểm 4 Kỹ Năng</h2>
          <p className="text-xs text-slate-400 mt-0.5">Tạo đề thi mới và chấm bài nộp trực tiếp của học viên</p>
        </div>
        <button
          onClick={() => alert('Mở modal tạo đề thi 4 kỹ năng (Hỗ trợ upload file audio mp3)')}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đề Thi Mới</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Danh sách bài nộp */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-xs space-y-2.5">
          <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">Danh sách bài nộp ({MOCK_DATA.teacher.pendingSubmissions.length})</h4>
          <div className="space-y-2">
            {MOCK_DATA.teacher.pendingSubmissions.map((sub) => {
              const isSelected = selectedSub.id === sub.id;
              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600">
                      {sub.classCode}
                    </span>
                    <span className="text-amber-600 font-bold">Chưa chấm</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-white mt-1.5">{sub.studentName}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{sub.examTitle}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Khung chấm điểm chi tiết */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
            <div>
              <span className="text-xs font-bold text-emerald-600">{selectedSub.classCode}</span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">
                Chấm bài: {selectedSub.examTitle}
              </h3>
              <p className="text-xs text-slate-400">Học viên: <strong className="text-slate-700 dark:text-slate-300">{selectedSub.studentName}</strong> ({selectedSub.studentCode})</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-bold self-start sm:self-auto">
              Speaking
            </span>
          </div>

          {/* Audio Player giả lập */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-purple-600 shrink-0" />
              <span>Ghi âm câu trả lời của học viên:</span>
            </h5>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition-colors shrink-0 shadow-xs"
              >
                {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>{isPlayingAudio ? '00:18' : '00:00'}</span>
                  <span>01:15</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className={`bg-emerald-500 h-1.5 rounded-full ${isPlayingAudio ? 'w-1/4 animate-pulse' : 'w-0'}`} />
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 italic">
              "In this picture, I can see a woman standing in front of a supermarket shelf. She is holding a basket..."
            </div>
          </div>

          {/* Form chấm điểm */}
          <form onSubmit={handleSaveGrade} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Điểm số (Thang 100):
              </label>
              <input
                type="number"
                value={gradeScore}
                onChange={(e) => setGradeScore(e.target.value)}
                className="w-32 px-3 py-1.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-emerald-600 focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lời nhận xét & Góp ý:
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-emerald-500 leading-relaxed"
              />
            </div>

            {showSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Đã lưu điểm và gửi nhận xét thành công!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận & Lưu điểm</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- 5. Lịch giảng dạy & Điểm danh ---
function TeacherScheduleView() {
  const [selectedDay, setSelectedDay] = useState('Thứ 4');
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceList, setAttendanceList] = useState([
    { id: 1, name: 'Trần Bảo Ngọc', code: 'HV-9021', status: 'present' },
    { id: 2, name: 'Phạm Đức Duy', code: 'HV-9022', status: 'present' },
    { id: 3, name: 'Nguyễn Thúy Hằng', code: 'HV-9023', status: 'late' },
    { id: 4, name: 'Hoàng Văn Nam', code: 'HV-9024', status: 'present' },
    { id: 5, name: 'Lê Minh Tuấn', code: 'HV-9025', status: 'absent' },
  ]);

  const updateAttendance = (id, newStatus) => {
    setAttendanceList(attendanceList.map(item => item.id === id ? { ...item, status: newStatus } : item));
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Lịch Giảng Dạy & Điểm Danh Nhanh</h2>
          <p className="text-xs text-slate-400 mt-0.5">Theo dõi lịch biểu dạng tuần và điểm danh học viên</p>
        </div>
        <button
          onClick={() => setIsAttendanceModalOpen(true)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Điểm danh buổi hôm nay</span>
        </button>
      </div>

      {/* Lịch tuần buttons */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
        {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map((day) => {
          const isSelected = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`p-2 sm:p-2.5 rounded-xl border text-center transition-all ${
                isSelected
                  ? 'border-emerald-600 bg-emerald-600 text-white font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="text-xs">{day}</div>
              <div className="text-[10px] mt-0.5 opacity-80">2 ca</div>
            </button>
          );
        })}
      </div>

      {/* Danh sách ca học */}
      <div className="space-y-3">
        {MOCK_DATA.teacher.upcomingClasses.map((item) => (
          <div key={item.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-600">{item.code}</span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white mt-0.5">{item.name}</h4>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                  <span>{item.time}</span>
                  <span>•</span>
                  <span>{item.room || 'Meet trực tuyến'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              {item.type === 'online' ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Vào Meet</span>
                </a>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold">
                  {item.room}
                </span>
              )}
              <button
                onClick={() => setIsAttendanceModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Điểm danh
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal điểm danh */}
      {isAttendanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Điểm danh nhanh buổi học</h3>
                <p className="text-[11px] text-slate-400">Lớp: TOEIC-K28-T246 • Buổi 3</p>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {attendanceList.map((st) => (
                <div key={st.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{st.name}</h5>
                    <span className="text-[10px] text-slate-400">{st.code}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {[
                      { key: 'present', label: 'Có mặt', color: 'bg-emerald-600 text-white' },
                      { key: 'late', label: 'Trễ', color: 'bg-amber-500 text-white' },
                      { key: 'absent', label: 'Vắng', color: 'bg-red-500 text-white' },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => updateAttendance(st.id, opt.key)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          st.status === opt.key ? opt.color : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsAttendanceModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  alert('Đã lưu dữ liệu chuyên cần vào hệ thống!');
                  setIsAttendanceModalOpen(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Lưu điểm danh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 6. Báo cáo & Thống kê ---
function TeacherReportsView() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Báo Cáo & Thống Kê Giảng Dạy</h2>
          <p className="text-xs text-slate-400 mt-0.5">Trích xuất tình hình chuyên cần và kết quả học tập</p>
        </div>
        <button
          onClick={() => alert('Đang xuất báo cáo dạng file Excel (.xlsx)...')}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Xuất Báo Cáo</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Tỉ lệ chuyên cần</h4>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">94.6%</p>
          <p className="text-[11px] text-slate-400">95% học viên đi học đầy đủ ít nhất 20/24 buổi.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Điểm Mock Test trung bình</h4>
          <p className="text-2xl sm:text-3xl font-black text-indigo-600">785 / 990</p>
          <p className="text-[11px] text-slate-400">88% học viên đạt hoặc vượt mục tiêu cam kết.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Đánh giá hài lòng</h4>
          <p className="text-2xl sm:text-3xl font-black text-amber-500">4.92 / 5.0 ★</p>
          <p className="text-[11px] text-slate-400">Dựa trên 112 phản hồi từ học viên.</p>
        </div>
      </div>
    </div>
  );
}

// --- 7. Hồ sơ cá nhân & Hỗ trợ Admin ---
function TeacherProfileSupportView() {
  const teacher = MOCK_DATA.teacher;
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketContent, setTicketContent] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  const handleSendTicket = (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketContent) return;
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setTicketSubject('');
      setTicketContent('');
    }, 2500);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Hồ Sơ & Trung Tâm Hỗ Trợ Giảng Viên</h2>
        <p className="text-xs text-slate-400 mt-0.5">Cập nhật thông tin giảng viên và gửi ticket hỗ trợ tới Admin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800">
            Thông tin tài khoản
          </h3>
          <div className="flex items-center gap-3">
            <img src={teacher.avatar} alt="Avatar" className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0" />
            <div className="min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">{teacher.name}</h4>
              <p className="text-[11px] text-slate-500">{teacher.title}</p>
              <p className="text-[11px] text-emerald-600 font-mono mt-0.5 truncate">{teacher.email}</p>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-300">Đổi mật khẩu</h4>
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <input
              type="password"
              placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <button className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors">
              Cập nhật mật khẩu
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-3.5">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Gửi Ticket Hỗ Trợ Tới Admin</span>
          </h3>

          <form onSubmit={handleSendTicket} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Loại yêu cầu:</label>
              <select className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
                <option>Hỗ trợ phòng học & thiết bị</option>
                <option>Duyệt nội dung khóa học</option>
                <option>Tính thù lao giảng dạy</option>
                <option>Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Tiêu đề:</label>
              <input
                type="text"
                placeholder="VD: Nâng cấp mic phòng P.402..."
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung chi tiết:</label>
              <textarea
                rows={3}
                placeholder="Mô tả cụ thể sự cố hoặc đề xuất..."
                value={ticketContent}
                onChange={(e) => setTicketContent(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-emerald-500"
              />
            </div>

            {ticketSent && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
                Ticket của bạn đã gửi thành công tới Admin!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi Ticket</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// ==================== CÁC VIEW CỦA HỌC VIÊN =========================
// ====================================================================

function StudentViews({ currentTab, setTab }) {
  switch (currentTab) {
    case 'mylearning':
      return <StudentMyLearningView setTab={setTab} />;
    case 'catalog':
      return <StudentCourseCatalogView setTab={setTab} />;
    case 'checkout':
      return <StudentCheckoutView setTab={setTab} />;
    case 'player':
      return <StudentCoursePlayerView />;
    case 'exam':
      return <StudentExamQuizView />;
    case 'schedule':
      return <StudentScheduleView />;
    case 'certificates':
      return <StudentCertificatesView />;
    case 'history':
      return <StudentHistorySupportView />;
    default:
      return <StudentMyLearningView setTab={setTab} />;
  }
}

// --- 1. Góc học tập của tôi ---
function StudentMyLearningView({ setTab }) {
  const student = MOCK_DATA.student;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Banner chào mừng */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-700 rounded-2xl p-4 sm:p-6 lg:p-7 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wider">
            Không Gian Học Tập Cá Nhân
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mt-2 tracking-tight">
            Chào mừng trở lại, {student.name}!
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1 leading-relaxed">
            Mục tiêu: <strong>{student.target}</strong>. Bạn đã hoàn thành 75% lộ trình khóa học chính.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-4">
            <button
              onClick={() => setTab('player')}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-indigo-700" />
              <span>Tiếp tục học bài gần nhất</span>
            </button>
            <button
              onClick={() => setTab('exam')}
              className="px-4 py-2.5 rounded-xl bg-indigo-700/60 border border-white/20 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-4 h-4" />
              <span>Làm bài thi thử ETS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Khóa học đã đăng ký */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Khóa học đã đăng ký ({student.enrolledCourses.length})</h3>
          <button onClick={() => setTab('catalog')} className="text-xs font-semibold text-indigo-600 hover:underline">
            Xem thêm →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {student.enrolledCourses.map((crs) => (
            <div key={crs.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500 transition-all flex flex-col justify-between">
              <div>
                <div className="h-32 sm:h-36 relative overflow-hidden">
                  <img src={crs.banner} alt="Course" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white bg-indigo-600/90 backdrop-blur-xs px-2 py-0.5 rounded-lg">
                    {crs.teacher}
                  </span>
                </div>

                <div className="p-4 sm:p-5 space-y-3">
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1">{crs.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">Đang học: {crs.lastAccessed}</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-500">Tiến độ:</span>
                      <span className="text-indigo-600">{crs.progress}% ({crs.completedLessons}/{crs.totalLessons} bài)</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${crs.progress}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <button
                  onClick={() => setTab('player')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Vào học ngay</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lớp học trực tiếp */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-2.5">Lớp học trực tiếp đang tham gia</h3>
        {student.enrolledClasses.map((cls) => (
          <div key={cls.id} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{cls.name}</h5>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-400">
                <span>GV: <strong className="text-slate-700 dark:text-slate-300">{cls.teacher}</strong></span>
                <span>•</span>
                <span>{cls.schedule}</span>
                <span>•</span>
                <span>{cls.room}</span>
              </div>
            </div>
            <button
              onClick={() => setTab('schedule')}
              className="self-start sm:self-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Xem thời khóa biểu
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 2. Khám phá Khóa học ---
function StudentCourseCatalogView({ setTab }) {
  const [selectedCourse, setSelectedCourse] = useState(MOCK_DATA.student.catalogCourses[1]);
  const [filterLevel, setFilterLevel] = useState('ALL');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Khám Phá Khóa Học TOEIC & IELTS</h2>
        <p className="text-xs text-slate-400 mt-0.5">Tìm kiếm lộ trình bứt phá điểm số phù hợp với bạn</p>
      </div>

      {/* Bộ lọc */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 items-center">
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Lọc:</span>
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold"
        >
          <option value="ALL">Mọi trình độ (0 - 990)</option>
          <option value="BASIC">Mất gốc (0 - 450+)</option>
          <option value="ADVANCED">Nâng cao (650 - 850+)</option>
        </select>
        <select className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold">
          <option>Kỳ thi: TOEIC 2 Kỹ Năng</option>
          <option>Kỳ thi: TOEIC 4 Kỹ Năng</option>
          <option>Kỳ thi: IELTS Học Thuật</option>
        </select>
      </div>

      {/* Grid danh sách & chi tiết */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="space-y-3">
          {MOCK_DATA.student.catalogCourses.map((crs) => {
            const isSelected = selectedCourse.id === crs.id;
            return (
              <div
                key={crs.id}
                onClick={() => setSelectedCourse(crs)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-600">{crs.level}</span>
                  <span className="text-amber-500 font-bold">★ {crs.rating}</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-1.5">{crs.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{crs.teacher}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-black text-sm text-indigo-600">{crs.price.toLocaleString('vi-VN')} đ</span>
                  <span className="text-[10px] text-slate-400 line-through">{crs.originalPrice.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{selectedCourse.exam}</span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">{selectedCourse.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Giảng viên: <strong className="text-slate-700 dark:text-slate-300">{selectedCourse.teacher}</strong></p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xl sm:text-2xl font-black text-indigo-600">{selectedCourse.price.toLocaleString('vi-VN')} đ</p>
              <p className="text-xs text-slate-400 line-through">{selectedCourse.originalPrice.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {selectedCourse.description}
          </p>

          <div className="space-y-2.5">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Đề cương chi tiết:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {selectedCourse.syllabus.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-400">
              ✓ Cam kết hỗ trợ 1-1 cùng giảng viên
            </div>
            <button
              onClick={() => setTab('checkout')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Đăng Ký / Mua Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 3. Giỏ hàng & Thanh toán ---
function StudentCheckoutView({ setTab }) {
  const [couponCode, setCouponCode] = useState('TOEICMASTER2026');
  const [discountAmount, setDiscountAmount] = useState(300000);
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [isSuccess, setIsSuccess] = useState(false);

  const originalTotal = 2890000;
  const finalTotal = originalTotal - discountAmount;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Giỏ Hàng & Thanh Toán</h2>
        <p className="text-xs text-slate-400 mt-0.5">Xác nhận thông tin đơn hàng và chọn cổng thanh toán an toàn</p>
      </div>

      {isSuccess ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-500/40 p-6 sm:p-8 text-center space-y-3.5 shadow-xl">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Thanh Toán Thành Công!</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hóa đơn <strong>#INV-2026-9921</strong> đã được gửi tới email của bạn. Khóa học đã được kích hoạt.
          </p>
          <button
            onClick={() => {
              setIsSuccess(false);
              setTab('player');
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
          >
            Vào học bài ngay →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-2 space-y-3 sm:space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Khóa học đăng ký</h4>
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">TOEIC Chuyên Sâu Mục Tiêu 750+ / 850+</h5>
                  <p className="text-[11px] text-slate-400">GV: ThS. Nguyễn Minh Quân</p>
                </div>
                <span className="font-bold text-xs sm:text-sm text-indigo-600 shrink-0">{originalTotal.toLocaleString('vi-VN')} đ</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold uppercase"
                />
                <button
                  onClick={() => alert('Đã áp dụng mã giảm giá 300.000đ!')}
                  className="px-3.5 py-1.5 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-2.5">
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Cổng thanh toán</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'vnpay', name: 'VNPAY QR' },
                  { id: 'momo', name: 'Ví MoMo' },
                  { id: 'bank', name: 'Ngân Hàng' },
                ].map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setPaymentMethod(item.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-center transition-all ${
                      paymentMethod === item.id
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="text-xs text-slate-900 dark:text-white">{item.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3 h-fit">
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Tóm tắt</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Gốc:</span>
                <span>{originalTotal.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Giảm giá:</span>
                <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                <span>Tổng:</span>
                <span className="text-indigo-600 text-base">{finalTotal.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>

            <button
              onClick={() => setIsSuccess(true)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Thanh Toán Ngay</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 4. Trình phát Bài học (Player Video & Playlist) ---
function StudentCoursePlayerView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLesson, setCurrentLesson] = useState('Bài 36: Kỹ năng Skimming & Scanning bài đọc email Part 7');

  const chapters = [
    {
      id: 'c1',
      title: 'Chương 1: Chiến thuật Listening Part 1 & 2',
      lessons: [
        { id: 'l1', title: 'Bài 1: Phân biệt âm đuôi và từ đồng âm hay bẫy', completed: true, duration: '24:10' },
        { id: 'l2', title: 'Bài 2: Chiến lược loại trừ câu hỏi Yes/No', completed: true, duration: '18:45' },
      ]
    },
    {
      id: 'c2',
      title: 'Chương 2: Đột phá Reading Part 7',
      lessons: [
        { id: 'l36', title: 'Bài 36: Kỹ năng Skimming & Scanning bài đọc email Part 7', completed: false, duration: '32:00' },
        { id: 'l37', title: 'Bài 37: Luyện tập chuỗi bài đọc Invoice & Email', completed: false, duration: '28:15' },
      ]
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-bold text-indigo-600">Khóa TOEIC Bứt Phá 750+</span>
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">{currentLesson}</h2>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold self-start sm:self-auto">
          Tiến độ: 75%
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-3">
          {/* Video Container 16:9 responsive & fit cho laptop */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-video max-h-[340px] sm:max-h-[380px] lg:max-h-[420px] w-full relative flex items-center justify-center shadow-lg">
            <div className="text-center text-white space-y-2 p-4">
              <div
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center mx-auto cursor-pointer hover:scale-105 transition-transform shadow-xl"
              >
                {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5 fill-white" />}
              </div>
              <p className="text-xs text-slate-300">
                {isPlaying ? 'Đang phát video bài giảng 1080p...' : 'Nhấp để bắt đầu xem video'}
              </p>
            </div>

            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 to-transparent p-3 sm:p-4 flex items-center justify-between text-white text-xs">
              <span className="font-mono text-[11px]">14:20 / 32:00</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/20">1080p • 1.25x</span>
            </div>
          </div>

          {/* Download tài liệu */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs min-w-0">
              <FileText className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-semibold truncate">Slide_Bai_36_Scanning_Part7.pdf (4.2 MB)</span>
            </div>
            <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-1 shrink-0">
              <Download className="w-3.5 h-3.5" />
              <span>Tải</span>
            </button>
          </div>
        </div>

        {/* Playlist */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Nội dung bài học</h4>
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {chapters.map((chap) => (
              <div key={chap.id} className="space-y-1.5">
                <h5 className="font-bold text-[11px] text-slate-400 uppercase tracking-wider">{chap.title}</h5>
                {chap.lessons.map((les) => {
                  const isCurrent = currentLesson === les.title;
                  return (
                    <div
                      key={les.id}
                      onClick={() => setCurrentLesson(les.title)}
                      className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-2 text-xs transition-all ${
                        isCurrent
                          ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {les.completed ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                        )}
                        <span className="truncate">{les.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{les.duration}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- 5. Phòng thi & Làm bài (Exam / Quiz có sticky timer trên mobile) ---
function StudentExamQuizView() {
  const [examStatus, setExamStatus] = useState('in_progress');
  const [timeLeft, setTimeLeft] = useState(7200);
  const [selectedAnswers, setSelectedAnswers] = useState({ 1: 'B', 2: 'A' });

  useEffect(() => {
    if (examStatus !== 'in_progress') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [examStatus]);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {examStatus === 'submitted' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl max-w-2xl mx-auto space-y-4 text-center animate-in zoom-in-95">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Kết Quả Thi TOEIC Mock Test</h3>

          <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] text-slate-400">Listening:</span>
              <p className="text-lg font-black text-indigo-600">425</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] text-slate-400">Reading:</span>
              <p className="text-lg font-black text-emerald-600">395</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200">
              <span className="text-[10px] text-indigo-600 font-bold">Tổng:</span>
              <p className="text-lg font-black text-indigo-700">820 / 990</p>
            </div>
          </div>

          <button
            onClick={() => setExamStatus('in_progress')}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
          >
            Làm lại bài thi
          </button>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Header phòng thi responsive */}
          <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-600">Phòng Thi Trực Tuyến</span>
              <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">ETS 2024 Actual Full Test 01</h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 font-mono font-extrabold text-xs">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
              <button
                onClick={() => setExamStatus('submitted')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                Nộp Bài
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-bold text-purple-600">Part 1: Photographs</span>
                  <span className="text-slate-400">Câu 1 / 100</span>
                </div>

                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 flex items-center gap-2.5">
                  <button className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Play className="w-3 h-3 ml-0.5 fill-white" />
                  </button>
                  <span className="text-xs font-semibold text-purple-900 dark:text-purple-300">File audio câu hỏi số 1</span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Lắng nghe 4 phương án và chọn phương án mô tả chính xác nhất:
                </p>

                <div className="space-y-1.5">
                  {['(A) She is typing on a laptop.', '(B) She is taking notes in a meeting.', '(C) She is closing the window.', '(D) She is filing documents.'].map((opt, idx) => {
                    const optKey = ['A', 'B', 'C', 'D'][idx];
                    const isSelected = selectedAnswers[1] === optKey;
                    return (
                      <div
                        key={optKey}
                        onClick={() => setSelectedAnswers({ ...selectedAnswers, 1: optKey })}
                        className={`p-2.5 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? 'bg-indigo-600 text-white' : 'border border-slate-300 text-slate-500'
                        }`}>
                          {optKey}
                        </div>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bảng câu hỏi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5 h-fit">
              <h4 className="font-bold text-xs uppercase text-slate-400">Danh sách câu hỏi</h4>
              <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                  const isDone = selectedAnswers[num];
                  return (
                    <button
                      key={num}
                      className={`h-8 rounded-lg text-xs font-bold transition-all ${
                        isDone ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 6. Lịch học & Điểm danh ---
function StudentScheduleView() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Thời Khóa Biểu & Chuyên Cần</h2>
        <p className="text-xs text-slate-400 mt-0.5">Lịch học, phòng học offline / Meet và lịch sử điểm danh</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Lớp: TOEIC Cấp Tốc 750+ (K28)</h4>
            <p className="text-[11px] text-slate-400">Lịch học: Thứ 2-4-6 (18:00 - 20:00)</p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold shrink-0">
            Chuyên cần: 92%
          </span>
        </div>

        <div className="space-y-2.5">
          {[
            { id: 1, title: 'Buổi 1: Tổng quan bài thi & Part 1', date: '04/11/2026', room: 'Phòng P.402', status: 'Đã tham gia' },
            { id: 2, title: 'Buổi 2: Câu hỏi phủ định Part 2', date: '06/11/2026', room: 'Phòng P.402', status: 'Đã tham gia' },
            { id: 3, title: 'Buổi 3: Luyện nghe Part 3', date: '11/11/2026', room: 'Phòng P.402', status: 'Hôm nay' },
          ].map((s) => (
            <div key={s.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-indigo-600">Buổi #{s.id} • {s.date}</span>
                <h5 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">{s.title}</h5>
                <p className="text-[11px] text-slate-400">{s.room}</p>
              </div>
              <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800">
                {s.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- 7. Chứng chỉ & Đánh giá ---
function StudentCertificatesView() {
  const cert = MOCK_DATA.student.certificates[0];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Chứng Chỉ Khóa Học & Đánh Giá</h2>
        <p className="text-xs text-slate-400 mt-0.5">Tải về chứng chỉ hoàn thành khóa học và gửi nhận xét</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Hoàn thành
              </span>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{cert.courseName}</h4>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-mono space-y-1">
            <div className="flex justify-between"><span>Mã:</span><strong>{cert.code}</strong></div>
            <div className="flex justify-between"><span>Cấp ngày:</span><strong>{cert.issueDate}</strong></div>
            <div className="flex justify-between"><span>Điểm:</span><strong className="text-emerald-600">{cert.score}</strong></div>
          </div>

          <button
            onClick={() => alert('Đang tải file PDF Chứng chỉ TOEIC Master...')}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Chứng Chỉ (PDF)</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs space-y-3">
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Đánh giá sao khóa học</h4>
          <div className="flex items-center gap-1 text-amber-500 text-lg">
            <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
            <span className="text-xs font-bold text-slate-600 ml-2">5.0 / 5.0</span>
          </div>
          <textarea
            rows={2}
            defaultValue="Khóa học rất chi tiết và dễ hiểu, thầy Quân nhiệt tình giải đáp!"
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <button
            onClick={() => alert('Đã gửi đánh giá thành công!')}
            className="w-full py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
          >
            Gửi Đánh Giá
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 8. Lịch sử Đơn hàng & Hỗ trợ ---
function StudentHistorySupportView() {
  const transactions = MOCK_DATA.student.transactions;
  const [supportMsg, setSupportMsg] = useState('');
  const [chatLog, setChatLog] = useState([
    { sender: 'bot', text: 'Xin chào! Bộ phận hỗ trợ TOEIC Master sẵn sàng trợ giúp bạn.' },
  ]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setChatLog([...chatLog, { sender: 'user', text: supportMsg }]);
    setSupportMsg('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Lịch Sử Giao Dịch & Trợ Giúp</h2>
        <p className="text-xs text-slate-400 mt-0.5">Quản lý hóa đơn đã thanh toán và gửi tin nhắn hỗ trợ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2.5">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Đơn hàng đã mua</h3>
          {transactions.map((tx) => (
            <div key={tx.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold">
                <span>{tx.id}</span>
                <span className="text-emerald-600">{tx.status}</span>
              </div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 truncate">{tx.course}</h5>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>{tx.date}</span>
                <strong className="text-indigo-600">{tx.amount.toLocaleString('vi-VN')} đ</strong>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 flex flex-col h-[360px]">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Trợ giúp trực tuyến</span>
          </h3>

          <div className="flex-1 overflow-y-auto space-y-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs">
            {chatLog.map((c, i) => (
              <div key={i} className={`flex ${c.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2.5 rounded-xl ${
                  c.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}>
                  {c.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập câu hỏi..."
              value={supportMsg}
              onChange={(e) => setSupportMsg(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <button type="submit" className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700">
              Gửi
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
