import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import adminRoutes from './adminRoutes.js';
import extendedRoutes from './extendedRoutes.js';
import { authenticate } from './auth.js';
import { getPool } from './db.js';

const app = express();
const port = Number(process.env.PORT || 4000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a random value of at least 32 characters.');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim()), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get(['/', '/health', '/api/health'], async (_req, res) => {
  try {
    await getPool();
    res.json({ status: 'ok', database: 'connected', message: 'Admin API đang hoạt động bình thường' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: error.code || 'DB_CONNECTION_ERROR',
      message: error.message || 'Không thể kết nối tới cơ sở dữ liệu SQL Server.'
    });
  }
});
app.use('/api/admin/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }));
app.use('/api/admin', (req, res, next) => {
  if (req.path === '/auth/login') return next();
  return authenticate(req, res, next);
});
app.use('/api/admin', extendedRoutes);
app.use('/api/admin', adminRoutes);
app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API không tồn tại.' } }));
app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error.number === 2627 || error.number === 2601) {
    return res.status(409).json({ error: { code: 'DUPLICATE', message: 'Dữ liệu đã tồn tại.' } });
  }
  if (error.number === 547) {
    return res.status(409).json({ error: { code: 'RELATION_CONFLICT', message: 'Không thể thực hiện do dữ liệu đang được liên kết.' } });
  }
  if (error.number === 51000) {
    return res.status(409).json({ error: { code: 'INVALID_STATE', message: 'Trạng thái nghiệp vụ không cho phép thao tác này.' } });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: { code: error.code || 'INTERNAL_ERROR', message: status >= 500 ? 'Đã xảy ra lỗi máy chủ.' : error.message } });
});

app.listen(port, () => console.log(`Admin API listening on http://localhost:${port}`));
