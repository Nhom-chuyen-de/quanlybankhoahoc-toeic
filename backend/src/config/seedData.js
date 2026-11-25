import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../constants/roles.js';

export async function initSeedData(mockDb) {
  const defaultPasswordHash = await bcrypt.hash('12345678@', 10);

  // 1. Người dùng mẫu
  mockDb.users = [
    {
      id: 'USR001',
      hoTen: 'Bùi Văn Nam',
      email: 'admin@toeic.vn',
      matKhauHash: defaultPasswordHash,
      soDienThoai: '0988888999',
      vaiTro: ROLES.ADMIN,
      trangThai: USER_STATUS.ACTIVE,
      anhDaiDien: null,
      ngayTao: new Date('2024-01-10'),
    },
    {
      id: 'USR002',
      hoTen: 'ThS. Trần Thị Mai Phương',
      email: 'teacher@toeic.vn',
      matKhauHash: defaultPasswordHash,
      soDienThoai: '0912345678',
      vaiTro: ROLES.TEACHER,
      trangThai: USER_STATUS.ACTIVE,
      anhDaiDien: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop',
      ngayTao: new Date('2024-03-20'),
    },
    {
      id: 'USR004',
      hoTen: 'Phạm Minh Đức',
      email: 'student@toeic.vn',
      matKhauHash: defaultPasswordHash,
      soDienThoai: '0934567890',
      vaiTro: ROLES.STUDENT,
      trangThai: USER_STATUS.ACTIVE,
      anhDaiDien: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
      gender: 'Nam',
      dob: '2002-04-14',
      address: 'Quận Hai Bà Trưng, Hà Nội',
      ngayTao: new Date('2024-02-15'),
    },
  ];

  // 2. Khóa học mẫu
  mockDb.courses = [
    {
      id: 'CRS001',
      maKhoaHoc: 'TOEIC-650-SPEED',
      tieuDe: 'TOEIC 650+ Listening & Reading Cấp tốc',
      moTa: 'Lộ trình tối ưu hóa điểm số trong 60 ngày với các mẹo giải đề ETS thực chiến chuẩn format 2026.',
      gia: 1450000,
      giaGoc: 1950000,
      hinhAnh: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=340&fit=crop',
      danhMuc: 'TOEIC',
      trinhDo: 'Trung cấp (650+)',
      hinhThuc: 'Tự học có hướng dẫn',
      giangVien: 'ThS. Trần Thị Mai Phương',
      tongSoBaiHoc: 32,
      thoiLuongGio: 48,
      danhGiaTrungBinh: 4.9,
      soLuongHocVien: 1250,
      trangThai: 'published',
    },
    {
      id: 'CRS002',
      maKhoaHoc: 'IELTS-70-INTENSIVE',
      tieuDe: 'IELTS Intensive 7.0+ Toàn Diện 4 Kỹ Năng',
      moTa: 'Chuyên sâu Speaking & Writing Task 1-2, phương pháp Brainstorming luận điểm và sửa bài chi tiết.',
      gia: 3200000,
      giaGoc: 4500000,
      hinhAnh: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=340&fit=crop',
      danhMuc: 'IELTS',
      trinhDo: 'Nâng cao (7.0+)',
      hinhThuc: 'Có lớp trực tuyến',
      giangVien: 'TS. Lê Hoàng Nam',
      tongSoBaiHoc: 45,
      thoiLuongGio: 60,
      danhGiaTrungBinh: 4.8,
      soLuongHocVien: 820,
      trangThai: 'published',
    },
    {
      id: 'CRS003',
      maKhoaHoc: 'TOEIC-BASE-500',
      tieuDe: 'TOEIC 500+ Lấy lại nền tảng ngữ pháp & từ vựng',
      moTa: 'Dành cho người mất gốc tiếng Anh, trang bị 1000 từ vựng cốt lõi và 20 chủ điểm ngữ pháp ETS.',
      gia: 950000,
      giaGoc: 1400000,
      hinhAnh: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600&h=340&fit=crop',
      danhMuc: 'TOEIC',
      trinhDo: 'Cơ bản (500+)',
      hinhThuc: 'Tự học',
      giangVien: 'ThS. Trần Thị Mai Phương',
      tongSoBaiHoc: 28,
      thoiLuongGio: 36,
      danhGiaTrungBinh: 4.7,
      soLuongHocVien: 2100,
      trangThai: 'published',
    },
  ];

  // 3. Chương & Bài học mẫu cho CRS001
  mockDb.chapters = [
    {
      id: 'CHP001',
      khoaHocId: 'CRS001',
      tieuDe: 'Chương 1: Chiến thuật xử lý TOEIC Listening Part 1 & Part 2',
      thuTu: 1,
      lessons: [
        {
          id: 'LES001',
          tieuDe: 'Bài 1: Phân tích bẫy tranh mô tả người và vật trong Part 1',
          thoiLuong: '25 phút',
          loai: 'video',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          taiLieu: [
            { id: 'DOC001', tieuDe: 'Ebook tổng hợp 100 cụm từ dễ bẫy Part 1.pdf', url: '#' },
          ],
        },
        {
          id: 'LES002',
          tieuDe: 'Bài 2: Kỹ năng nhận diện câu hỏi Who/Where/When trong Part 2',
          thoiLuong: '30 phút',
          loai: 'video',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
          taiLieu: [],
        },
        {
          id: 'LES003',
          tieuDe: 'Bài 3: Thực hành Quiz trắc nghiệm 20 câu Part 1 & Part 2',
          thoiLuong: '20 phút',
          loai: 'quiz',
          quizId: 'QZ001',
        },
      ],
    },
    {
      id: 'CHP002',
      khoaHocId: 'CRS001',
      tieuDe: 'Chương 2: Ngữ pháp trọng điểm & Kỹ năng Đọc hiểu Part 5 & 6',
      thuTu: 2,
      lessons: [
        {
          id: 'LES004',
          tieuDe: 'Bài 4: Mệnh đề quan hệ & Rút gọn mệnh đề quan hệ',
          thoiLuong: '35 phút',
          loai: 'video',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          taiLieu: [],
        },
        {
          id: 'LES005',
          tieuDe: 'Bài 5: Bí quyết làm nhanh Part 5 trong 15 giây mỗi câu',
          thoiLuong: '40 phút',
          loai: 'video',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
          taiLieu: [],
        },
      ],
    },
  ];

  // 4. Bài Quiz mẫu (QZ001)
  mockDb.quizzes = [
    {
      id: 'QZ001',
      tieuDe: 'Quiz kiểm tra tốc độ phản xạ Part 1 & 2',
      thoiGianPhut: 15,
      questions: [
        {
          id: 'QS01',
          cauHoi: 'Look at the picture. Which statement best describes the picture?',
          amThanh: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          hinhAnh: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&h=300&fit=crop',
          luaChon: [
            { id: 'A', noiDung: '(A) They are discussing in the conference room.' },
            { id: 'B', noiDung: '(B) The woman is turning off the projector.' },
            { id: 'C', noiDung: '(C) All chairs are empty around the table.' },
            { id: 'D', noiDung: '(D) They are leaving the office building.' },
          ],
          dapAnDung: 'A',
          giaiThich: 'Trong tranh mọi người đang ngồi họp và thảo luận trong phòng hội nghị, nên (A) là đáp án chính xác nhất.',
        },
        {
          id: 'QS02',
          cauHoi: 'Where did you put the financial report for Q3?',
          amThanh: null,
          hinhAnh: null,
          luaChon: [
            { id: 'A', noiDung: '(A) Yes, I finished it yesterday.' },
            { id: 'B', noiDung: '(B) On Mr. David\'s desk in the manager room.' },
            { id: 'C', noiDung: '(C) No, about 50 pages.' },
            { id: 'D', noiDung: '(D) At 3:00 PM tomorrow.' },
          ],
          dapAnDung: 'B',
          giaiThich: 'Câu hỏi Where hỏi về vị trí, đáp án (B) chỉ nơi chốn "On Mr. David\'s desk".',
        },
      ],
    },
  ];

  // 5. Đăng ký khóa học của học viên mẫu (USR004)
  mockDb.enrollments = [
    {
      id: 'ENR001',
      hocVienId: 'USR004',
      khoaHocId: 'CRS001',
      ngayDangKy: new Date('2024-02-16'),
      trangThai: 'active',
    },
  ];

  // Tiến độ học của USR004
  mockDb.progress = [
    { id: 'PRG001', hocVienId: 'USR004', khoaHocId: 'CRS001', baiHocId: 'LES001', daHoanThanh: true, ngayHoanThanh: new Date() },
  ];

  // 6. Lớp học & Thời khóa biểu mẫu
  mockDb.classes = [
    {
      id: 'CLS01',
      maLop: 'TOEIC-K24',
      tenKhoaHoc: 'TOEIC 650+ Listening & Reading Cấp tốc',
      giangVien: 'ThS. Trần Thị Mai Phương',
      lichHoc: 'T2 - T4 - T6 (19:30 - 21:00)',
      phongHocOnline: 'https://meet.google.com/toeic-k24-master',
      ngayKhaiGiang: '2026-10-01',
      trangThai: 'ongoing',
      siSo: '45/50',
    },
  ];

  mockDb.schedules = [
    {
      id: 'SCH01',
      lopHocId: 'CLS01',
      ngayHoc: 'Thứ Tư, 25/11/2026',
      gioHoc: '19:30 - 21:00',
      chuDe: 'Luyện đề Part 3 Conversation & Skimming câu hỏi',
      linkPhongHoc: 'https://meet.google.com/toeic-k24-master',
      trangThai: 'sap_dien_ra',
    },
  ];

  mockDb.attendances = [
    { id: 'ATT01', hocVienId: 'USR004', lopHocId: 'CLS01', buoiHoc: 'Buổi 1 (15/10/2026)', coMat: true },
    { id: 'ATT02', hocVienId: 'USR004', lopHocId: 'CLS01', buoiHoc: 'Buổi 2 (17/10/2026)', coMat: true },
    { id: 'ATT03', hocVienId: 'USR004', lopHocId: 'CLS01', buoiHoc: 'Buổi 3 (20/10/2026)', coMat: true },
  ];

  // 7. Mã giảm giá
  mockDb.coupons = [
    {
      id: 'CP01',
      ma: 'TOEIC2026',
      loai: 'percent',
      giaTri: 15, // 15%
      giamToiDa: 300000,
      donToiThieu: 1000000,
      soLuotConLai: 50,
      trangThai: 'active',
    },
    {
      id: 'CP02',
      ma: 'GIAM100K',
      loai: 'fixed',
      giaTri: 100000,
      donToiThieu: 500000,
      soLuotConLai: 100,
      trangThai: 'active',
    },
  ];

  // 8. Đơn hàng mẫu
  mockDb.orders = [
    {
      id: 'ORD26001',
      hocVienId: 'USR004',
      khoaHocId: 'CRS001',
      khoaHocTen: 'TOEIC 650+ Listening & Reading Cấp tốc',
      tongTien: 1450000,
      phuongThuc: 'momo',
      trangThai: 'paid',
      ngayTao: new Date('2024-02-16 09:20'),
    },
  ];

  // 9. Chứng chỉ mẫu
  mockDb.certificates = [
    {
      id: 'cert-1',
      maChungChi: 'CERT-2026-8891',
      hocVienId: 'USR004',
      tenKhoaHoc: 'TOEIC 650+ Chinh phục mục tiêu',
      ngayCap: '15/10/2026',
      ngayHetHan: '15/10/2028',
      diemSo: '725/990',
      xepLoai: 'Xuất sắc',
      trangThai: 'valid',
    },
  ];

  // 10. Thông báo học viên
  mockDb.notifications = [
    {
      id: 'NTF001',
      hocVienId: 'USR004',
      tieuDe: 'Lịch học lớp TOEIC-K24 tối nay lúc 19:30',
      noiDung: 'Buổi học thứ 12: Chữa bài thi Reading Part 5 sẽ diễn ra trực tuyến qua Google Meet lúc 19:30.',
      thoiGian: 'Hôm nay lúc 14:00',
      daDoc: false,
    },
  ];

  console.log('[Seed] Dữ liệu mẫu ban đầu đã sẵn sàng cho Authentication, Courses, Learning, Orders, Quizzes.');
}
