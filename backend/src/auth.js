import jwt from 'jsonwebtoken';
import { getPool, sql } from './db.js';

export function signToken(user, rememberMe = false) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : (process.env.JWT_EXPIRES_IN || '8h'),
    issuer: 'quanlybankhoahoc-api',
    audience: 'quanlybankhoahoc-admin',
  });
}

export async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Vui lòng đăng nhập.' } });
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'quanlybankhoahoc-api', audience: 'quanlybankhoahoc-admin',
    });
    const pool = await getPool();
    const result = await pool.request().input('id', sql.UniqueIdentifier, payload.sub)
      .query(`SELECT id, ho_ten, email, vai_tro, trang_thai FROM dbo.nguoi_dung WHERE id=@id`);
    const user = result.recordset[0];
    if (!user || user.trang_thai !== 'dang hoat dong') {
      return res.status(401).json({ error: { code: 'ACCOUNT_DISABLED', message: 'Tài khoản không hoạt động.' } });
    }
    if (user.vai_tro !== 'quan tri vien') {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Chỉ quản trị viên được truy cập.' } });
    }
    req.user = { id: user.id, name: user.ho_ten, email: user.email, role: 'admin' };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' } });
    }
    next(error);
  }
}
