// mock/orders.js
// TODO: nối API - Thay thế bằng dữ liệu thật từ endpoint /api/admin/orders

export const mockOrders = [
  { id: 'ORD2024001', userId: 'USR001', userName: 'Nguyễn Văn An', courseId: 'CRS001', courseName: 'TOEIC 600+ – Luyện thi cấp tốc', amount: 1200000, discount: 0, finalAmount: 1200000, paymentMethod: 'momo', status: 'paid', createdAt: '2024-12-21 09:15' },
  { id: 'ORD2024002', userId: 'USR003', userName: 'Lê Minh Châu', courseId: 'CRS002', courseName: 'IELTS 6.5 – Chiến lược làm bài thi', amount: 1800000, discount: 0, finalAmount: 1800000, paymentMethod: 'vnpay', status: 'pending', createdAt: '2024-12-21 10:30' },
  { id: 'ORD2024003', userId: 'USR004', userName: 'Phạm Đức Dũng', courseId: 'CRS001', courseName: 'TOEIC 600+ – Luyện thi cấp tốc', amount: 1200000, discount: 120000, finalAmount: 1080000, paymentMethod: 'bank_transfer', status: 'paid', createdAt: '2024-12-20 14:00' },
  { id: 'ORD2024004', userId: 'USR005', userName: 'Hoàng Thu Hà', courseId: 'CRS005', courseName: 'Tiếng Anh giao tiếp công sở', amount: 900000, discount: 0, finalAmount: 900000, paymentMethod: 'momo', status: 'failed', createdAt: '2024-12-20 16:45' },
  { id: 'ORD2024005', userId: 'USR006', userName: 'Vũ Thành Long', courseId: 'CRS004', courseName: 'IELTS Writing Task 2', amount: 650000, discount: 0, finalAmount: 650000, paymentMethod: 'zalopay', status: 'refunded', createdAt: '2024-12-19 11:20' },
];

export const mockOrderStats = {
  total: 2847,
  paid: 2456,
  pending: 234,
  failed: 89,
  refunded: 68,
  totalRevenue: 1284600000,
};
