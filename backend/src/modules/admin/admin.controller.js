// backend/src/modules/admin/admin.controller.js
import { adminService } from './admin.service.js';
import { apiSuccess } from '../../utils/response.js';

export const adminController = {
  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboardStats();
      return apiSuccess(res, data, 'Lấy dữ liệu Dashboard quản trị thành công');
    } catch (error) {
      next(error);
    }
  },

  async getUsers(req, res, next) {
    try {
      const { role, status, search, page, limit } = req.query;
      const data = await adminService.getUsers({ role, status, search, page, limit });
      return apiSuccess(res, data, 'Lấy danh sách người dùng thành công');
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const newUser = await adminService.createUser(req.body);
      return apiSuccess(res, newUser, 'Tạo người dùng thành công', 201);
    } catch (error) {
      next(error);
    }
  },

  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedUser = await adminService.updateUserStatus(id, status);
      return apiSuccess(res, updatedUser, 'Cập nhật trạng thái người dùng thành công');
    } catch (error) {
      next(error);
    }
  },

  async getCourses(req, res, next) {
    try {
      const courses = await adminService.getCourses(req.query);
      return apiSuccess(res, courses, 'Lấy danh sách khóa học thành công');
    } catch (error) {
      next(error);
    }
  },

  async getOrders(req, res, next) {
    try {
      const orders = await adminService.getOrders();
      return apiSuccess(res, orders, 'Lấy danh sách đơn hàng thành công');
    } catch (error) {
      next(error);
    }
  },
};
