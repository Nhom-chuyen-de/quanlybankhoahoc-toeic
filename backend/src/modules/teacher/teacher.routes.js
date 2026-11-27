// backend/src/modules/teacher/teacher.routes.js
import { Router } from 'express';
import { teacherController } from './teacher.controller.js';

const router = Router();

router.get('/dashboard', teacherController.getDashboard);
router.get('/submissions', teacherController.getSubmissions);
router.post('/submissions/:id/grade', teacherController.gradeSubmission);

export default router;
