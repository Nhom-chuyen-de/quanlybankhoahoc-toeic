import { Router } from 'express';
import { examController } from './exam.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/quizzes/:id', examController.getQuiz);
router.post('/quizzes/:id/submit', examController.submitQuiz);
router.get('/my-scores', examController.getMyScores);

export default router;
