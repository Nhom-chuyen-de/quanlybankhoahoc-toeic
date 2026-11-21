// components/shared/StatusBadge.jsx
import Badge from '../ui/Badge';

// Map trạng thái từ DB sang Badge với nhãn tiếng Việt
// TODO: nối API - Đảm bảo các key khớp với giá trị thật từ DB

const statusMap = {
  // Người dùng
  active: { label: 'Đang hoạt động', color: 'green' },
  inactive: { label: 'Ngừng hoạt động', color: 'gray' },
  banned: { label: 'Bị khóa', color: 'red' },
  deleted: { label: 'Đã xóa', color: 'slate' },
  pending: { label: 'Chờ xác minh', color: 'yellow' },

  // Khóa học
  draft: { label: 'Bản nháp', color: 'gray' },
  pending_review: { label: 'Chờ duyệt', color: 'yellow' },
  published: { label: 'Đã xuất bản', color: 'green' },
  archived: { label: 'Lưu trữ', color: 'slate' },
  rejected: { label: 'Từ chối', color: 'red' },

  // Lớp học
  upcoming: { label: 'Sắp diễn ra', color: 'blue' },
  ongoing: { label: 'Đang diễn ra', color: 'green' },
  completed: { label: 'Đã hoàn thành', color: 'gray' },
  cancelled: { label: 'Đã hủy', color: 'red' },

  // Đơn hàng & Giao dịch
  pending: { label: 'Chờ xử lý', color: 'yellow' },
  paid: { label: 'Đã thanh toán', color: 'green' },
  success: { label: 'Thành công', color: 'green' },
  failed: { label: 'Thất bại', color: 'red' },
  cancelled: { label: 'Đã hủy', color: 'gray' },
  partial_refunded: { label: 'Hoàn tiền 1 phần', color: 'orange' },
  refunded: { label: 'Đã hoàn tiền', color: 'purple' },

  // Hoàn tiền
  approved: { label: 'Đã chấp nhận', color: 'blue' },
  rejected: { label: 'Từ chối', color: 'red' },
  processing: { label: 'Đang xử lý', color: 'blue' },

  // Mã giảm giá
  expired: { label: 'Hết hạn', color: 'gray' },
  disabled: { label: 'Đã tắt', color: 'red' },

  // Hỗ trợ
  open: { label: 'Mở', color: 'yellow' },
  in_progress: { label: 'Đang xử lý', color: 'blue' },
  resolved: { label: 'Đã giải quyết', color: 'green' },
  closed: { label: 'Đã đóng', color: 'gray' },

  // Chứng chỉ
  issued: { label: 'Đã cấp', color: 'green' },
  revoked: { label: 'Thu hồi', color: 'red' },
};

const roleMap = {
  admin: { label: 'Quản trị viên', color: 'indigo' },
  teacher: { label: 'Giảng viên', color: 'blue' },
  student: { label: 'Học viên', color: 'teal' },
  staff: { label: 'Nhân viên', color: 'purple' },
};

export function StatusBadge({ status, size }) {
  const cfg = statusMap[status] ?? { label: status ?? '—', color: 'gray' };
  return <Badge color={cfg.color} size={size}>{cfg.label}</Badge>;
}

export function RoleBadge({ role, size }) {
  const cfg = roleMap[role] ?? { label: role ?? '—', color: 'gray' };
  return <Badge color={cfg.color} size={size}>{cfg.label}</Badge>;
}

export default StatusBadge;
