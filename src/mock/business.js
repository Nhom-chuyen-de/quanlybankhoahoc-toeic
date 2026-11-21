// src/mock/business.js
// Mock data toàn diện cho nhóm Kinh doanh: Đơn hàng, Thanh toán, Hoàn tiền, Mã giảm giá (Năm 2026)

// ─── 1. CỔNG THANH TOÁN (PAYMENT GATEWAYS) ──────────────────────────────────
export const mockPaymentGateways = [
  {
    id: 'GW_VNPAY',
    name: 'VNPay QR & ATM',
    code: 'vnpay',
    feePercent: 1.5,
    isActive: true,
    description: 'Cổng thanh toán quét mã VNPAY-QR và thẻ ATM nội địa / Internet Banking',
    logo: 'https://vnpay.vn/assets/images/logo-vnpay.svg',
    transactionCount: 1420,
  },
  {
    id: 'GW_MOMO',
    name: 'Ví điện tử MoMo',
    code: 'momo',
    feePercent: 1.8,
    isActive: true,
    description: 'Thanh toán trực tiếp qua ứng dụng Ví MoMo bằng App-to-App hoặc QR Code',
    logo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
    transactionCount: 2150,
  },
  {
    id: 'GW_VIETQR',
    name: 'Chuyển khoản VietQR (Ngân hàng)',
    code: 'vietqr',
    feePercent: 0.0,
    isActive: true,
    description: 'Chuyển khoản trực tiếp tới tài khoản ngân hàng trung tâm (Miễn phí cổng)',
    logo: 'https://vietqr.net/img/logo-vietqr.png',
    transactionCount: 890,
  },
  {
    id: 'GW_ZALOPAY',
    name: 'Ví điện tử ZaloPay',
    code: 'zalopay',
    feePercent: 1.6,
    isActive: false,
    description: 'Cổng thanh toán tích hợp qua ví ZaloPay và ứng dụng Zalo chat',
    logo: 'https://zalopay.vn/images/logo.svg',
    transactionCount: 420,
  },
  {
    id: 'GW_VISA',
    name: 'Thẻ Quốc tế (Visa / Mastercard)',
    code: 'credit_card',
    feePercent: 2.5,
    isActive: true,
    description: 'Cổng thanh toán thẻ tín dụng và ghi nợ quốc tế Visa, Mastercard, JCB',
    logo: 'https://cdn-icons-png.flaticon.com/512/179/179457.png',
    transactionCount: 610,
  },
];

// ─── 2. DANH SÁCH ĐƠN HÀNG (ORDERS) ─────────────────────────────────────────
export const mockOrdersList = [
  {
    id: 'ORD26001',
    user: 'Nguyễn Văn An',
    userEmail: 'an.nguyen@toeicmaster.edu.vn',
    userPhone: '0901234567',
    couponCode: 'TOEIC20',
    totalAmount: 1450000,
    discountAmount: 290000,
    finalAmount: 1160000,
    status: 'paid', // đã thanh toán
    createdAt: '31/10/2026 16:45',
    invoice: {
      number: 'HD2610-001',
      issuedAt: '31/10/2026 16:50',
      issuer: 'Bùi Văn Nam',
    },
    items: [
      { id: 'ITM01', courseName: 'TOEIC 650+ Listening & Reading Cấp tốc', unitPrice: 1450000, quantity: 1, amount: 1450000 },
    ],
    payments: [
      {
        id: 'PAY2610-01',
        gateway: 'Ví điện tử MoMo',
        gatewayCode: 'momo',
        transactionCode: 'MOMO99182301',
        amount: 1160000,
        time: '31/10/2026 16:47',
        status: 'success',
        confirmedBy: 'Tự động',
      },
    ],
  },
  {
    id: 'ORD26002',
    user: 'Lê Minh Châu',
    userEmail: 'le.minh.chau@email.com',
    userPhone: '0923456789',
    couponCode: null,
    totalAmount: 2800000,
    discountAmount: 0,
    finalAmount: 2800000,
    status: 'pending', // chờ thanh toán
    createdAt: '31/10/2026 15:20',
    invoice: null,
    items: [
      { id: 'ITM02', courseName: 'IELTS Speaking Masterclass Band 7.5+', unitPrice: 2800000, quantity: 1, amount: 2800000 },
    ],
    // Mock 2 mốc thanh toán: mốc 1 thất bại, mốc 2 chờ xử lý (mới nhất ở trên)
    payments: [
      {
        id: 'PAY2610-02',
        gateway: 'VNPay QR & ATM',
        gatewayCode: 'vnpay',
        transactionCode: 'VNP142981023',
        amount: 2800000,
        time: '31/10/2026 15:21',
        status: 'pending', // chờ xử lý -> có nút xác nhận thủ công
        confirmedBy: null,
      },
      {
        id: 'PAY2610-02A',
        gateway: 'VNPay QR & ATM',
        gatewayCode: 'vnpay',
        transactionCode: 'VNP142981001',
        amount: 2800000,
        time: '31/10/2026 15:12',
        status: 'failed', // thất bại
        confirmedBy: 'Tự động',
      },
    ],
  },
  {
    id: 'ORD26003',
    user: 'Trần Thị Mai Phương',
    userEmail: 'phuong.tran@email.com',
    userPhone: '0912345678',
    couponCode: 'GIAM100K',
    totalAmount: 1200000,
    discountAmount: 100000,
    finalAmount: 1100000,
    status: 'paid', // đã thanh toán nhưng CHƯA có hóa đơn
    createdAt: '31/10/2026 14:10',
    invoice: null, // Đã thanh toán và chưa có hóa đơn -> có nút "Xuất hóa đơn"
    items: [
      { id: 'ITM03', courseName: 'Luyện thi TOEIC Cấp tốc 30 ngày', unitPrice: 1200000, quantity: 1, amount: 1200000 },
    ],
    payments: [
      {
        id: 'PAY2610-03',
        gateway: 'Chuyển khoản VietQR',
        gatewayCode: 'vietqr',
        transactionCode: 'VQR88291039',
        amount: 1100000,
        time: '31/10/2026 14:15',
        status: 'success',
        confirmedBy: 'Nguyễn Văn An',
      },
    ],
  },
  {
    id: 'ORD26004',
    user: 'Hoàng Thu Hà',
    userEmail: 'hoang.thu.ha@email.com',
    userPhone: '0945678901',
    couponCode: null,
    totalAmount: 1850000,
    discountAmount: 0,
    finalAmount: 1850000,
    status: 'failed', // thất bại
    createdAt: '31/10/2026 11:35',
    invoice: null,
    items: [
      { id: 'ITM04', courseName: 'Tiếng Anh Giao tiếp Công sở & Đàm phán', unitPrice: 1850000, quantity: 1, amount: 1850000 },
    ],
    payments: [
      {
        id: 'PAY2610-04',
        gateway: 'Ví điện tử MoMo',
        gatewayCode: 'momo',
        transactionCode: 'MOMO88301923',
        amount: 1850000,
        time: '31/10/2026 11:36',
        status: 'failed',
        confirmedBy: 'Tự động',
      },
    ],
  },
  {
    id: 'ORD26005',
    user: 'Đặng Quốc Bảo',
    userEmail: 'bao.dang@gmail.com',
    userPhone: '0967890123',
    couponCode: 'COMBO2026',
    totalAmount: 3650000,
    discountAmount: 500000,
    finalAmount: 3150000,
    status: 'partial_refunded', // hoàn tiền một phần (đã có hóa đơn từ trước)
    createdAt: '30/10/2026 20:50',
    invoice: {
      number: 'HD2610-005',
      issuedAt: '30/10/2026 21:00',
      issuer: 'Bùi Văn Nam',
    },
    items: [
      { id: 'ITM05', courseName: 'TOEIC 650+ Listening & Reading Cấp tốc', unitPrice: 1450000, quantity: 1, amount: 1450000 },
      { id: 'ITM06', courseName: 'Chuyên đề IELTS Writing Task 1 & 2', unitPrice: 2200000, quantity: 1, amount: 2200000 },
    ],
    payments: [
      {
        id: 'PAY2610-05',
        gateway: 'VNPay QR & ATM',
        gatewayCode: 'vnpay',
        transactionCode: 'VNP142980998',
        amount: 3150000,
        time: '30/10/2026 20:52',
        status: 'success',
        confirmedBy: 'Tự động',
      },
    ],
  },
  {
    id: 'ORD26006',
    user: 'Vũ Hải Đăng',
    userEmail: 'dang.vu@fpt.edu.vn',
    userPhone: '0956789012',
    couponCode: null,
    totalAmount: 1450000,
    discountAmount: 0,
    finalAmount: 1450000,
    status: 'refunded', // đã hoàn tiền
    createdAt: '29/10/2026 09:15',
    invoice: null,
    items: [
      { id: 'ITM07', courseName: 'TOEIC 650+ Listening & Reading Cấp tốc', unitPrice: 1450000, quantity: 1, amount: 1450000 },
    ],
    payments: [
      {
        id: 'PAY2610-06',
        gateway: 'Chuyển khoản VietQR',
        gatewayCode: 'vietqr',
        transactionCode: 'VQR88290911',
        amount: 1450000,
        time: '29/10/2026 09:18',
        status: 'success',
        confirmedBy: 'Phan Thanh Bình',
      },
    ],
  },
  {
    id: 'ORD26007',
    user: 'Đỗ Thu Trang',
    userEmail: 'trang.dothu@gmail.com',
    userPhone: '0945678901',
    couponCode: 'IELTSVIP',
    totalAmount: 2800000,
    discountAmount: 280000,
    finalAmount: 2520000,
    status: 'paid', // đã thanh toán
    createdAt: '28/10/2026 14:00',
    invoice: {
      number: 'HD2610-007',
      issuedAt: '28/10/2026 14:10',
      issuer: 'Bùi Văn Nam',
    },
    items: [
      { id: 'ITM08', courseName: 'IELTS Speaking Masterclass Band 7.5+', unitPrice: 2800000, quantity: 1, amount: 2800000 },
    ],
    payments: [
      {
        id: 'PAY2610-07',
        gateway: 'Thẻ Quốc tế (Visa / Mastercard)',
        gatewayCode: 'credit_card',
        transactionCode: 'VISA44019283',
        amount: 2520000,
        time: '28/10/2026 14:03',
        status: 'success',
        confirmedBy: 'Tự động',
      },
    ],
  },
  {
    id: 'ORD26008',
    user: 'Bùi Quốc Huy',
    userEmail: 'huy.bui@toeicmaster.edu.vn',
    userPhone: '0978901234',
    couponCode: null,
    totalAmount: 890000,
    discountAmount: 0,
    finalAmount: 890000,
    status: 'cancelled', // đã hủy
    createdAt: '27/10/2026 18:30',
    invoice: null,
    items: [
      { id: 'ITM09', courseName: 'TOEIC Lấy lại Căn bản cho Người mất gốc', unitPrice: 890000, quantity: 1, amount: 890000 },
    ],
    payments: [
      {
        id: 'PAY2610-08',
        gateway: 'Ví điện tử ZaloPay',
        gatewayCode: 'zalopay',
        transactionCode: 'ZLP77192019',
        amount: 890000,
        time: '27/10/2026 18:32',
        status: 'cancelled',
        confirmedBy: null,
      },
    ],
  },
  {
    id: 'ORD26009',
    user: 'Bùi Thế Vinh',
    userEmail: 'vinh.bui@gmail.com',
    userPhone: '0981234567',
    couponCode: null,
    totalAmount: 750000,
    discountAmount: 0,
    finalAmount: 750000,
    status: 'pending', // chờ thanh toán
    createdAt: '26/10/2026 10:15',
    invoice: null,
    items: [
      { id: 'ITM10', courseName: 'Gói Luyện đề Online Chấm điểm AI Tự động', unitPrice: 750000, quantity: 1, amount: 750000 },
    ],
    payments: [], // Chưa có giao dịch nào -> Hiện EmptyState "Chưa có giao dịch thanh toán"
  },
];

// ─── 3. DANH SÁCH GIAO DỊCH THANH TOÁN (PAYMENTS) ───────────────────────────
// Cột "Admin xác nhận": Chỉ hiện họ tên admin hoặc "Tự động"
export const mockPaymentsList = [
  {
    id: 'PAY2610-01',
    orderId: 'ORD26001',
    gateway: 'Ví điện tử MoMo',
    gatewayCode: 'momo',
    amount: 1160000,
    gatewayTransId: 'MOMO99182301',
    status: 'success', // thành công
    time: '31/10/2026 16:47',
    confirmedBy: 'Tự động',
    user: 'Nguyễn Văn An',
  },
  {
    id: 'PAY2610-02',
    orderId: 'ORD26002',
    gateway: 'VNPay QR & ATM',
    gatewayCode: 'vnpay',
    amount: 2800000,
    gatewayTransId: 'VNP142981023',
    status: 'pending', // chờ xử lý
    time: '31/10/2026 15:21',
    confirmedBy: '—',
    user: 'Lê Minh Châu',
  },
  {
    id: 'PAY2610-02A',
    orderId: 'ORD26002',
    gateway: 'VNPay QR & ATM',
    gatewayCode: 'vnpay',
    amount: 2800000,
    gatewayTransId: 'VNP142981001',
    status: 'failed', // thất bại
    time: '31/10/2026 15:12',
    confirmedBy: 'Tự động',
    user: 'Lê Minh Châu',
  },
  {
    id: 'PAY2610-03',
    orderId: 'ORD26003',
    gateway: 'Chuyển khoản VietQR',
    gatewayCode: 'vietqr',
    amount: 1100000,
    gatewayTransId: 'VQR88291039',
    status: 'success', // thành công
    time: '31/10/2026 14:15',
    confirmedBy: 'Nguyễn Văn An',
    user: 'Trần Thị Mai Phương',
  },
  {
    id: 'PAY2610-04',
    orderId: 'ORD26004',
    gateway: 'Ví điện tử MoMo',
    gatewayCode: 'momo',
    amount: 1850000,
    gatewayTransId: 'MOMO88301923',
    status: 'failed', // thất bại
    time: '31/10/2026 11:36',
    confirmedBy: '—',
    user: 'Hoàng Thu Hà',
  },
  {
    id: 'PAY2610-05',
    orderId: 'ORD26005',
    gateway: 'VNPay QR & ATM',
    gatewayCode: 'vnpay',
    amount: 3150000,
    gatewayTransId: 'VNP142980998',
    status: 'success', // thành công
    time: '30/10/2026 20:52',
    confirmedBy: 'Tự động',
    user: 'Đặng Quốc Bảo',
  },
  {
    id: 'PAY2610-06',
    orderId: 'ORD26006',
    gateway: 'Chuyển khoản VietQR',
    gatewayCode: 'vietqr',
    amount: 1450000,
    gatewayTransId: 'VQR88290911',
    status: 'success', // thành công
    time: '29/10/2026 09:18',
    confirmedBy: 'Phan Thanh Bình',
    user: 'Vũ Hải Đăng',
  },
  {
    id: 'PAY2610-07',
    orderId: 'ORD26007',
    gateway: 'Thẻ Quốc tế (Visa / Mastercard)',
    gatewayCode: 'credit_card',
    amount: 2520000,
    gatewayTransId: 'VISA44019283',
    status: 'success', // thành công
    time: '28/10/2026 14:03',
    confirmedBy: 'Tự động',
    user: 'Đỗ Thu Trang',
  },
  {
    id: 'PAY2610-08',
    orderId: 'ORD26008',
    gateway: 'Ví điện tử ZaloPay',
    gatewayCode: 'zalopay',
    amount: 890000,
    gatewayTransId: 'ZLP77192019',
    status: 'cancelled', // hủy
    time: '27/10/2026 18:32',
    confirmedBy: '—',
    user: 'Bùi Quốc Huy',
  },
];

// ─── 4. YÊU CẦU HOÀN TIỀN (REFUNDS) ──────────────────────────────────────────
// Yêu cầu: Mỗi yêu cầu gắn với 1 thanh toán "Thành công", tên học viên & mã đơn khớp trang Đơn hàng
// Không thêm trường lý do từ chối
export const mockRefundsList = [
  {
    id: 'REF2610-01',
    user: 'Đỗ Thu Trang',
    userEmail: 'trang.dothu@gmail.com',
    paymentId: 'PAY2610-07', // Thành công
    orderId: 'ORD26007',
    courseName: 'IELTS Speaking Masterclass Band 7.5+',
    reason: 'Đã đăng ký nhầm lớp ban ngày, xin hoàn phí để chuyển sang lớp ca tối',
    refundAmount: 2520000,
    status: 'pending', // chờ xử lý
    requestDate: '31/10/2026 15:30',
    processedDate: '—',
    bankAccount: 'Ngân hàng Techcombank • STK: 19034567890 • Chủ TK: DO THU TRANG',
    adminNote: 'Đang liên hệ học viên tư vấn chuyển lớp hoặc hoàn tiền',
  },
  {
    id: 'REF2610-02',
    user: 'Vũ Hải Đăng',
    userEmail: 'dang.vu@fpt.edu.vn',
    paymentId: 'PAY2610-06', // Thành công
    orderId: 'ORD26006',
    courseName: 'TOEIC 650+ Listening & Reading Cấp tốc',
    reason: 'Trùng lịch thực tập tốt nghiệp đại học, không thể sắp xếp tham gia lớp học buổi tối',
    refundAmount: 1450000,
    status: 'refunded', // đã hoàn tiền
    requestDate: '29/10/2026 10:00',
    processedDate: '30/10/2026 09:30',
    bankAccount: 'Ngân hàng Vietcombank • STK: 0011004567890 • Chủ TK: VU HAI DANG',
    adminNote: 'Đã hoàn tiền 100% qua lệnh chuyển khoản ngân hàng',
  },
  {
    id: 'REF2610-03',
    user: 'Đặng Quốc Bảo',
    userEmail: 'bao.dang@gmail.com',
    paymentId: 'PAY2610-05', // Thành công
    orderId: 'ORD26005',
    courseName: 'Chuyên đề IELTS Writing Task 1 & 2',
    reason: 'Mua nhầm combo khóa học, xin hủy 1 khóa Writing và giữ lại khóa TOEIC',
    refundAmount: 1400000,
    status: 'approved', // đã chấp nhận
    requestDate: '30/10/2026 21:10',
    processedDate: '31/10/2026 08:45',
    bankAccount: 'Ngân hàng MB Bank • STK: 0987654321 • Chủ TK: DANG QUOC BAO',
    adminNote: 'Đã duyệt yêu cầu hoàn một phần, kế toán sẽ thực hiện chuyển tiền trong 24h',
  },
  {
    id: 'REF2610-04',
    user: 'Trần Thị Mai Phương',
    userEmail: 'phuong.tran@email.com',
    paymentId: 'PAY2610-03', // Thành công
    orderId: 'ORD26003',
    courseName: 'Luyện thi TOEIC Cấp tốc 30 ngày',
    reason: 'Đã học được hơn 80% khóa học và yêu cầu hoàn tiền do bận việc cá nhân',
    refundAmount: 1100000,
    status: 'rejected', // từ chối
    requestDate: '25/10/2026 14:00',
    processedDate: '26/10/2026 10:15',
    bankAccount: 'Ngân hàng VPBank • STK: 123456789 • Chủ TK: TRAN THI MAI PHUONG',
    adminNote: 'Từ chối do vi phạm chính sách hoàn tiền: Đã học vượt quá 30% thời lượng khóa học.',
  },
];

// ─── 5. MÃ GIẢM GIÁ (COUPONS) ────────────────────────────────────────────────
export const mockCouponsList = [
  {
    id: 'CPN01',
    code: 'TOEIC20',
    type: 'percentage', // phần trăm
    value: 20, // 20%
    startDate: '01/10/2026 00:00',
    endDate: '30/11/2026 23:59',
    usedCount: 45,
    maxUsage: 100,
    applicableCourse: 'TOEIC 650+ Listening & Reading Cấp tốc',
    isActive: true,
  },
  {
    id: 'CPN02',
    code: 'GIAM100K',
    type: 'fixed', // tiền mặt
    value: 100000, // 100.000 ₫
    startDate: '15/10/2026 00:00',
    endDate: '31/12/2026 23:59',
    usedCount: 78,
    maxUsage: 200,
    applicableCourse: 'Tất cả khóa học',
    isActive: true,
  },
  {
    id: 'CPN03',
    code: 'IELTSVIP',
    type: 'percentage',
    value: 10,
    startDate: '01/09/2026 00:00',
    endDate: '15/12/2026 23:59',
    usedCount: 15,
    maxUsage: 50,
    applicableCourse: 'IELTS Speaking Masterclass Band 7.5+',
    isActive: true,
  },
  {
    id: 'CPN04',
    code: 'COMBO2026',
    type: 'fixed',
    value: 500000,
    startDate: '01/10/2026 00:00',
    endDate: '15/11/2026 23:59',
    usedCount: 30,
    maxUsage: 30, // Đã hết lượt
    applicableCourse: 'Tất cả khóa học',
    isActive: false,
  },
  {
    id: 'CPN05',
    code: 'TRIENKHAI',
    type: 'percentage',
    value: 15,
    startDate: '01/10/2026 00:00',
    endDate: '31/12/2026 23:59',
    usedCount: 0, // Chưa dùng -> có nút Xóa để kiểm tra
    maxUsage: null, // Không giới hạn
    applicableCourse: 'Tất cả khóa học',
    isActive: true,
  },
];
