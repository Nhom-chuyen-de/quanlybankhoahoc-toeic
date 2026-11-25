import { orderService } from './order.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const orderController = {
  async validateCoupon(req, res, next) {
    try {
      const { code, amount } = req.body;
      const result = await orderService.validateCoupon(code, amount);
      return apiSuccess(res, result, 'Mã giảm giá hợp lệ');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async checkout(req, res, next) {
    try {
      const result = await orderService.checkout(req.user.id, req.body);
      return apiSuccess(res, result, 'Đặt hàng thành công', 201);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async initQRPayment(req, res, next) {
    try {
      const result = await orderService.initQRPayment(req.user.id, req.body);
      return apiSuccess(res, result, 'Khởi tạo thông tin mã QR thanh toán thành công', 200);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async confirmQRPayment(req, res, next) {
    try {
      const result = await orderService.confirmQRPayment(req.user.id, req.params.orderId);
      return apiSuccess(res, result, 'Xác nhận thanh toán thành công', 200);
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyOrders(req, res, next) {
    try {
      const orders = await orderService.getMyOrders(req.user.id);
      return apiSuccess(res, orders, 'Lịch sử mua hàng');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async requestRefund(req, res, next) {
    try {
      const result = await orderService.requestRefund(req.user.id, req.params.id, req.body);
      return apiSuccess(res, result, 'Gửi yêu cầu hoàn tiền thành công');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },
};
