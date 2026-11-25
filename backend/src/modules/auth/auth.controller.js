import { authService } from './auth.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return apiSuccess(res, result, 'Đăng ký tài khoản thành công', 201);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return apiSuccess(res, result, 'Đăng nhập thành công', 200);
    } catch (error) {
      return apiError(res, error.message, 401);
    }
  },

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return apiSuccess(res, result, 'Đã gửi hướng dẫn khôi phục mật khẩu', 200);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async googleLogin(req, res, next) {
    try {
      const result = await authService.googleLogin(req.body);
      return apiSuccess(res, result, 'Đăng nhập Google thành công', 200);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.id);
      return apiSuccess(res, user, 'Thông tin tài khoản xác thực', 200);
    } catch (error) {
      return apiError(res, error.message, 404);
    }
  },
};
