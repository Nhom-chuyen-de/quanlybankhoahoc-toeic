import { apiError } from '../utils/response.js';

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return apiError(res, 'Chưa xác thực người dùng', 401);
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.vaiTro)) {
      return apiError(
        res,
        `Bạn không có quyền truy cập chức năng này (Yêu cầu vai trò: ${allowedRoles.join(', ')})`,
        403
      );
    }

    next();
  };
}
