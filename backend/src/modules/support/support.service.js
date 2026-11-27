// backend/src/modules/support/support.service.js
import prisma from '../../config/prisma.js';

export const supportService = {
  // 1. Lấy danh sách thông báo của học viên
  async getNotifications(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // 2. Đánh dấu thông báo đã đọc
  async markNotificationRead(userId, notifId) {
    return prisma.notification.updateMany({
      where: { id: notifId, userId },
      data: { isRead: true },
    });
  },

  // 3. Gửi ticket hỗ trợ
  async createTicket(userId, { subject, message, tieuDe, noiDung, requestType = 'Hỗ trợ tài khoản & khóa học' }) {
    const finalSubject = subject || tieuDe;
    const finalMessage = message || noiDung;

    if (!finalSubject || !finalMessage) {
      throw new Error('Vui lòng nhập đầy đủ tiêu đề và nội dung cần hỗ trợ');
    }

    return prisma.supportTicket.create({
      data: {
        studentId: userId,
        subject: finalSubject.trim(),
        message: finalMessage.trim(),
        requestType,
        status: 'OPEN',
      },
    });
  },

  // 4. Lấy danh sách ticket của học viên
  async getMyTickets(userId) {
    return prisma.supportTicket.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  // 5. Lấy danh sách chứng chỉ của học viên
  async getMyCertificates(userId) {
    return prisma.certificate.findMany({
      where: { studentId: userId },
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { issueDate: 'desc' },
    });
  },

  // 6. Gửi đánh giá khóa học
  async reviewCourse(userId, courseId, { rating, comment, diemSo, binhLuan }) {
    const score = Number(rating || diemSo || 5);
    if (score < 1 || score > 5) {
      throw new Error('Điểm đánh giá phải từ 1 đến 5 sao');
    }

    return prisma.review.create({
      data: {
        studentId: userId,
        courseId,
        rating: score,
        comment: comment || binhLuan || '',
      },
    });
  },
};
