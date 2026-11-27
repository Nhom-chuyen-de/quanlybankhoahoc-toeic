// backend/src/modules/orders/order.service.js
import prisma from '../../config/prisma.js';

export const orderService = {
  // 1. Kiểm tra mã giảm giá
  async validateCoupon(code, amount) {
    if (!code) throw new Error('Vui lòng nhập mã giảm giá');

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new Error('Mã giảm giá không tồn tại hoặc đã hết hạn');
    }

    if (coupon.validTo && new Date() > coupon.validTo) {
      throw new Error('Mã giảm giá đã hết hạn sử dụng');
    }

    if (coupon.minOrderAmount && amount < Number(coupon.minOrderAmount)) {
      throw new Error(`Đơn hàng phải từ ${Number(coupon.minOrderAmount).toLocaleString('vi-VN')} ₫ để áp dụng mã này`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    let discountAmount = 0;
    if (coupon.discountRate) {
      discountAmount = Math.round((amount * coupon.discountRate) / 100);
    } else {
      discountAmount = Number(coupon.discountAmount);
    }

    return {
      couponId: coupon.id,
      code: coupon.code,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
    };
  },

  // 2. Tạo đơn hàng thanh toán khóa học
  async checkout(userId, { courseId, couponCode, paymentMethod = 'VNPAY' }) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new Error('Không tìm thấy khóa học để thanh toán');

    const existingEnrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: userId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error('Bạn đã đăng ký khóa học này trước đó rồi');
    }

    const price = Number(course.price);
    let discountAmount = 0;

    if (couponCode) {
      const couponCheck = await this.validateCoupon(couponCode, price);
      discountAmount = couponCheck.discountAmount;
    }

    const finalAmount = Math.max(0, price - discountAmount);
    const orderCode = 'ORD-' + Date.now();

    const order = await prisma.order.create({
      data: {
        code: orderCode,
        studentId: userId,
        courseId,
        amount: price,
        discountAmount,
        finalAmount,
        couponCode: couponCode ? couponCode.trim().toUpperCase() : null,
        paymentMethod: paymentMethod.toUpperCase(),
        status: finalAmount === 0 ? 'PAID' : 'PENDING',
        paidAt: finalAmount === 0 ? new Date() : null,
      },
    });

    if (finalAmount === 0) {
      await prisma.courseEnrollment.create({
        data: {
          courseId,
          studentId: userId,
        },
      });
    }

    return {
      orderId: order.id,
      orderCode: order.code,
      amount: price,
      discountAmount,
      finalAmount,
      status: order.status.toLowerCase(),
      paymentMethod: order.paymentMethod,
    };
  },

  // 3. Khởi tạo thanh toán Mã QR
  async initQRPayment(userId, { courseId, couponCode, paymentMethod = 'VIETQR' }) {
    const checkoutOrder = await this.checkout(userId, {
      courseId,
      couponCode,
      paymentMethod,
    });

    const bankId = 'TPB';
    const accountNo = '0988888999';
    const accountName = 'TRUNG TAM DAO TAO TOEIC MASTER';
    const transferContent = `TOEIC ${checkoutOrder.orderCode}`;
    const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${checkoutOrder.finalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    return {
      order: checkoutOrder,
      paymentInfo: {
        method: paymentMethod,
        bankName: 'TPBank',
        accountNo,
        accountName,
        amount: checkoutOrder.finalAmount,
        transferContent,
        qrImageUrl,
      },
    };
  },

  // 4. Xác nhận thanh toán Mã QR
  async confirmQRPayment(userId, orderId) {
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { code: orderId }],
        studentId: userId,
      },
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId: order.courseId,
          studentId: userId,
        },
      },
      update: {},
      create: {
        courseId: order.courseId,
        studentId: userId,
      },
    });

    return {
      order: updatedOrder,
      enrollment,
    };
  },

  // 5. Lịch sử đơn hàng của tôi
  async getMyOrders(userId) {
    const orders = await prisma.order.findMany({
      where: { studentId: userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      maDonHang: o.code,
      khoaHoc: {
        id: o.course.id,
        tieuDe: o.course.title,
        hinhAnh: o.course.thumbnail,
      },
      tongTien: Number(o.amount),
      giamGia: Number(o.discountAmount),
      thanhTien: Number(o.finalAmount),
      phuongThucThanhToan: o.paymentMethod,
      trangThai: o.status.toLowerCase(),
      ngayTao: o.createdAt,
      ngayThanhToan: o.paidAt,
    }));
  },

  // 6. Gửi yêu cầu hoàn tiền
  async requestRefund(userId, orderId, { reason, lyDo }) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        studentId: userId,
      },
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng cần hoàn tiền');

    return prisma.refund.create({
      data: {
        orderId: order.id,
        studentId: userId,
        amount: order.finalAmount,
        reason: reason || lyDo || 'Yêu cầu hoàn học phí',
        status: 'PENDING',
      },
    });
  },
};
