import { userService } from './user.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const userController = {
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.id);
      return apiSuccess(res, profile, 'Thông tin cá nhân');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updated = await userService.updateProfile(req.user.id, req.body);
      return apiSuccess(res, updated, 'Cập nhật thông tin thành công');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async changePassword(req, res, next) {
    try {
      await userService.changePassword(req.user.id, req.body);
      return apiSuccess(res, null, 'Đổi mật khẩu thành công');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },
};
