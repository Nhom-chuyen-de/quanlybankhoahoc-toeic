// backend/src/modules/admin/admin.routes.js
import { Router } from 'express';
import { adminController } from './admin.controller.js';

const router = Router();

// Trong môi trường dev, cho phép truy cập linh hoạt hoặc xác thực token
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/courses', adminController.getCourses);
router.get('/orders', adminController.getOrders);

export default router;
