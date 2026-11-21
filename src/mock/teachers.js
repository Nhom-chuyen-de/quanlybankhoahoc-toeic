// src/mock/teachers.js
// Nguồn dữ liệu Giảng viên hệ thống - Đồng bộ với mock/users.js và mock/courses.js
// Trạng thái dùng đúng 3 giá trị: active (Đang hoạt động), inactive (Ngừng hoạt động), banned (Bị khóa)

export const mockTeachers = [
  {
    id: 'TEA-01',
    userId: 'USR002',
    name: 'ThS. Trần Thị Mai Phương',
    email: 'phuong.tran@toeic.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 4,
    totalStudents: 210,
    rating: 4.9,
    status: 'active', // Đang hoạt động
  },
  {
    id: 'TEA-02',
    userId: 'USR003',
    name: 'TS. Lê Hoàng Nam',
    email: 'nam.le@toeic.vn',
    phone: '0923 456 789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 3,
    totalStudents: 142,
    rating: 4.88,
    status: 'active', // Đang hoạt động
  },
  {
    id: 'TEA-03',
    userId: 'USR008',
    name: 'ThS. Bùi Quốc Huy',
    email: 'huy.bui@toeic.vn',
    phone: '0978 901 234',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 3,
    totalStudents: 165,
    rating: 4.85,
    status: 'active', // Đang hoạt động
  },
  {
    id: 'TEA-04',
    userId: 'USR015',
    name: 'Thầy Phạm Gia Huy',
    email: 'huy.pham@toeic.vn',
    phone: '0934 666 999',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 2,
    totalStudents: 88,
    rating: 4.8,
    status: 'active', // Đang hoạt động
  },
  {
    id: 'TEA-05',
    userId: 'USR016',
    name: 'Cô Vũ Phương Thảo',
    email: 'thao.vu@toeic.vn',
    phone: '0971 222 345',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 2,
    totalStudents: 95,
    rating: 4.92,
    status: 'active', // Đang hoạt động
  },
  {
    id: 'TEA-06',
    userId: 'USR017',
    name: 'Thầy Đặng Hoàng Long',
    email: 'long.dang@toeic.vn',
    phone: '0963 111 888',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&h=100&fit=crop&crop=faces',
    activeClasses: 3,
    totalStudents: 130,
    rating: 4.75,
    status: 'inactive', // Ngừng hoạt động
  },
];
