// backend/src/modules/admin/admin.service.js
import prisma from '../../config/prisma.js';
import bcrypt from 'bcryptjs';

export const adminService = {
  // 1. Thống kê Dashboard
  async getDashboardStats() {
    const [totalUsers, totalCourses, totalOrders, paidOrders, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.order.count(),
      prisma.order.findMany({ where: { status: 'PAID' } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { fullName: true, email: true } },
          course: { select: { title: true } },
        },
      }),
    ]);

    const totalRevenue = paidOrders.reduce((sum, ord) => sum + Number(ord.finalAmount), 0);

    return {
      stats: {
        totalUsers,
        totalCourses,
        totalOrders,
        totalRevenue,
      },
      recentOrders,
    };
  },

  // 2. Quản lý Người dùng (Users CRUD)
  async getUsers({ role, status, search, page = 1, limit = 20 }) {
    const where = {};
    if (role) where.role = role.toUpperCase();
    if (status) where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          role: true,
          status: true,
          avatar: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    };
  },

  async createUser(userData) {
    const passwordHash = await bcrypt.hash(userData.password || '12345678@', 10);

    const newUser = await prisma.user.create({
      data: {
        fullName: userData.fullName || userData.hoTen,
        email: userData.email.toLowerCase().trim(),
        passwordHash,
        phoneNumber: userData.phoneNumber || userData.soDienThoai,
        role: (userData.role || userData.vaiTro || 'STUDENT').toUpperCase(),
        status: (userData.status || 'ACTIVE').toUpperCase(),
        address: userData.address || '',
      },
    });

    return newUser;
  },

  async updateUserStatus(userId, status) {
    return prisma.user.update({
      where: { id: userId },
      data: { status: status.toUpperCase() },
    });
  },

  // 3. Quản lý Khóa học
  async getCourses({ category, status, search }) {
    const where = {};
    if (category) where.categoryId = category;
    if (status) where.status = status.toUpperCase();
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { code: { contains: search } },
      ];
    }

    return prisma.course.findMany({
      where,
      include: {
        category: true,
        teacher: { select: { id: true, fullName: true, title: true } },
        chapters: {
          include: { lessons: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // 4. Quản lý Đơn hàng
  async getOrders() {
    return prisma.order.findMany({
      include: {
        student: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        course: { select: { id: true, title: true, code: true, thumbnail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
