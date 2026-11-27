import { Router } from 'express';
import { orderController } from './order.controller.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/coupons/validate', orderController.validateCoupon);
router.post('/checkout', orderController.checkout);
router.post('/qr-init', orderController.initQRPayment);
router.post('/:orderId/qr-confirm', orderController.confirmQRPayment);
router.get('/my-orders', orderController.getMyOrders);
router.post('/:id/refund', orderController.requestRefund);

export default router;
