// backend/src/modules/courses/course.service.js
import prisma from '../../config/prisma.js';

export const courseService = {
  // Lấy danh sách khóa học mở bán cho học viên
  async getAllCourses({ danhMuc, trinhDo, search }) {
    const where = { status: 'PUBLISHED' };

    if (danhMuc) {
      where.category = { slug: danhMuc.toLowerCase() };
    }

    if (trinhDo) {
      where.level = { contains: trinhDo };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        category: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            title: true,
          },
        },
        chapters: {
          include: { lessons: true },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => ({
      id: c.id,
      maKhoaHoc: c.code,
      tieuDe: c.title,
      moTa: c.description,
      gia: Number(c.price),
      giaGoc: c.originalPrice ? Number(c.originalPrice) : null,
      hinhAnh: c.thumbnail,
      danhMuc: c.category?.name || 'TOEIC',
      trinhDo: c.level,
      hinhThuc: c.format,
      giangVien: c.teacher?.fullName || 'Đội ngũ TOEIC Master',
      tongSoBaiHoc: c.totalLessons,
      thoiLuongGio: c.totalHours,
      danhGiaTrungBinh: c.rating,
      soLuongHocVien: c.enrolledCount,
      trangThai: c.status.toLowerCase(),
      curriculum: c.chapters,
    }));
  },

  // Chi tiết khóa học và khung chương trình (Curriculum)
  async getCourseById(courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        teacher: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            title: true,
            bio: true,
          },
        },
        chapters: {
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
        reviews: {
          include: {
            student: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!course) throw new Error('Không tìm thấy khóa học');

    return {
      id: course.id,
      maKhoaHoc: course.code,
      tieuDe: course.title,
      moTa: course.description,
      gia: Number(course.price),
      giaGoc: course.originalPrice ? Number(course.originalPrice) : null,
      hinhAnh: course.thumbnail,
      danhMuc: course.category?.name || 'TOEIC',
      trinhDo: course.level,
      hinhThuc: course.format,
      giangVien: course.teacher?.fullName,
      thongTinGiangVien: course.teacher,
      tongSoBaiHoc: course.totalLessons,
      thoiLuongGio: course.totalHours,
      danhGiaTrungBinh: course.rating,
      soLuongHocVien: course.enrolledCount,
      trangThai: course.status.toLowerCase(),
      curriculum: course.chapters,
      reviews: course.reviews,
    };
  },
};
