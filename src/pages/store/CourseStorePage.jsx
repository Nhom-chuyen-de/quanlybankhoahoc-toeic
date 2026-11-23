// src/pages/store/CourseStorePage.jsx
// TRANG BÁN KHÓA HỌC TOEIC MASTER - TỐI ƯU HÓA HOÀN HẢO CHO CẢ LAPTOP & MOBILE

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ShoppingCart, Star, CheckCircle, Clock, BookOpen,
  Award, Shield, Zap, ChevronRight, X, Play, Heart, Download,
  ExternalLink, ArrowRight, User, Check, Sparkles, Tag, HelpCircle,
  PhoneCall, Mail, Sun, Moon, CreditCard, ChevronDown, Flame
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES, ROLE_HOME } from '../../constants/roles';

// ==========================================
// DỮ LIỆU CÁC KHÓA HỌC ĐANG MỞ BÁN
// ==========================================

const STORE_COURSES = [
  {
    id: 'CRS-01',
    title: 'TOEIC Bứt Phá 750+ Toàn Diện (Listening & Reading)',
    category: 'intermediate',
    level: 'Mục tiêu 750 - 850+',
    badge: 'Bán Chạy Nhất',
    badgeColor: 'bg-amber-500 text-white',
    teacher: 'ThS. Nguyễn Minh Quân',
    teacherTitle: 'Chuyên gia 985/990 TOEIC',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=80',
    price: 2490000,
    originalPrice: 4200000,
    discountPercent: 41,
    rating: 4.95,
    reviewsCount: 1240,
    studentsCount: 3820,
    lessonsCount: 48,
    durationHours: 65,
    format: 'Video + Lớp Zoom Trực Tuyến',
    description: 'Chiến thuật bẻ khóa bẫy hội thoại Part 3 & 4, tối ưu tốc độ đọc Part 7 kép/ba 60s/đoạn, nắm trọn 1200+ từ vựng thương mại cao cấp.',
    syllabus: [
      { chapter: 'Chương 1', title: 'Chiến thuật xử lý bẫy Listening Part 1 & 2', lessons: 8 },
      { chapter: 'Chương 2', title: 'Phân tích biểu đồ và hội thoại 3 người Part 3', lessons: 12 },
      { chapter: 'Chương 3', title: 'Đột phá ngữ pháp & bẫy từ loại Part 5 & 6', lessons: 14 },
      { chapter: 'Chương 4', title: 'Tốc độ Skimming & Scanning bài đọc Part 7', lessons: 14 },
    ],
    perks: ['Tặng bộ 10 đề thi ETS 2024 độc quyền', 'Hỗ trợ giải đáp 24/7 từ Giảng viên', 'Cam kết hoàn tiền nếu không tăng ít nhất 150 điểm']
  },
  {
    id: 'CRS-02',
    title: 'Khóa TOEIC Nền Tảng Cho Người Mất Gốc (0 - 450+)',
    category: 'beginner',
    level: 'Mất gốc đến 450+',
    badge: 'Khuyên Dùng',
    badgeColor: 'bg-emerald-600 text-white',
    teacher: 'Thầy Lê Hoàng Nam',
    teacherTitle: 'Giảng viên Sư Phạm 960 TOEIC',
    teacherAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80',
    price: 1390000,
    originalPrice: 2200000,
    discountPercent: 37,
    rating: 4.88,
    reviewsCount: 920,
    studentsCount: 5120,
    lessonsCount: 36,
    durationHours: 45,
    format: 'Video Tự Học Kèm Mentor',
    description: 'Xây lại toàn bộ nền tảng ngữ âm chuẩn IPA, 8 chủ điểm ngữ pháp cốt lõi và 600 từ vựng căn bản thường xuyên xuất hiện trong đề thi.',
    syllabus: [
      { chapter: 'Chương 1', title: 'Phát âm chuẩn IPA & Nghe âm đuôi cốt lõi', lessons: 8 },
      { chapter: 'Chương 2', title: '8 Chủ điểm ngữ pháp sống còn trong Part 5', lessons: 10 },
      { chapter: 'Chương 3', title: 'Chiến thuật ăn trọn điểm Part 1 & Part 2', lessons: 10 },
      { chapter: 'Chương 4', title: 'Phương pháp đọc hiểu không cần dịch từng từ', lessons: 8 },
    ],
    perks: ['Ebook 600 từ vựng TOEIC căn bản có audio', 'Lộ trình cá nhân hóa theo điểm test đầu vào', 'Được học lại miễn phí nếu chưa đạt 450']
  },
  {
    id: 'CRS-03',
    title: 'Chiến Binh TOEIC Speaking & Writing 300+ / 400',
    category: 'speaking_writing',
    level: 'SW Mục tiêu 300+',
    badge: 'Chấm 1-1',
    badgeColor: 'bg-purple-600 text-white',
    teacher: 'Cô Emma Vũ',
    teacherTitle: 'IELTS 8.5 / TOEIC 990 Full Band',
    teacherAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&auto=format&fit=crop&q=80',
    price: 2990000,
    originalPrice: 4800000,
    discountPercent: 38,
    rating: 4.92,
    reviewsCount: 460,
    studentsCount: 1650,
    lessonsCount: 32,
    durationHours: 50,
    format: 'Lớp Học Tương Tác Kèm Chấm Bài 1-1',
    description: 'Rèn luyện ngữ điệu tự nhiên, công thức trả lời 3 bước cho Part 1-5 Speaking và kỹ thuật viết Email thương mại & Viết luận quan điểm Part 2-3 Writing.',
    syllabus: [
      { chapter: 'Chương 1', title: 'Phát âm nhấn trọng âm, nối âm tự nhiên', lessons: 6 },
      { chapter: 'Chương 2', title: 'Mô tả tranh & Trả lời câu hỏi Part 1-3 Speaking', lessons: 8 },
      { chapter: 'Chương 3', title: 'Kỹ năng đề xuất giải pháp & Trình bày quan điểm', lessons: 8 },
      { chapter: 'Chương 4', title: 'Viết thư điện tử & Bài luận quan điểm Writing', lessons: 10 },
    ],
    perks: ['Giáo viên trực tiếp sửa phát âm & bài viết 1-1', 'Kho template câu trả lời ăn điểm cao', 'Phòng luyện nói AI chấm điểm phản xạ']
  },
  {
    id: 'CRS-04',
    title: 'Giải Đề Thi Thật ETS 2024 & Bẻ Khóa Bẫy Mới Nhất',
    category: 'practice',
    level: 'Luyện đề cấp tốc (550 - 850)',
    badge: 'Mới Nhất 2024',
    badgeColor: 'bg-rose-600 text-white',
    teacher: 'ThS. Nguyễn Minh Quân',
    teacherTitle: 'Chuyên gia 985/990 TOEIC',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    price: 1890000,
    originalPrice: 3000000,
    discountPercent: 37,
    rating: 4.98,
    reviewsCount: 880,
    studentsCount: 2940,
    lessonsCount: 28,
    durationHours: 42,
    format: 'Video Chữa Chi Tiết Từng Câu',
    description: 'Chữa chi tiết 10 đề thi thật ETS 2024 mới nhất, phân tích toàn bộ bẫy từ vựng đồng âm, ngữ pháp lạ và mẹo phân bổ thời gian phòng thi.',
    syllabus: [
      { chapter: 'Chương 1', title: 'Chiến thuật phòng thi & Phân bổ 120 phút', lessons: 4 },
      { chapter: 'Chương 2', title: 'Giải đề ETS 2024 Test 01 - 04 (Chi tiết LC & RC)', lessons: 8 },
      { chapter: 'Chương 3', title: 'Giải đề ETS 2024 Test 05 - 08 (Nâng cao)', lessons: 8 },
      { chapter: 'Chương 4', title: 'Giải đề ETS 2024 Test 09 - 10 & Tổng kết bẫy', lessons: 8 },
    ],
    perks: ['File PDF 10 đề bản quyền kèm audio chuẩn ETS', 'Bảng giải thích song ngữ từng câu chi tiết', 'Thi thử online bấm giờ thi thật không giới hạn']
  },
  {
    id: 'CRS-05',
    title: 'Kho 1000 Từ Vựng TOEIC Cốt Lõi Đi Thi Chắc Chắn Gặp',
    category: 'vocabulary',
    level: 'Mọi cấp độ',
    badge: 'Khóa Bổ Trợ',
    badgeColor: 'bg-teal-600 text-white',
    teacher: 'Cô Trần Mai Lan',
    teacherTitle: '990 TOEIC Tuyệt Đối',
    teacherAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
    price: 690000,
    originalPrice: 1200000,
    discountPercent: 43,
    rating: 4.85,
    reviewsCount: 650,
    studentsCount: 4200,
    lessonsCount: 20,
    durationHours: 25,
    format: 'Video + Flashcard Thông Minh',
    description: 'Nắm chắc 1000 từ vựng cốt lõi phân theo 20 chủ đề thương mại (Finance, Marketing, Office, Travel, Human Resources...) kèm ví dụ câu ngữ cảnh.',
    syllabus: [
      { chapter: 'Chương 1', title: 'Từ vựng Hợp đồng, Mua sắm & Bảo hành', lessons: 5 },
      { chapter: 'Chương 2', title: 'Từ vựng Tài chính, Ngân hàng & Kế toán', lessons: 5 },
      { chapter: 'Chương 3', title: 'Từ vựng Nhân sự, Tuyển dụng & Đào tạo', lessons: 5 },
      { chapter: 'Chương 4', title: 'Từ vựng Du lịch, Sự kiện & Nhà hàng', lessons: 5 },
    ],
    perks: ['Tặng bộ Flashcard học từ vựng thông minh', 'Bài kiểm tra trắc nghiệm sau mỗi bài học', 'Audio phát âm giọng Anh - Mỹ chuẩn']
  },
  {
    id: 'CRS-06',
    title: 'COMBO Toàn Năng: Từ Mất Gốc Lên 800+ TOEIC Chuyên Sâu',
    category: 'combo',
    level: '0 đến 800+ Điểm Cao',
    badge: 'Tiết Kiệm 50%',
    badgeColor: 'bg-red-600 text-white font-extrabold',
    teacher: 'Đội Ngũ Giảng Viên 980+ TOEIC',
    teacherTitle: 'Hội đồng chuyên môn TOEIC Master',
    teacherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=600&auto=format&fit=crop&q=80',
    price: 3690000,
    originalPrice: 7400000,
    discountPercent: 50,
    rating: 4.99,
    reviewsCount: 1820,
    studentsCount: 6300,
    lessonsCount: 94,
    durationHours: 130,
    format: 'Trọn Gói 3 Khóa Học Toàn Diện',
    description: 'Gói giải pháp trọn đời gồm: Khóa Nền tảng (0-450) + Khóa Bứt phá (750+) + Khóa Luyện đề ETS 2024. Tiết kiệm 50% chi phí.',
    syllabus: [
      { chapter: 'Khóa 1', title: 'Giai đoạn 1: Nền tảng ngữ âm & ngữ pháp (0-450)', lessons: 36 },
      { chapter: 'Khóa 2', title: 'Giai đoạn 2: Bứt phá kỹ năng & bẻ bẫy (450-750+)', lessons: 48 },
      { chapter: 'Khóa 3', title: 'Giai đoạn 3: Luyện 10 đề ETS thi thật (750-850+)', lessons: 10 },
    ],
    perks: ['Tặng đầy đủ Ebook + Flashcard + 20 đề thi online', 'Gặp gỡ giảng viên giải đáp thắc mắc hàng tuần', 'Cam kết đầu ra bằng văn bản có giá trị pháp lý']
  }
];

export default function CourseStorePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [teacherWarningModal, setTeacherWarningModal] = useState(false);

  // Yêu cầu 4: Không cho Giảng viên vào trang bán khóa học & mua khóa học
  useEffect(() => {
    if (isAuthenticated && user?.vaiTro === ROLES.TEACHER) {
      setTeacherWarningModal(true);
      const timer = setTimeout(() => {
        navigate('/giang-vien', { replace: true });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate]);

  // Điều hướng vào đúng tài khoản học tập: chưa đăng nhập thì bắt buộc vào /login
  const handleGoToLearning = () => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      navigate(ROLE_HOME[user.vaiTro] || '/login');
    }
  };

  // State bộ lọc & tìm kiếm
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  // State giỏ hàng (Cart) & Modal chi tiết
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCourseDetail, setSelectedCourseDetail] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState('TOEICMASTER2026');
  const [couponApplied, setCouponApplied] = useState(true);

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

  // Đếm ngược Flash Sale
  const [flashSaleTime, setFlashSaleTime] = useState({ hours: 4, minutes: 28, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setFlashSaleTime((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAddToCart = (course, e) => {
    if (e) e.stopPropagation();
    // Yêu cầu 4: Chỉ học viên mới được quyền mua khóa học
    if (isAuthenticated && user?.vaiTro === ROLES.TEACHER) {
      alert('Tài khoản Giảng viên không được phép mua khóa học. Vui lòng đăng nhập tài khoản Học viên!');
      navigate('/giang-vien');
      return;
    }
    if (!cart.some((item) => item.id === course.id)) {
      setCart([...cart, course]);
    }
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (courseId) => {
    setCart(cart.filter((item) => item.id !== courseId));
  };

  const handleBuyNow = (course, e) => {
    if (e) e.stopPropagation();
    // Yêu cầu 4: Chỉ học viên mới được quyền mua khóa học
    if (isAuthenticated && user?.vaiTro === ROLES.TEACHER) {
      alert('Tài khoản Giảng viên không được phép mua khóa học. Vui lòng đăng nhập tài khoản Học viên!');
      navigate('/giang-vien');
      return;
    }
    if (!cart.some((item) => item.id === course.id)) {
      setCart([...cart, course]);
    }
    setIsCartOpen(true);
  };

  const filteredCourses = useMemo(() => {
    return STORE_COURSES.filter((course) => {
      const matchCat = selectedCategory === 'all' || course.category === selectedCategory;
      const matchQuery =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.level.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.studentsCount - a.studentsCount;
    });
  }, [selectedCategory, searchQuery, sortBy]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = couponApplied && cart.length > 0 ? 300000 : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200 flex flex-col overflow-x-hidden">
      
      {/* ======================================================== */}
      {/* 1. TOPBAR CỬA HÀNG KHÓA HỌC (GỌN GÀNG, FIT LAPTOP/MOBILE) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo TOEIC Master */}
          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0" onClick={() => navigate('/store')}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white shadow-md">
              <Award className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">TOEIC Master</span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                  Store
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 font-medium">Hệ Thống Luyện Thi TOEIC Chuẩn Quốc Tế</p>
            </div>
          </div>

          {/* Thanh tìm kiếm trên Header cho Laptop/Desktop */}
          <div className="hidden md:flex items-center flex-1 max-w-sm lg:max-w-md mx-3">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm khóa học TOEIC 750+, Mất gốc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:outline-indigo-600 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Công cụ phải: Dark Mode, Giỏ Hàng, Vào Học Tập */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Đổi giao diện sáng/tối"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Giỏ Hàng */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              title="Xem giỏ hàng"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600 text-white font-extrabold text-[9px] sm:text-[10px] flex items-center justify-center animate-bounce shadow-xs">
                  {cart.length}
                </span>
              )}
              <span className="hidden lg:inline text-xs font-bold">Giỏ ({cart.length})</span>
            </button>

            {/* Nút đăng nhập hoặc vào học tùy thuộc trạng thái authentication */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => navigate('/login')}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xs:inline">Đăng Nhập</span>
                </button>
                <button
                  onClick={handleGoToLearning}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  title="Vào học (chuyển sang đăng nhập nếu chưa có tài khoản)"
                >
                  <span>Vào Học</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end text-right">
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 max-w-[120px] truncate">{user?.hoTen}</span>
                  <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase">{user?.vaiTro}</span>
                </div>
                <button
                  onClick={handleGoToLearning}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <span>Vào Học</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. HERO BANNER GỌN GÀNG, VỪA VẶN MÀN HÌNH LAPTOP & PHONE */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-blue-600 text-white py-6 sm:py-8 lg:py-10 px-3 sm:px-6 lg:px-8 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=70"
          alt=""
          aria-hidden="true"
          className="absolute right-0 bottom-0 w-[38%] h-full object-cover object-center opacity-10 mix-blend-overlay pointer-events-none"
        />
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          
          {/* Cột trái: Thông điệp & Cam kết */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Khóa học chuẩn quốc tế ETS 2024</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black leading-snug tracking-tight text-white">
              Học TOEIC online chất lượng cao, bứt phá mục tiêu điểm số cùng các khóa học hàng đầu
            </h1>

            <p className="text-xs sm:text-sm text-indigo-100 max-w-xl leading-relaxed">
              Sở hữu trọn đời lộ trình TOEIC từ mất gốc đến 850+. Bài giảng chi tiết, tài liệu độc quyền và hỗ trợ 24/7 từ chuyên gia 980+ TOEIC.
            </p>

            {/* 3 Box cam kết gọn gàng */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <BookOpen className="w-3.5 h-3.5 text-amber-300 mb-1" />
                <h4 className="text-[11px] font-bold text-white truncate">Đa Dạng Lộ Trình</h4>
                <p className="text-[10px] text-indigo-200 truncate">Từ 0 đến 850+</p>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <Clock className="w-3.5 h-3.5 text-emerald-300 mb-1" />
                <h4 className="text-[11px] font-bold text-white truncate">Học Linh Hoạt</h4>
                <p className="text-[10px] text-indigo-200 truncate">24/7 trọn đời</p>
              </div>

              <div className="p-2 sm:p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15">
                <Award className="w-3.5 h-3.5 text-purple-300 mb-1" />
                <h4 className="text-[11px] font-bold text-white truncate">Giảng Viên 950+</h4>
                <p className="text-[10px] text-indigo-200 truncate">Cam kết đầu ra</p>
              </div>
            </div>

            {/* Testimonial badge */}
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center gap-2.5 max-w-lg">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-[11px] text-white shrink-0">
                MQ
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-amber-300 text-[10px]">
                  <span>★★★★★</span>
                  <span className="text-white font-bold ml-1">50.000+ học viên tin tưởng</span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-indigo-100 italic truncate mt-0.5">
                  "Mẹo bẫy đề thi ETS giúp mình đạt 885 TOEIC ngay lần thi đầu tiên!"
                </p>
              </div>
            </div>
          </div>

          {/* Cột phải: Hộp Flash Sale đếm ngược trong ngày */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 text-slate-800 dark:text-slate-100 shadow-xl border border-white/20">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" />
                <span className="text-xs font-black uppercase text-rose-600 tracking-wider">Flash Sale Hôm Nay</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                Ưu đãi -50%
              </span>
            </div>

            {/* Đồng hồ đếm ngược */}
            <div className="my-2.5 text-center">
              <p className="text-[10px] text-slate-400 mb-1 font-medium">Kết thúc sau:</p>
              <div className="flex items-center justify-center gap-1.5 font-mono text-white">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 dark:bg-slate-800 flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-sm font-black text-rose-400">{String(flashSaleTime.hours).padStart(2, '0')}</span>
                  <span className="text-[7px] text-slate-400">GIỜ</span>
                </div>
                <span className="text-slate-700 dark:text-white font-bold text-sm">:</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 dark:bg-slate-800 flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-sm font-black text-rose-400">{String(flashSaleTime.minutes).padStart(2, '0')}</span>
                  <span className="text-[7px] text-slate-400">PHÚT</span>
                </div>
                <span className="text-slate-700 dark:text-white font-bold text-sm">:</span>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 dark:bg-slate-800 flex flex-col items-center justify-center">
                  <span className="text-xs sm:text-sm font-black text-rose-400">{String(flashSaleTime.seconds).padStart(2, '0')}</span>
                  <span className="text-[7px] text-slate-400">GIÂY</span>
                </div>
              </div>
            </div>

            {/* Khóa học đề xuất */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-indigo-600 truncate">COMBO Toàn Năng Từ Mất Gốc Lên 800+</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 shrink-0 ml-1">-50%</span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1">
                Trọn gói 3 khóa: Nền tảng + Bứt phá 750+ + 10 Đề ETS 2024. Tiết kiệm 3.710.000đ.
              </p>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-sm font-black text-rose-600">3.690.000 đ</span>
                  <span className="text-[10px] text-slate-400 line-through ml-1.5">7.400.000 đ</span>
                </div>
                <button
                  onClick={() => handleBuyNow(STORE_COURSES[5])}
                  className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                >
                  Mua Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. BỘ LỌC DANH MỤC & THANH TÌM KIẾM                      */}
      {/* ======================================================== */}
      <section className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-3 sm:space-y-4">
        
        {/* Tìm kiếm trên mobile */}
        <div className="md:hidden">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học TOEIC..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-indigo-600"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 w-full sm:w-auto">
            {[
              { id: 'all', label: 'Tất Cả' },
              { id: 'beginner', label: 'Mất Gốc (0-450+)' },
              { id: 'intermediate', label: 'Bứt Phá (750+)' },
              { id: 'practice', label: 'Giải Đề ETS 2024' },
              { id: 'speaking_writing', label: 'Speaking & Writing' },
              { id: 'combo', label: 'Combo Tiết Kiệm' },
            ].map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
            <span className="text-slate-400">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-semibold"
            >
              <option value="popular">Phổ biến nhất</option>
              <option value="rating">Đánh giá cao nhất</option>
              <option value="price_asc">Giá tăng dần</option>
              <option value="price_desc">Giá giảm dần</option>
            </select>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. LƯỚI KHÓA HỌC (TỐI ƯU CÂN ĐỐI TRÊN CẢ LAPTOP & MOBILE) */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourseDetail(course)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs hover:shadow-lg hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                {/* Thumbnail */}
                <div className="h-36 sm:h-40 relative overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  
                  <span className={`absolute top-2.5 left-2.5 text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${course.badgeColor}`}>
                    {course.badge}
                  </span>

                  <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-white text-[10px] sm:text-[11px]">
                    <span className="bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded font-semibold">
                      {course.level}
                    </span>
                    <span className="bg-indigo-600/90 backdrop-blur-xs px-2 py-0.5 rounded font-bold">
                      {course.durationHours}h học
                    </span>
                  </div>
                </div>

                {/* Thông tin */}
                <div className="p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <img src={course.teacherAvatar} alt="Teacher" className="w-4 h-4 rounded-full object-cover shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{course.teacher}</span>
                    </div>
                    <div className="flex items-center text-amber-500 font-bold shrink-0">
                      <span>★ {course.rating}</span>
                      <span className="text-slate-400 font-normal ml-0.5">({course.reviewsCount})</span>
                    </div>
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                    <span>{course.lessonsCount} bài</span>
                    <span>•</span>
                    <span>{course.studentsCount.toLocaleString('vi-VN')} học viên</span>
                  </div>
                </div>
              </div>

              {/* Giá & Nút hành động */}
              <div className="p-3.5 sm:p-4 pt-0">
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm sm:text-base font-black text-rose-600">
                      {course.price.toLocaleString('vi-VN')} đ
                    </div>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-slate-400 line-through">{course.originalPrice.toLocaleString('vi-VN')} đ</span>
                      <span className="font-bold text-rose-600">-{course.discountPercent}%</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleAddToCart(course, e)}
                      className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 hover:bg-indigo-100 transition-colors"
                      title="Thêm vào giỏ"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleBuyNow(course, e)}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors"
                    >
                      Mua Ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. MODAL XEM CHI TIẾT KHÓA HỌC (QUICK VIEW)               */}
      {/* ======================================================== */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 max-w-xl w-full max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 space-y-4 animate-in zoom-in-95">
            
            <div className="flex items-start justify-between gap-3 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${selectedCourseDetail.badgeColor}`}>
                  {selectedCourseDetail.badge}
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                  {selectedCourseDetail.title}
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">GV: <strong className="text-slate-700 dark:text-slate-200">{selectedCourseDetail.teacher}</strong> ({selectedCourseDetail.teacherTitle})</p>
              </div>
              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedCourseDetail.description}
            </p>

            {/* Quyền lợi */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[11px] uppercase text-slate-400">Đặc quyền khóa học:</h4>
              {selectedCourseDetail.perks.map((perk, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>

            {/* Đề cương */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-[11px] uppercase text-slate-400">Đề cương chi tiết:</h4>
              <div className="space-y-1.5">
                {selectedCourseDetail.syllabus.map((s, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-indigo-600">{s.chapter}: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{s.lessons} bài</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xl font-black text-rose-600">{selectedCourseDetail.price.toLocaleString('vi-VN')} đ</span>
                <span className="text-xs text-slate-400 line-through ml-1.5">{selectedCourseDetail.originalPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleAddToCart(selectedCourseDetail);
                    setSelectedCourseDetail(null);
                  }}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-indigo-600 text-indigo-600 text-xs font-bold hover:bg-indigo-50"
                >
                  Thêm Vào Giỏ
                </button>
                <button
                  onClick={() => {
                    handleBuyNow(selectedCourseDetail);
                    setSelectedCourseDetail(null);
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Đăng Ký Học Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. GIỎ HÀNG TRƯỢT (DRAWER SLIDE-OVER)                     */}
      {/* ======================================================== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-md h-full shadow-2xl p-4 sm:p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">Giỏ Hàng Của Bạn ({cart.length})</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {checkoutSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">Đăng Ký Thành Công!</h4>
                  <p className="text-xs text-slate-500 leading-relaxed px-2">
                    Khóa học đã được kích hoạt trực tiếp vào Không Gian Học Tập của bạn.
                  </p>
                  <button
                    onClick={() => {
                      setCart([]);
                      setIsCartOpen(false);
                      setCheckoutSuccess(false);
                      handleGoToLearning();
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs"
                  >
                    Vào Không Gian Học Tập →
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 space-y-2">
                      <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                      <p className="text-xs">Giỏ hàng đang trống</p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5">
                        <img src={item.thumbnail} alt={item.title} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">{item.title}</h5>
                          <span className="font-black text-xs text-rose-600 block">{item.price.toLocaleString('vi-VN')} đ</span>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 px-3 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold uppercase"
                  />
                  <button
                    onClick={() => {
                      setCouponApplied(true);
                      alert('Đã áp dụng mã TOEICMASTER2026 (-300.000đ)');
                    }}
                    className="px-3 py-1 bg-slate-800 dark:bg-slate-700 text-white text-xs font-bold rounded-xl"
                  >
                    Áp dụng
                  </button>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Tạm tính ({cart.length} khóa):</span>
                    <span>{cartSubtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                  {couponApplied && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Mã giảm giá:</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span>Tổng thanh toán:</span>
                    <span className="text-rose-600 text-base">{cartTotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      alert('Vui lòng đăng nhập tài khoản Học Viên để tiến hành thanh toán khóa học!');
                      navigate('/login');
                      return;
                    }
                    if (user?.vaiTro === ROLES.TEACHER) {
                      alert('Tài khoản Giảng viên không được phép đăng ký khóa học! Chỉ tài khoản Học viên mới có quyền mua khóa học.');
                      navigate('/giang-vien');
                      return;
                    }
                    setCheckoutSuccess(true);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Xác Nhận & Mua Ngay</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal cảnh báo quyền hạn đối với Giảng Viên */}
      {teacherWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Không Có Quyền Mua Khóa Học</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bạn đang đăng nhập bằng <strong>Tài khoản Giảng Viên</strong>. Trang bán khóa học chỉ dành riêng cho Học viên đăng ký và thanh toán. Đang tự động chuyển bạn về cổng Giảng Viên...
            </p>
            <button
              onClick={() => navigate('/giang-vien')}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              Về Cổng Giảng Viên Ngay
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. FOOTER CHÂN TRANG GỌN GÀNG                            */}
      {/* ======================================================== */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">TOEIC Master Store</span>
            <span>• Hotline: 1900 6868</span>
          </div>
          <div>© 2026 TOEIC Master System • Tối ưu chuẩn hiển thị Laptop & Mobile.</div>
        </div>
      </footer>
    </div>
  );
}
