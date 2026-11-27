import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middlewares/errorHandler.js';

// Import modules
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/user/user.routes.js';
import courseRoutes from './modules/courses/course.routes.js';
import learningRoutes from './modules/learning/learning.routes.js';
import examRoutes from './modules/exams/exam.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import supportRoutes from './modules/support/support.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import teacherRoutes from './modules/teacher/teacher.routes.js';

const app = express();

// Middlewares cơ bản
app.use(cors({
  origin: '*', // Trong môi trường dev cho phép React Frontend gọi linh hoạt
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TOEIC/IELTS Backend User API',
  });
});

// Mount các Module API phân hệ User / Học viên / Giảng viên / Admin
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/support', supportRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/teacher', teacherRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
