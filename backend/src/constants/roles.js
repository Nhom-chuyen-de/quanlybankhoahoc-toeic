// Đồng bộ tuyệt đối với Database và Frontend
export const ROLES = {
  ADMIN: 'quan tri vien',
  TEACHER: 'giang vien',
  STUDENT: 'hoc vien',
};

export const USER_STATUS = {
  ACTIVE: 'dang hoat dong',
  INACTIVE: 'ngung hoat dong',
  BANNED: 'bi khoa',
  DELETED: 'da xoa',
};

export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};
