import { Router } from 'express';
import { learningController } from './learning.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Khóa học & bài giảng
router.get('/my-courses', learningController.getMyCourses);
router.get('/courses/:courseId/curriculum', learningController.getCourseLessons);
router.get('/courses/:courseId/lessons/:lessonId', learningController.getLessonDetail);
router.post('/courses/:courseId/lessons/:lessonId/complete', learningController.completeLesson);

// Lớp học & Điểm danh
router.get('/my-classes', learningController.getMyClasses);
router.get('/schedules', learningController.getMySchedules);
router.get('/attendance', learningController.getMyAttendance);

export default router;
