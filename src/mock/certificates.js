// src/mock/certificates.js
// Mock data cho Chứng chỉ và Đánh giá học viên

export const mockCertificates = [
  {
    id: 'cert-1',
    certificateNumber: 'CERT-2026-8891',
    student: {
      name: 'Nguyễn Thùy Linh',
      email: 'linh.nguyenthuy@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Khóa học TOEIC 650+ Chinh phục mục tiêu',
    courseCategory: 'TOEIC',
    issueDate: '15/10/2026',
    expiryDate: '15/10/2028',
    score: '725/990',
    grade: 'Xuất sắc',
    status: 'valid' // 'valid' | 'expired' | 'revoked'
  },
  {
    id: 'cert-2',
    certificateNumber: 'CERT-2026-8892',
    student: {
      name: 'Đặng Quốc Hưng',
      email: 'hung.dangquoc@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi IELTS Intensive 6.5 Cấp tốc',
    courseCategory: 'IELTS',
    issueDate: '20/09/2026',
    expiryDate: '20/09/2028',
    score: 'Band 7.0 Overall',
    grade: 'Giỏi',
    status: 'valid'
  },
  {
    id: 'cert-3',
    certificateNumber: 'CERT-2026-8893',
    student: {
      name: 'Lê Hoàng Phúc',
      email: 'phuc.lehoang@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'TOEIC 4 Kỹ năng Chuyên sâu',
    courseCategory: 'TOEIC',
    issueDate: '10/08/2026',
    expiryDate: '10/08/2028',
    score: '830/990',
    grade: 'Xuất sắc',
    status: 'valid'
  },
  {
    id: 'cert-4',
    certificateNumber: 'CERT-2026-8894',
    student: {
      name: 'Phạm Minh Anh',
      email: 'anh.phamminh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'IELTS Master 7.5+ Bứt phá điểm số',
    courseCategory: 'IELTS',
    issueDate: '05/06/2026',
    expiryDate: '05/06/2028',
    score: 'Band 7.5 Overall',
    grade: 'Xuất sắc',
    status: 'valid'
  },
  {
    id: 'cert-5',
    certificateNumber: 'CERT-2024-5510',
    student: {
      name: 'Trịnh Đức Tuấn',
      email: 'tuan.trinhduc@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'TOEIC Listening & Reading Căn bản 450+',
    courseCategory: 'TOEIC',
    issueDate: '12/04/2024',
    expiryDate: '12/04/2026',
    score: '580/990',
    grade: 'Khá',
    status: 'expired'
  },
  {
    id: 'cert-6',
    certificateNumber: 'CERT-2026-8895',
    student: {
      name: 'Cao Thu Hà',
      email: 'ha.caothu@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Ngữ pháp & Từ vựng TOEIC Thực chiến',
    courseCategory: 'TOEIC',
    issueDate: '02/10/2026',
    expiryDate: '02/10/2028',
    score: '92/100',
    grade: 'Xuất sắc',
    status: 'valid'
  },
  {
    id: 'cert-7',
    certificateNumber: 'CERT-2026-8896',
    student: {
      name: 'Lương Gia Bảo',
      email: 'bao.luonggia@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'IELTS Speaking & Writing Nâng cao',
    courseCategory: 'IELTS',
    issueDate: '15/07/2026',
    expiryDate: '15/07/2028',
    score: 'Band 7.0',
    grade: 'Giỏi',
    status: 'revoked'
  },
  {
    id: 'cert-8',
    certificateNumber: 'CERT-2026-8897',
    student: {
      name: 'Vũ Khánh Huyền',
      email: 'huyen.vukhanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'TOEIC Cấp tốc 550+ trong 60 ngày',
    courseCategory: 'TOEIC',
    issueDate: '01/09/2026',
    expiryDate: '01/09/2028',
    score: '670/990',
    grade: 'Khá',
    status: 'valid'
  },
  {
    id: 'cert-9',
    certificateNumber: 'CERT-2024-4211',
    student: {
      name: 'Đỗ Tiến Dũng',
      email: 'dung.dotien@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi TOEIC Nền tảng 450+',
    courseCategory: 'TOEIC',
    issueDate: '18/05/2024',
    expiryDate: '18/05/2026',
    score: '520/990',
    grade: 'Đạt',
    status: 'expired'
  },
  {
    id: 'cert-10',
    certificateNumber: 'CERT-2026-8898',
    student: {
      name: 'Nguyễn Thanh Thảo',
      email: 'thao.nguyenthanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Khóa học TOEIC 650+ Chinh phục mục tiêu',
    courseCategory: 'TOEIC',
    issueDate: '25/08/2026',
    expiryDate: '25/08/2028',
    score: '780/990',
    grade: 'Giỏi',
    status: 'valid'
  },
  {
    id: 'cert-11',
    certificateNumber: 'CERT-2026-8899',
    student: {
      name: 'Hoàng Nhật Minh',
      email: 'minh.hoangnhat@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Tiếng Anh giao tiếp công sở chuyên nghiệp',
    courseCategory: 'Tiếng Anh',
    issueDate: '30/09/2026',
    expiryDate: '30/09/2028',
    score: 'A+ (95/100)',
    grade: 'Xuất sắc',
    status: 'valid'
  },
  {
    id: 'cert-12',
    certificateNumber: 'CERT-2026-8900',
    student: {
      name: 'Dương Mỹ Duyên',
      email: 'duyen.duongmy@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi IELTS Intensive 6.5 Cấp tốc',
    courseCategory: 'IELTS',
    issueDate: '18/10/2026',
    expiryDate: '18/10/2028',
    score: 'Band 6.5 Overall',
    grade: 'Đạt',
    status: 'valid'
  }
];

// Danh sách đăng ký khóa học đã hoàn thành để cấp chứng chỉ thủ công
export const mockCompletedEnrollments = [
  {
    id: 'enr-1',
    studentName: 'Nguyễn Thùy Linh',
    studentEmail: 'linh.nguyenthuy@toeic.vn',
    studentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    courseName: 'Khóa học TOEIC 650+ Chinh phục mục tiêu',
    courseCategory: 'TOEIC',
    completedDate: '30/10/2026',
    score: '750/990',
    grade: 'Xuất sắc'
  },
  {
    id: 'enr-2',
    studentName: 'Đặng Quốc Hưng',
    studentEmail: 'hung.dangquoc@toeic.vn',
    studentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    courseName: 'Luyện thi IELTS Intensive 6.5 Cấp tốc',
    courseCategory: 'IELTS',
    completedDate: '28/10/2026',
    score: 'Band 7.0',
    grade: 'Giỏi'
  },
  {
    id: 'enr-3',
    studentName: 'Lê Hoàng Phúc',
    studentEmail: 'phuc.lehoang@toeic.vn',
    studentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    courseName: 'TOEIC 4 Kỹ năng Chuyên sâu',
    courseCategory: 'TOEIC',
    completedDate: '26/10/2026',
    score: '840/990',
    grade: 'Xuất sắc'
  },
  {
    id: 'enr-4',
    studentName: 'Phạm Minh Anh',
    studentEmail: 'anh.phamminh@toeic.vn',
    studentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
    courseName: 'IELTS Master 7.5+ Bứt phá điểm số',
    courseCategory: 'IELTS',
    completedDate: '25/10/2026',
    score: 'Band 7.5',
    grade: 'Xuất sắc'
  },
  {
    id: 'enr-5',
    studentName: 'Cao Thu Hà',
    studentEmail: 'ha.caothu@toeic.vn',
    studentAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    courseName: 'Ngữ pháp & Từ vựng TOEIC Thực chiến',
    courseCategory: 'TOEIC',
    completedDate: '22/10/2026',
    score: '95/100',
    grade: 'Xuất sắc'
  }
];

// Mock đánh giá khóa học từ học viên
export const mockReviews = [
  {
    id: 'rev-1',
    student: {
      name: 'Nguyễn Thùy Linh',
      email: 'linh.nguyenthuy@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Khóa học TOEIC 650+ Chinh phục mục tiêu',
    rating: 5,
    comment: 'Giáo trình rất bài bản, phương pháp dạy nghe Part 3 và Part 4 cực kỳ dễ áp dụng. Mình đã thi được 725 điểm vượt kỳ vọng ban đầu!',
    date: '20/10/2026'
  },
  {
    id: 'rev-2',
    student: {
      name: 'Đặng Quốc Hưng',
      email: 'hung.dangquoc@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi IELTS Intensive 6.5 Cấp tốc',
    rating: 5,
    comment: 'Cô giáo sửa bài Writing cực kỳ chi tiết, chỉ ra từng lỗi dùng từ và ngữ pháp. Lớp học tương tác vui vẻ, nhiều tài liệu sát đề thi thật.',
    date: '18/10/2026'
  },
  {
    id: 'rev-3',
    student: {
      name: 'Lê Hoàng Phúc',
      email: 'phuc.lehoang@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'TOEIC 4 Kỹ năng Chuyên sâu',
    rating: 4,
    comment: 'Khóa học chất lượng cao, bài tập phong phú. Điểm trừ nhỏ là phần Speaking đôi lúc app chấm âm giọng hơi khắt khe quá mức.',
    date: '15/10/2026'
  },
  {
    id: 'rev-4',
    student: {
      name: 'Phạm Minh Anh',
      email: 'anh.phamminh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'IELTS Master 7.5+ Bứt phá điểm số',
    rating: 5,
    comment: 'Các chiến thuật làm bài Reading Matching Headings đỉnh cao. Mình tăng từ 6.5 lên 7.5 sau 2 tháng học tập nghiêm túc.',
    date: '10/10/2026'
  },
  {
    id: 'rev-5',
    student: {
      name: 'Cao Thu Hà',
      email: 'ha.caothu@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Ngữ pháp & Từ vựng TOEIC Thực chiến',
    rating: 4,
    comment: 'Kiến thức tóm tắt cô đọng theo mindmap dễ nhớ, làm đề phản xạ nhanh hơn nhiều. Rất phù hợp cho người mất gốc.',
    date: '05/10/2026'
  },
  {
    id: 'rev-6',
    student: {
      name: 'Vũ Khánh Huyền',
      email: 'huyen.vukhanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'TOEIC Cấp tốc 550+ trong 60 ngày',
    rating: 5,
    comment: 'Kho đề thi thử cập nhật sát format 2026, làm xong có giải thích chi tiết từng câu. Quá xứng đáng với giá tiền.',
    date: '28/09/2026'
  },
  {
    id: 'rev-7',
    student: {
      name: 'Đỗ Tiến Dũng',
      email: 'dung.dotien@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi TOEIC Nền tảng 450+',
    rating: 3,
    comment: 'Nội dung cơ bản tốt, nhưng tốc độ nói của một vài video hơi nhanh đối với người mới bắt đầu.',
    date: '22/09/2026'
  },
  {
    id: 'rev-8',
    student: {
      name: 'Nguyễn Thanh Thảo',
      email: 'thao.nguyenthanh@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Khóa học TOEIC 650+ Chinh phục mục tiêu',
    rating: 5,
    comment: 'Đội ngũ hỗ trợ và trợ giảng nhiệt tình 24/7. Hỏi bài lúc 11h đêm vẫn có thầy cô giải đáp cặn kẽ.',
    date: '15/09/2026'
  },
  {
    id: 'rev-9',
    student: {
      name: 'Hoàng Nhật Minh',
      email: 'minh.hoangnhat@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Tiếng Anh giao tiếp công sở chuyên nghiệp',
    rating: 5,
    comment: 'Học xong tự tin viết email công việc và thuyết trình trước sếp nước ngoài. Khóa học cực kỳ thực tế.',
    date: '08/09/2026'
  },
  {
    id: 'rev-10',
    student: {
      name: 'Dương Mỹ Duyên',
      email: 'duyen.duongmy@toeic.vn',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces'
    },
    courseName: 'Luyện thi IELTS Intensive 6.5 Cấp tốc',
    rating: 4,
    comment: 'Lượng bài tập về nhà khá nặng nhưng rèn luyện áp lực phòng thi rất tốt. Đạt được mục tiêu đi du học.',
    date: '30/08/2026'
  }
];

export const mockRatingStats = {
  average: 4.8,
  total: 428,
  distribution: {
    5: 326,
    4: 78,
    3: 16,
    2: 5,
    1: 3
  }
};
