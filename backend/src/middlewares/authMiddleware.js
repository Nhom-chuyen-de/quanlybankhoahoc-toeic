import { verifyToken } from '../utils/jwt.js';
import { apiError } from '../utils/response.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return apiError(res, 'Vui lòng đăng nhập để tiếp tục (Thiếu Token xác thực)', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    req.user = decoded; // { id, email, vaiTro, hoTen }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return apiError(res, 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', 401);
    }
    return apiError(res, 'Token xác thực không hợp lệ', 401);
  }
}
