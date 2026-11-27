import { Router } from 'express';
import { supportController } from './support.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Notifications
router.get('/notifications', supportController.getNotifications);
router.patch('/notifications/:id/read', supportController.markNotificationRead);

// Support tickets
router.post('/tickets', supportController.createTicket);
router.get('/my-tickets', supportController.getMyTickets);

// Certificates
router.get('/my-certificates', supportController.getMyCertificates);

// Reviews
router.post('/courses/:courseId/reviews', supportController.reviewCourse);

export default router;
