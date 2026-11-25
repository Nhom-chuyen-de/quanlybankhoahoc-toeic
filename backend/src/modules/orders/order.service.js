import { mockDatabase } from '../../config/db.js';

export const orderService = {
  // Kiểm tra mã giảm giá
  async validateCoupon(code, amount) {
    if (!code) throw new Error('Vui lòng nhập mã giảm giá');

    const coupon = mockDatabase.coupons.find(
      (c) => c.ma.toUpperCase() === code.toUpperCase().trim() && c.trangThai === 'active'
    );

    if (!coupon) throw new Error('Mã giảm giá không tồn tại hoặc đã hết hạn');

    if (amount < coupon.donToiThieu) {
      throw new Error(`Đơn hàng phải từ ${coupon.donToiThieu.toLocaleString('vi-VN')} ₫ để áp dụng mã này`);
    }

    if (coupon.soLuotConLai <= 0) {
      throw new Error('Mã giảm giá đã hết lượt sử dụng');
    }

    let discountAmount = 0;
    if (coupon.loai === 'percent') {
      discountAmount = Math.round((amount * coupon.giaTri) / 100);
      if (coupon.giamToiDa && discountAmount > coupon.giamToiDa) {
        discountAmount = coupon.giamToiDa;
      }
    } else {
      discountAmount = coupon.giaTri;
    }

    return {
      couponId: coupon.id,
      code: coupon.ma,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount),
    };
  },

  // Tạo đơn hàng mua khóa học
  async checkout(userId, { courseId, couponCode, paymentMethod }) {
    const course = mockDatabase.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Không tìm thấy khóa học để thanh toán');

    // Kiểm tra học viên đã mua khóa học này chưa
    const alreadyEnrolled = mockDatabase.enrollments.some(
      (e) => e.hocVienId === userId && e.khoaHocId === courseId && e.trangThai === 'active'
    );
    if (alreadyEnrolled) throw new Error('Bạn đã đăng ký khóa học này trước đó rồi');

    let discountAmount = 0;
    if (couponCode) {
      const couponCheck = await this.validateCoupon(couponCode, course.gia);
      discountAmount = couponCheck.discountAmount;
    }

    const finalAmount = Math.max(0, course.gia - discountAmount);

    const newOrder = {
      id: 'ORD' + Date.now().toString().slice(-6),
      hocVienId: userId,
      khoaHocId: course.id,
      khoaHocTen: course.tieuDe,
      tongGoc: course.gia,
      giamGia: discountAmount,
      tongTien: finalAmount,
      phuongThuc: paymentMethod || 'momo',
      trangThai: 'paid', // Tự động thanh toán thành công trong môi trường dev/demo
      ngayTao: new Date(),
    };

    mockDatabase.orders.push(newOrder);

    // Tự động kích hoạt ghi danh học viên
    const enrollment = {
      id: 'ENR_' + Date.now().toString(36),
      hocVienId: userId,
      khoaHocId: course.id,
      ngayDangKy: new Date(),
      trangThai: 'active',
    };
    mockDatabase.enrollments.push(enrollment);

    return {
      order: newOrder,
      enrollment,
      message: 'Thanh toán thành công! Khóa học đã được mở khóa vào tài khoản của bạn.',
    };
  },

  // Khởi tạo thanh toán bằng Mã QR (VietQR / MoMo)
  async initQRPayment(userId, { courseId, couponCode, paymentMethod = 'vietqr' }) {
    const course = mockDatabase.courses.find((c) => c.id === courseId);
    if (!course) throw new Error('Không tìm thấy khóa học để thanh toán');

    const alreadyEnrolled = mockDatabase.enrollments.some(
      (e) => e.hocVienId === userId && e.khoaHocId === courseId && e.trangThai === 'active'
    );
    if (alreadyEnrolled) throw new Error('Bạn đã đăng ký khóa học này trước đó');

    let discountAmount = 0;
    if (couponCode) {
      const couponCheck = await this.validateCoupon(couponCode, course.gia);
      discountAmount = couponCheck.discountAmount;
    }

    const finalAmount = Math.max(0, course.gia - discountAmount);
    const orderId = 'ORD' + Date.now().toString().slice(-6);

    const bankId = 'MB'; // Ngân hàng Quân Đội MBBank
    const bankName = 'MBBank (Ngân hàng Quân Đội)';
    const accountNo = '0988888999';
    const accountName = 'TRUNG TAM DAO TAO TOEIC MASTER';
    const transferContent = `TOEIC ${orderId}`;

    // Sinh mã VietQR động theo chuẩn Napas 24/7
    const qrImageUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${finalAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

    const newOrder = {
      id: orderId,
      hocVienId: userId,
      khoaHocId: course.id,
      khoaHocTen: course.tieuDe,
      tongGoc: course.gia,
      giamGia: discountAmount,
      tongTien: finalAmount,
      phuongThuc: paymentMethod, // 'vietqr' | 'momo'
      trangThai: 'pending', // Chờ thanh toán qua quét mã
      ngayTao: new Date(),
    };

    mockDatabase.orders.push(newOrder);

    return {
      order: newOrder,
      paymentInfo: {
        method: paymentMethod,
        bankName,
        accountNo,
        accountName,
        amount: finalAmount,
        transferContent,
        qrImageUrl,
      },
    };
  },

  // Xác nhận đã thanh toán mã QR (Người dùng bấm xác nhận hoặc webhook giả lập)
  async confirmQRPayment(userId, orderId) {
    const order = mockDatabase.orders.find((o) => o.id === orderId && o.hocVienId === userId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.trangThai === 'paid') {
      return { success: true, message: 'Đơn hàng này đã được thanh toán', order };
    }

    order.trangThai = 'paid';
    order.ngayThanhToan = new Date();

    // Kích hoạt khóa học cho học viên
    const enrollment = {
      id: 'ENR_' + Date.now().toString(36),
      hocVienId: userId,
      khoaHocId: order.khoaHocId,
      ngayDangKy: new Date(),
      trangThai: 'active',
    };
    mockDatabase.enrollments.push(enrollment);

    return {
      success: true,
      message: 'Xác nhận thanh toán thành công! Khóa học đã được kích hoạt ngay lập tức.',
      order,
      enrollment,
    };
  },

  // Lịch sử đơn hàng của tôi
  async getMyOrders(userId) {
    return mockDatabase.orders.filter((o) => o.hocVienId === userId);
  },

  // Yêu cầu hoàn tiền
  async requestRefund(userId, orderId, { lyDo, soTaiKhoan, nganHang }) {
    const order = mockDatabase.orders.find((o) => o.id === orderId && o.hocVienId === userId);
    if (!order) throw new Error('Không tìm thấy đơn hàng cần hoàn tiền');

    if (order.trangThai === 'refunded') {
      throw new Error('Đơn hàng này đã được hoàn tiền trước đó');
    }

    order.trangThai = 'refund_pending';
    return {
      orderId,
      status: 'pending',
      lyDo,
      message: 'Yêu cầu hoàn tiền của bạn đã được tiếp nhận và đang chờ phòng đào tạo duyệt.',
    };
  },
};
