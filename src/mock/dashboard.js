// src/mock/dashboard.js
// Nguồn dữ liệu Dashboard đồng bộ với mock/users.js và mock/courses.js

// ─── 4 StatCards theo yêu cầu ────────────────────────────────────────────────
// 1. Tổng người dùng: 15.840
// 2. Khóa học đã xuất bản: 148
// 3. Doanh thu tháng: 285.450.000 ₫
// 4. Yêu cầu hỗ trợ chưa xử lý: invertTrend = true (giảm hiển thị màu xanh, tăng hiển thị màu đỏ)
export const mockDashboardStats = [
  {
    id: 'total_users',
    label: 'Tổng người dùng',
    value: '15.840',
    change: '+8.5%',
    trend: 'up',
    subText: 'so với tháng trước',
    icon: 'Users',
    color: 'indigo',
  },
  {
    id: 'published_courses',
    label: 'Khóa học đã xuất bản',
    value: '148',
    change: '+12.0%',
    trend: 'up',
    subText: 'so với tháng trước',
    icon: 'BookOpen',
    color: 'blue',
  },
  {
    id: 'monthly_revenue',
    label: 'Doanh thu tháng (VNĐ)',
    value: '285.450.000 ₫',
    change: '+15.3%',
    trend: 'up',
    subText: 'so với tháng trước',
    icon: 'TrendingUp',
    color: 'green',
  },
  {
    id: 'pending_tickets',
    label: 'Yêu cầu hỗ trợ chưa xử lý',
    value: '14',
    change: '-18.2%',
    trend: 'down',
    subText: 'giảm tồn đọng',
    icon: 'HelpCircle',
    color: 'red',
    invertTrend: true, // Giảm hiển thị màu xanh, tăng hiển thị màu đỏ
  },
];

// ─── Biểu đồ đường doanh thu 12 tháng (Bỏ đường "Chỉ tiêu") ──────────────────
export const mockRevenue12Months = [
  { month: 'T1', revenue: 165000000 },
  { month: 'T2', revenue: 182000000 },
  { month: 'T3', revenue: 195000000 },
  { month: 'T4', revenue: 210000000 },
  { month: 'T5', revenue: 225000000 },
  { month: 'T6', revenue: 240000000 },
  { month: 'T7', revenue: 235000000 },
  { month: 'T8', revenue: 258000000 },
  { month: 'T9', revenue: 268000000 },
  { month: 'T10', revenue: 285450000 },
  { month: 'T11', revenue: 302000000 },
  { month: 'T12', revenue: 320000000 },
];

// ─── Biểu đồ cột học viên ghi danh mới theo 12 tháng ─────────────────────────
export const mockEnrollments12Months = [
  { month: 'T1', students: 145, toeic: 95, ielts: 50 },
  { month: 'T2', students: 168, toeic: 110, ielts: 58 },
  { month: 'T3', students: 192, toeic: 125, ielts: 67 },
  { month: 'T4', students: 215, toeic: 140, ielts: 75 },
  { month: 'T5', students: 240, toeic: 155, ielts: 85 },
  { month: 'T6', students: 285, toeic: 180, ielts: 105 },
  { month: 'T7', students: 310, toeic: 195, ielts: 115 },
  { month: 'T8', students: 335, toeic: 210, ielts: 125 },
  { month: 'T9', students: 370, toeic: 235, ielts: 135 },
  { month: 'T10', students: 418, toeic: 265, ielts: 153 },
  { month: 'T11', students: 445, toeic: 280, ielts: 165 },
  { month: 'T12', students: 490, toeic: 310, ielts: 180 },
];

// ─── Biểu đồ tròn tỉ lệ vai trò người dùng (Đúng 3 vai trò, tổng 15.840) ────
export const mockRoleDistribution = [
  { name: 'Học viên', value: 13400, percentage: 84.6, color: '#6366f1' },       // Indigo
  { name: 'Giảng viên', value: 2150, percentage: 13.6, color: '#3b82f6' },      // Blue
  { name: 'Quản trị viên', value: 290, percentage: 1.8, color: '#8b5cf6' },     // Purple
];

// ─── Bảng 1: Đơn hàng gần đây ────────────────────────────────────────────────
export const mockRecentOrders = [
  {
    id: 'ORD26001',
    user: 'Nguyễn Văn An',
    userEmail: 'an.nguyen@toeic.vn',
    course: 'TOEIC 650+ Listening & Reading Cấp tốc',
    amount: 1450000,
    status: 'paid',
    paymentMethod: 'MoMo',
    date: '31/10/2026 16:45',
  },
  {
    id: 'ORD26002',
    user: 'Lê Minh Châu',
    userEmail: 'le.minh.chau@toeic.vn',
    course: 'IELTS Speaking Masterclass Band 7.5+',
    amount: 2800000,
    status: 'pending',
    paymentMethod: 'VNPay',
    date: '31/10/2026 15:20',
  },
  {
    id: 'ORD26003',
    user: 'Trần Thị Mai Phương',
    userEmail: 'phuong.tran@toeic.vn',
    course: 'Luyện thi TOEIC Cấp tốc 30 ngày',
    amount: 1200000,
    status: 'paid',
    paymentMethod: 'Chuyển khoản',
    date: '31/10/2026 14:10',
  },
  {
    id: 'ORD26004',
    user: 'Hoàng Thu Hà',
    userEmail: 'hoang.thu.ha@toeic.vn',
    course: 'Tiếng Anh Giao tiếp Công sở & Đàm phán',
    amount: 1850000,
    status: 'failed',
    paymentMethod: 'MoMo',
    date: '31/10/2026 11:35',
  },
  {
    id: 'ORD26005',
    user: 'Đặng Quốc Bảo',
    userEmail: 'bao.dang@toeic.vn',
    course: 'Chuyên đề IELTS Writing Task 1 & 2',
    amount: 3150000,
    status: 'paid',
    paymentMethod: 'VNPay',
    date: '30/10/2026 20:50',
  },
];

// ─── Bảng 2: Nội dung chờ duyệt (Không có "Đề thi thử") ──────────────────────
export const mockPendingReviews = [
  {
    id: 'REV-001',
    title: 'Khóa học: TOEIC 750+ Đột phá Từ vựng & Ngữ pháp nâng cao',
    author: 'ThS. Trần Thị Mai Phương',
    authorRole: 'Giảng viên TOEIC',
    type: 'Khóa học',
    category: 'TOEIC',
    submittedAt: '31/10/2026 14:20',
    totalLessons: 36,
  },
  {
    id: 'REV-002',
    title: 'Video bài giảng: Bí quyết phản xạ Part 2 TOEIC không bị lừa bởi từ đồng âm',
    author: 'ThS. Bùi Quốc Huy',
    authorRole: 'Giảng viên TOEIC',
    type: 'Video bài giảng',
    category: 'TOEIC',
    submittedAt: '31/10/2026 10:15',
    totalLessons: 1,
  },
  {
    id: 'REV-003',
    title: 'Bài tập: 50 câu trắc nghiệm Ngữ pháp chuyên đề Mệnh đề quan hệ rút gọn',
    author: 'TS. Lê Hoàng Nam',
    authorRole: 'Giảng viên IELTS',
    type: 'Bài tập',
    category: 'TOEIC',
    submittedAt: '30/10/2026 18:40',
    totalLessons: 50,
  },
  {
    id: 'REV-004',
    title: 'Tài liệu: Sổ tay 1200 từ vựng cốt lõi IELTS Academic Band 7.5+',
    author: 'Cô Vũ Phương Thảo',
    authorRole: 'Giảng viên IELTS',
    type: 'Tài liệu',
    category: 'IELTS',
    submittedAt: '30/10/2026 15:30',
    totalLessons: 1,
  },
  {
    id: 'REV-005',
    title: 'Khóa học: Phát âm chuẩn Anh - Mỹ IPA & Ngữ điệu nâng cao',
    author: 'Thầy Phạm Gia Huy',
    authorRole: 'Giảng viên Giao tiếp',
    type: 'Khóa học',
    category: 'Giao tiếp',
    submittedAt: '29/10/2026 09:00',
    totalLessons: 18,
  },
];

// ─── Bảng 3: Yêu cầu hỗ trợ ưu tiên cao ─────────────────────────────────────
export const mockHighPriorityTickets = [
  {
    id: 'TCK-1092',
    subject: 'Lỗi trừ tiền 2 lần khi thanh toán qua VNPay đơn ORD2410-002',
    requester: 'Đỗ Thu Trang',
    requesterEmail: 'trang.dothu@toeic.vn',
    priority: 'urgent',
    status: 'open',
    category: 'Thanh toán',
    createdAt: '15 phút trước',
  },
  {
    id: 'TCK-1088',
    subject: 'Không tải được file PDF tài liệu đề thi Part 5 khóa TOEIC 650+',
    requester: 'Phạm Minh Đức',
    requesterEmail: 'duc.pham@toeic.vn',
    priority: 'urgent',
    status: 'in_progress',
    category: 'Học tập',
    createdAt: '45 phút trước',
  },
  {
    id: 'TCK-1085',
    subject: 'Tài khoản báo bị khóa sau khi đổi mật khẩu trên ứng dụng điện thoại',
    requester: 'Hoàng Bích Ngọc',
    requesterEmail: 'ngoc.hoang@toeic.vn',
    priority: 'high',
    status: 'open',
    category: 'Tài khoản',
    createdAt: '2 giờ trước',
  },
  {
    id: 'TCK-1081',
    subject: 'Audio phần Listening bài tập số 3 bị rè và ngắt đoạn ở câu 45-50',
    requester: 'Vũ Hải Đăng',
    requesterEmail: 'dang.vu@toeic.vn',
    priority: 'high',
    status: 'in_progress',
    category: 'Nội dung',
    createdAt: '4 giờ trước',
  },
  {
    id: 'TCK-1077',
    subject: 'Video bài giảng số 8 bị dừng đột ngột ở phút 12:35 và load liên tục',
    requester: 'Ngô Phương Thảo',
    requesterEmail: 'thao.ngo@toeic.vn',
    priority: 'high',
    status: 'open',
    category: 'Kỹ thuật',
    createdAt: '6 giờ trước',
  },
];

// ─── Thông báo hệ thống ───────────────────────────────────────────────────────
export const mockNotifications = [
  { id: 1, type: 'review', message: 'Khóa học "TOEIC 750+ Đột phá Từ vựng" đang chờ duyệt', time: '5 phút trước', read: false },
  { id: 2, type: 'order', message: 'Đơn hàng ORD2410-002 vừa phát sinh chờ xác nhận', time: '12 phút trước', read: false },
  { id: 3, type: 'ticket', message: 'Ticket TCK-1092 ưu tiên KHẨN CẤP cần xử lý ngay', time: '15 phút trước', read: false },
  { id: 4, type: 'user', message: '12 học viên mới hoàn tất đăng ký lớp TOEIC-K24', time: '1 giờ trước', read: true },
  { id: 5, type: 'system', message: 'Sao lưu cơ sở dữ liệu định kỳ hoàn tất lúc 03:00', time: '8 giờ trước', read: true },
];
