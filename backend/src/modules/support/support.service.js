import { mockDatabase } from '../../config/db.js';

export const supportService = {
  // Lấy thông báo cho học viên
  async getNotifications(userId) {
    return mockDatabase.notifications.filter((n) => n.hocVienId === userId);
  },

  // Đánh dấu thông báo đã đọc
  async markNotificationRead(userId, notifId) {
    const notif = mockDatabase.notifications.find((n) => n.id === notifId && n.hocVienId === userId);
    if (notif) notif.daDoc = true;
    return { success: true };
  },

  // Tạo yêu cầu hỗ trợ mới (Support ticket)
  async createTicket(userId, { tieuDe, noiDung, mucDoUuTien }) {
    if (!tieuDe || !noiDung) {
      throw new Error('Vui lòng nhập tiêu đề và nội dung cần hỗ trợ');
    }

    const ticket = {
      id: 'TCK' + Date.now().toString().slice(-6),
      hocVienId: userId,
      tieuDe,
      noiDung,
      mucDoUuTien: mucDoUuTien || 'medium',
      trangThai: 'open',
      ngayTao: new Date(),
    };

    mockDatabase.supportTickets.push(ticket);
    return ticket;
  },

  // Xem các yêu cầu hỗ trợ của học viên
  async getMyTickets(userId) {
    return mockDatabase.supportTickets.filter((t) => t.hocVienId === userId);
  },

  // Xem danh sách chứng chỉ
  async getMyCertificates(userId) {
    return mockDatabase.certificates.filter((c) => c.hocVienId === userId);
  },

  // Gửi đánh giá khóa học
  async reviewCourse(userId, courseId, { diemSo, binhLuan }) {
    if (!diemSo || diemSo < 1 || diemSo > 5) {
      throw new Error('Điểm đánh giá phải từ 1 đến 5 sao');
    }

    const review = {
      id: 'REV_' + Date.now().toString(36),
      hocVienId: userId,
      khoaHocId: courseId,
      diemSo,
      binhLuan,
      ngayTao: new Date(),
    };

    mockDatabase.reviews.push(review);
    return review;
  },
};
