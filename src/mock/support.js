// src/mock/support.js
// Mock data cho module Hỗ trợ và Thông báo

export const mockTickets = [
  {
    id: 'TCK-1092',
    title: 'Không thể truy cập bài kiểm tra giữa kỳ lớp TOEIC 650',
    sender: {
      name: 'Nguyễn Thùy Linh',
      email: 'linh.nguyenthuy@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0912 345 678'
    },
    category: 'technical',
    categoryLabel: 'Kỹ thuật',
    priority: 'high',
    status: 'new',
    createdAt: '31/10/2026 08:30',
    updatedAt: '31/10/2026 08:30',
    messages: [
      {
        id: 'msg-1',
        sender: 'Nguyễn Thùy Linh',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
        time: '08:30 - Hôm nay',
        content: 'Em chào thầy cô, sáng nay em bấm vào làm bài kiểm tra giữa kỳ của lớp TOEIC 650+ nhưng hệ thống báo lỗi 502 Bad Gateway và không load được đề. Nhờ Admin kiểm tra hỗ trợ giúp em với ạ!'
      }
    ]
  },
  {
    id: 'TCK-1091',
    title: 'Yêu cầu hỗ trợ đổi lịch học ca tối thứ 4 sang thứ 6',
    sender: {
      name: 'Đặng Quốc Hưng',
      email: 'hung.dangquoc@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0983 456 789'
    },
    category: 'course',
    categoryLabel: 'Khóa học',
    priority: 'medium',
    status: 'in_progress',
    createdAt: '30/10/2026 19:15',
    updatedAt: '31/10/2026 09:10',
    messages: [
      {
        id: 'msg-1',
        sender: 'Đặng Quốc Hưng',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
        time: '19:15 - 30/10/2026',
        content: 'Chào ban quản trị, tuần sau em có lịch công tác đột xuất vào tối thứ 4 nên muốn xin đổi sang ca học bù lớp IELTS 6.5 tối thứ 6. Em đã xin phép giảng viên rồi ạ.'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '09:10 - Hôm nay',
        content: 'Chào bạn Hưng, phòng đào tạo đã tiếp nhận yêu cầu và kiểm tra lớp thứ 6 còn 2 slot trống. Đang chờ giáo viên phụ trách xác nhận danh sách nhé!'
      }
    ]
  },
  {
    id: 'TCK-1090',
    title: 'Quên mật khẩu và không nhận được email OTP đặt lại',
    sender: {
      name: 'Lê Hoàng Phúc',
      email: 'phuc.lehoang@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0905 123 456'
    },
    category: 'account',
    categoryLabel: 'Tài khoản',
    priority: 'high',
    status: 'in_progress',
    createdAt: '30/10/2026 14:00',
    updatedAt: '30/10/2026 15:20',
    messages: [
      {
        id: 'msg-1',
        sender: 'Lê Hoàng Phúc',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
        time: '14:00 - 30/10/2026',
        content: 'Tôi dùng chức năng quên mật khẩu nhưng đợi hơn 30 phút vẫn không nhận được mã xác thực vào email phuc.lehoang@toeic.vn. Xin hỗ trợ kích hoạt lại.'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '15:20 - 30/10/2026',
        content: 'Chào bạn Phúc, hệ thống đã kiểm tra và reset mật khẩu tạm thời gửi qua tin nhắn SMS đến số 0905 123 456 cho bạn rồi nhé.'
      }
    ]
  },
  {
    id: 'TCK-1089',
    title: 'Đã thanh toán khóa IELTS 7.0 nhưng tài khoản chưa kích hoạt',
    sender: {
      name: 'Phạm Minh Anh',
      email: 'anh.phamminh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0977 888 999'
    },
    category: 'account',
    categoryLabel: 'Tài khoản',
    priority: 'high',
    status: 'resolved',
    createdAt: '29/10/2026 10:20',
    updatedAt: '29/10/2026 11:05',
    messages: [
      {
        id: 'msg-1',
        sender: 'Phạm Minh Anh',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
        time: '10:20 - 29/10/2026',
        content: 'Em chuyển khoản VNPAY mã đơn ORD-8812 thành công lúc 10h sáng nhưng vào trang Khóa học của tôi vẫn hiển thị chưa mua. Mã giao dịch 992817 ạ.'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '11:05 - 29/10/2026',
        content: 'Chào bạn Minh Anh, cổng thanh toán VNPay bị trễ phản hồi IPN một chút. Bên mình đã đối soát thủ công và kích hoạt khóa học vào tài khoản của bạn. Chúc bạn học tốt!'
      }
    ]
  },
  {
    id: 'TCK-1088',
    title: 'Video bài giảng số 4 khóa TOEIC Listening bị giật hạt, không có âm thanh',
    sender: {
      name: 'Trịnh Đức Tuấn',
      email: 'tuan.trinhduc@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0933 654 321'
    },
    category: 'technical',
    categoryLabel: 'Kỹ thuật',
    priority: 'medium',
    status: 'closed',
    createdAt: '28/10/2026 16:40',
    updatedAt: '29/10/2026 09:00',
    messages: [
      {
        id: 'msg-1',
        sender: 'Trịnh Đức Tuấn',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
        time: '16:40 - 28/10/2026',
        content: 'Video bài 4 phần Part 1 tranh miêu tả người bị mất âm thanh từ phút thứ 05:20 trở đi. Mong ban kỹ thuật re-upload lại file âm thanh chuẩn.'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '09:00 - 29/10/2026',
        content: 'Cảm ơn phản hồi của bạn. Video đã được thay thế bằng bản Full HD kèm audio chuẩn. Yêu cầu hỗ trợ đã được đóng.'
      }
    ]
  },
  {
    id: 'TCK-1087',
    title: 'Đề xuất mở thêm lớp luyện đề TOEIC buổi sáng cuối tuần',
    sender: {
      name: 'Cao Thu Hà',
      email: 'ha.caothu@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0945 999 111'
    },
    category: 'other',
    categoryLabel: 'Khác',
    priority: 'low',
    status: 'new',
    createdAt: '28/10/2026 11:15',
    updatedAt: '28/10/2026 11:15',
    messages: [
      {
        id: 'msg-1',
        sender: 'Cao Thu Hà',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
        time: '11:15 - 28/10/2026',
        content: 'Hiện tại trung tâm chỉ có các ca tối trong tuần, nhiều bạn đi làm như em rất mong muốn trung tâm mở thêm ca sáng Thứ 7 hoặc Chủ Nhật để tiện ôn luyện.'
      }
    ]
  },
  {
    id: 'TCK-1086',
    title: 'Hỏi về việc cấp chứng chỉ bản cứng gửi về tận nhà',
    sender: {
      name: 'Lương Gia Bảo',
      email: 'bao.luonggia@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0966 222 333'
    },
    category: 'course',
    categoryLabel: 'Khóa học',
    priority: 'low',
    status: 'resolved',
    createdAt: '27/10/2026 15:50',
    updatedAt: '28/10/2026 10:00',
    messages: [
      {
        id: 'msg-1',
        sender: 'Lương Gia Bảo',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
        time: '15:50 - 27/10/2026',
        content: 'Em đã hoàn thành khóa TOEIC 750+ và nhận được chứng chỉ điện tử. Cho em hỏi trung tâm có dịch vụ in chứng chỉ cứng ép kim gửi về bưu điện không ạ?'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '10:00 - 28/10/2026',
        content: 'Chào bạn Bảo, trung tâm có hỗ trợ in chứng chỉ mộc nổi và gửi chuyển phát nhanh với mức phí 50.000đ. Bạn gửi thông tin địa chỉ cụ thể vào email admin@toeic.vn nhé.'
      }
    ]
  },
  {
    id: 'TCK-1084',
    title: 'Giao diện ứng dụng bị vỡ font tiếng Việt trên trình duyệt Safari iOS',
    sender: {
      name: 'Vũ Khánh Huyền',
      email: 'huyen.vukhanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0918 111 222'
    },
    category: 'technical',
    categoryLabel: 'Kỹ thuật',
    priority: 'medium',
    status: 'new',
    createdAt: '26/10/2026 21:00',
    updatedAt: '26/10/2026 21:00',
    messages: [
      {
        id: 'msg-1',
        sender: 'Vũ Khánh Huyền',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
        time: '21:00 - 26/10/2026',
        content: 'Khi vào làm bài thi thử trên iPad dùng Safari, một số câu hỏi phần Reading bị rớt chữ và mất các ký tự dấu tiếng Việt. Nhờ IT fix giúp ạ.'
      }
    ]
  },
  {
    id: 'TCK-1083',
    title: 'Khiếu nại về trừ tiền 2 lần khi thanh toán qua ví MoMo',
    sender: {
      name: 'Đỗ Tiến Dũng',
      email: 'dung.dotien@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0938 777 888'
    },
    category: 'account',
    categoryLabel: 'Tài khoản',
    priority: 'high',
    status: 'resolved',
    createdAt: '25/10/2026 18:20',
    updatedAt: '26/10/2026 10:15',
    messages: [
      {
        id: 'msg-1',
        sender: 'Đỗ Tiến Dũng',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
        time: '18:20 - 25/10/2026',
        content: 'Tôi mua khóa TOEIC cấp tốc 1.200.000đ qua MoMo. App ngân hàng báo trừ tiền 2 lần liên tiếp. Yêu cầu kiểm tra hoàn tiền 1 giao dịch thừa.'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '10:15 - 26/10/2026',
        content: 'Chào bạn Dũng, bộ phận quản trị đã kiểm tra lệnh thanh toán và hoàn trả 1.200.000đ vào ví MoMo của bạn sáng nay. Bạn kiểm tra lại số dư nhé!'
      }
    ]
  },
  {
    id: 'TCK-1082',
    title: 'Hỏi về thời hạn sử dụng khóa học trực tuyến',
    sender: {
      name: 'Nguyễn Thanh Thảo',
      email: 'thao.nguyenthanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
      role: 'Học viên',
      phone: '0944 555 666'
    },
    category: 'other',
    categoryLabel: 'Khác',
    priority: 'low',
    status: 'closed',
    createdAt: '24/10/2026 14:10',
    updatedAt: '24/10/2026 16:00',
    messages: [
      {
        id: 'msg-1',
        sender: 'Nguyễn Thanh Thảo',
        isUser: true,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
        time: '14:10 - 24/10/2026',
        content: 'Khóa học IELTS Speaking sau khi kích hoạt có giới hạn thời gian xem trong 6 tháng hay được truy cập trọn đời vậy ạ?'
      },
      {
        id: 'msg-2',
        sender: 'Bùi Văn Nam',
        isUser: false,
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
        time: '16:00 - 24/10/2026',
        content: 'Tất cả các khóa video học viên được truy cập trong 365 ngày kèm quyền gia hạn miễn phí nếu cam kết đạt chuẩn đầu ra bạn nhé.'
      }
    ]
  }
];

// Lịch sử thông báo đã gửi hàng loạt
export const mockBroadcastNotifications = [
  {
    id: 'NOTIF-001',
    title: 'Lịch bảo trì nâng cấp máy chủ phòng thi trực tuyến',
    content: 'Hệ thống thi thử TOEIC/IELTS sẽ bảo trì định kỳ từ 00:00 đến 03:00 sáng Thứ Hai ngày 03/11/2026. Quý học viên vui lòng lưu ý.',
    targetType: 'all',
    targetLabel: 'Tất cả người dùng',
    channel: 'In-app & Email',
    recipientCount: 2450,
    sentAt: '30/10/2026 16:00',
    sender: 'Bùi Văn Nam',
    status: 'success'
  },
  {
    id: 'NOTIF-002',
    title: 'Khai giảng lớp luyện đề TOEIC 800+ cấp tốc tháng 11',
    content: 'Thông báo mở đăng ký sớm lớp TOEIC 800+ với ưu đãi giảm 20% học phí dành riêng cho học viên đã hoàn thành khóa Foundation.',
    targetType: 'role_student',
    targetLabel: 'Tất cả học viên',
    channel: 'In-app',
    recipientCount: 1850,
    sentAt: '28/10/2026 09:30',
    sender: 'Bùi Văn Nam',
    status: 'success'
  },
  {
    id: 'NOTIF-003',
    title: 'Hướng dẫn cập nhật ngân hàng câu hỏi đề thi mới 2026',
    content: 'Gửi toàn thể giảng viên: Vui lòng xem tài liệu chuẩn hóa form trắc nghiệm và tải bộ đề Listening mới theo chuẩn ETS 2026.',
    targetType: 'role_teacher',
    targetLabel: 'Toàn bộ Giảng viên',
    channel: 'Email',
    recipientCount: 42,
    sentAt: '25/10/2026 14:00',
    sender: 'Bùi Văn Nam',
    status: 'success'
  },
  {
    id: 'NOTIF-004',
    title: 'Thay đổi phòng học trực tuyến buổi Thứ 7 lớp IELTS-K15',
    content: 'Lớp IELTS Intensive K15 chuyển sang học tại Zoom link mới phòng 2 do phòng 1 phục vụ workshop thi thử.',
    targetType: 'class',
    targetLabel: 'Lớp IELTS Intensive K15',
    channel: 'In-app & Email',
    recipientCount: 28,
    sentAt: '23/10/2026 11:20',
    sender: 'Bùi Văn Nam',
    status: 'success'
  },
  {
    id: 'NOTIF-005',
    title: 'Chúc mừng ngày Phụ nữ Việt Nam 20/10 & Tặng mã giảm 15%',
    content: 'Nhân dịp 20/10, trung tâm gửi tặng mã coupon PHUNUVN giảm 15% tất cả các khóa học IELTS trọn gói cho toàn thể học viên.',
    targetType: 'all',
    targetLabel: 'Tất cả người dùng',
    channel: 'In-app & Email',
    recipientCount: 2380,
    sentAt: '20/10/2026 08:00',
    sender: 'Bùi Văn Nam',
    status: 'success'
  }
];
