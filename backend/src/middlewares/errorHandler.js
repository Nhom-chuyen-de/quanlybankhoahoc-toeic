import { apiError } from '../utils/response.js';

export function errorHandler(err, req, res, _next) {
  console.error('[Error Handler]', err);
  const status = err.status || 500;
  const message = err.message || 'Lỗi máy chủ nội bộ';
  return apiError(res, message, status, process.env.NODE_ENV === 'development' ? err.stack : null);
}
