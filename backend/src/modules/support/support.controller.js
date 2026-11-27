import { supportService } from './support.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const supportController = {
  async getNotifications(req, res) {
    try {
      const data = await supportService.getNotifications(req.user.id);
      return apiSuccess(res, data, 'Danh sách thông báo');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async markNotificationRead(req, res) {
    try {
      const result = await supportService.markNotificationRead(req.user.id, req.params.id);
      return apiSuccess(res, result, 'Đã cập nhật trạng thái đã đọc');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async createTicket(req, res) {
    try {
      const ticket = await supportService.createTicket(req.user.id, req.body);
      return apiSuccess(res, ticket, 'Gửi yêu cầu hỗ trợ thành công', 201);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyTickets(req, res) {
    try {
      const tickets = await supportService.getMyTickets(req.user.id);
      return apiSuccess(res, tickets, 'Danh sách yêu cầu hỗ trợ');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyCertificates(req, res) {
    try {
      const certs = await supportService.getMyCertificates(req.user.id);
      return apiSuccess(res, certs, 'Danh sách chứng chỉ');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async reviewCourse(req, res) {
    try {
      const review = await supportService.reviewCourse(req.user.id, req.params.courseId, req.body);
      return apiSuccess(res, review, 'Gửi đánh giá khóa học thành công', 201);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },
};
