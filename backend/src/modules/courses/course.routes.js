import { Router } from 'express';
import { courseController } from './course.controller.js';

const router = Router();

// Public routes cho học viên xem danh sách và chi tiết
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);

export default router;
