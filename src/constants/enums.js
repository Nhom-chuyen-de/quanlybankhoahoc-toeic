// constants/enums.js
// TODO: nối API - Các giá trị này ánh xạ từ DB sang nhãn tiếng Việt và màu badge

// ─── Trạng thái người dùng (Đúng 4 trạng thái) ────────────────────────────────
export const USER_STATUS = {
  active: { label: 'Đang hoạt động', color: 'green' },
  inactive: { label: 'Ngừng hoạt động', color: 'gray' },
  banned: { label: 'Bị khóa', color: 'red' },
  deleted: { label: 'Đã xóa', color: 'slate' },
};

// ─── Vai trò người dùng (Đúng 3 vai trò) ──────────────────────────────────────
export const USER_ROLE = {
  admin: { label: 'Quản trị viên', color: 'indigo' },
  teacher: { label: 'Giảng viên', color: 'blue' },
  student: { label: 'Học viên', color: 'teal' },
};

// ─── Trạng thái khóa học ─────────────────────────────────────────────────────
export const COURSE_STATUS = {
  draft: { label: 'Bản nháp', color: 'gray' },
  pending_review: { label: 'Chờ duyệt', color: 'yellow' },
  published: { label: 'Đã xuất bản', color: 'green' },
  archived: { label: 'Lưu trữ', color: 'slate' },
  rejected: { label: 'Từ chối', color: 'red' },
};

// ─── Trạng thái lớp học ──────────────────────────────────────────────────────
export const CLASS_STATUS = {
  upcoming: { label: 'Sắp diễn ra', color: 'blue' },
  ongoing: { label: 'Đang diễn ra', color: 'green' },
  completed: { label: 'Đã hoàn thành', color: 'gray' },
  cancelled: { label: 'Đã hủy', color: 'red' },
};

// ─── Trạng thái đơn hàng ─────────────────────────────────────────────────────
export const ORDER_STATUS = {
  pending: { label: 'Chờ thanh toán', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
  failed: { label: 'Thất bại', color: 'red' },
  refunded: { label: 'Đã hoàn tiền', color: 'purple' },
  cancelled: { label: 'Đã hủy', color: 'gray' },
};

// ─── Phương thức thanh toán ──────────────────────────────────────────────────
export const PAYMENT_METHOD = {
  bank_transfer: { label: 'Chuyển khoản ngân hàng', color: 'blue' },
  momo: { label: 'MoMo', color: 'pink' },
  vnpay: { label: 'VNPay', color: 'teal' },
  zalopay: { label: 'ZaloPay', color: 'blue' },
  credit_card: { label: 'Thẻ tín dụng', color: 'indigo' },
};

// ─── Trạng thái yêu cầu hoàn tiền ───────────────────────────────────────────
export const REFUND_STATUS = {
  pending: { label: 'Chờ xét duyệt', color: 'yellow' },
  approved: { label: 'Đã chấp thuận', color: 'green' },
  rejected: { label: 'Từ chối', color: 'red' },
  processing: { label: 'Đang xử lý', color: 'blue' },
  completed: { label: 'Hoàn thành', color: 'teal' },
};

// ─── Trạng thái mã giảm giá ──────────────────────────────────────────────────
export const COUPON_STATUS = {
  active: { label: 'Đang hoạt động', color: 'green' },
  expired: { label: 'Hết hạn', color: 'gray' },
  disabled: { label: 'Đã tắt', color: 'red' },
};

// ─── Loại mã giảm giá ────────────────────────────────────────────────────────
export const COUPON_TYPE = {
  percent: { label: 'Phần trăm (%)', color: 'indigo' },
  fixed: { label: 'Số tiền cố định (₫)', color: 'teal' },
};

// ─── Trạng thái hỗ trợ ───────────────────────────────────────────────────────
export const TICKET_STATUS = {
  open: { label: 'Mở', color: 'yellow' },
  in_progress: { label: 'Đang xử lý', color: 'blue' },
  resolved: { label: 'Đã giải quyết', color: 'green' },
  closed: { label: 'Đã đóng', color: 'gray' },
};

// ─── Trạng thái chứng chỉ ────────────────────────────────────────────────────
export const CERTIFICATE_STATUS = {
  pending: { label: 'Chờ cấp', color: 'yellow' },
  issued: { label: 'Đã cấp', color: 'green' },
  revoked: { label: 'Thu hồi', color: 'red' },
};

// ─── Loại nội dung bài học ───────────────────────────────────────────────────
export const LESSON_TYPE = {
  video: { label: 'Video', color: 'red' },
  document: { label: 'Tài liệu', color: 'blue' },
  quiz: { label: 'Bài kiểm tra', color: 'purple' },
  live: { label: 'Học trực tiếp', color: 'green' },
};

// ─── Danh mục khóa học ───────────────────────────────────────────────────────
export const COURSE_CATEGORY = {
  toeic: 'TOEIC',
  ielts: 'IELTS',
  toefl: 'TOEFL',
  english: 'Tiếng Anh giao tiếp',
};

// ─── Cấp độ khóa học ─────────────────────────────────────────────────────────
export const COURSE_LEVEL = {
  beginner: { label: 'Cơ bản', color: 'green' },
  intermediate: { label: 'Trung cấp', color: 'yellow' },
  advanced: { label: 'Nâng cao', color: 'red' },
};

// ─── Hình thức khóa học ──────────────────────────────────────────────────────
export const COURSE_FORMAT = {
  self_study: { label: 'Tự học', color: 'blue' },
  with_class: { label: 'Có lớp', color: 'purple' },
};

// ─── Trạng thái duyệt khóa học ──────────────────────────────────────────────
export const MODERATION_STATUS = {
  pending: { label: 'Chờ duyệt', color: 'yellow' },
  approved: { label: 'Đã duyệt', color: 'green' },
  rejected: { label: 'Từ chối', color: 'red' },
};

// ─── Mức độ ưu tiên hỗ trợ ───────────────────────────────────────────────────
export const TICKET_PRIORITY = {
  low: { label: 'Thấp', color: 'gray' },
  medium: { label: 'Trung bình', color: 'yellow' },
  high: { label: 'Cao', color: 'orange' },
  urgent: { label: 'Khẩn cấp', color: 'red' },
};

// ─── Sidebar navigation groups ───────────────────────────────────────────────
export const NAV_GROUPS = [
  {
    label: 'Tổng quan',
    items: [
      { key: 'dashboard', label: 'Dashboard', path: '/admin', icon: 'LayoutDashboard' },
    ],
  },
  {
    label: 'Người dùng',
    items: [
      { key: 'users', label: 'Người dùng', path: '/admin/nguoi-dung', icon: 'Users' },
      { key: 'teachers', label: 'Giáo viên', path: '/admin/teachers', icon: 'GraduationCap' },
    ],
  },
  {
    label: 'Đào tạo',
    items: [
      { key: 'categories', label: 'Danh mục', path: '/admin/danh-muc', icon: 'Tag' },
      { key: 'courses', label: 'Khóa học', path: '/admin/khoa-hoc', icon: 'BookOpen' },
      { key: 'classes', label: 'Lớp học', path: '/admin/lop-hoc', icon: 'School' },
    ],
  },
  {
    label: 'Duyệt nội dung',
    badge: true,
    items: [
      { key: 'moderation', label: 'Kiểm duyệt nội dung', path: '/admin/kiem-duyet', icon: 'ClipboardCheck' },
    ],
  },
  {
    label: 'Kinh doanh',
    items: [
      { key: 'orders', label: 'Đơn hàng', path: '/admin/don-hang', icon: 'ShoppingCart' },
      { key: 'payments', label: 'Thanh toán', path: '/admin/thanh-toan', icon: 'CreditCard' },
      { key: 'refunds', label: 'Hoàn tiền', path: '/admin/hoan-tien', icon: 'RotateCcw' },
      { key: 'coupons', label: 'Mã giảm giá', path: '/admin/ma-giam-gia', icon: 'Ticket' },
    ],
  },
  {
    label: 'Hỗ trợ',
    items: [
      { key: 'tickets', label: 'Hỗ trợ & Thông báo', path: '/admin/ho-tro', icon: 'MessageCircle' },
    ],
  },
  {
    label: 'Chứng chỉ',
    items: [
      { key: 'certificates', label: 'Chứng chỉ & Đánh giá', path: '/admin/chung-chi', icon: 'Award' },
    ],
  },
  {
    label: 'Báo cáo',
    items: [
      { key: 'reports', label: 'Báo cáo & Thống kê', path: '/admin/bao-cao', icon: 'BarChart3' },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { key: 'settings', label: 'Cài đặt', path: '/admin/cai-dat', icon: 'Settings' },
    ],
  },
];

export const PENDING_REVIEW_COUNT = 7; // TODO: nối API - lấy số thật từ server
