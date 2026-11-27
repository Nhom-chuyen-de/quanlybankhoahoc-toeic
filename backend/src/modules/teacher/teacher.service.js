// backend/src/modules/teacher/teacher.service.js
import prisma from '../../config/prisma.js';

export const teacherService = {
  // 1. Thống kê Dashboard Giảng viên
  async getDashboard(teacherId) {
    const [totalClasses, pendingSubmissions, upcomingSchedules] = await Promise.all([
      prisma.class.count({ where: { teacherId } }),
      prisma.submission.count({ where: { status: 'PENDING' } }),
      prisma.schedule.findMany({
        take: 5,
        where: { date: { gte: new Date() } },
        include: { class: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    return {
      stats: {
        totalClasses,
        totalStudents: 128,
        avgAttendance: 95.0,
        pendingGrading: pendingSubmissions,
      },
      upcomingClasses: upcomingSchedules.map((s) => ({
        id: s.id,
        name: s.class.name,
        code: s.class.code,
        time: `${s.startTime} - ${s.endTime}`,
        room: s.room || s.class.room,
        link: s.meetLink || s.class.meetLink,
        type: s.class.type.toLowerCase(),
      })),
    };
  },

  // 2. Danh sách bài nộp chờ chấm (Speaking / Writing / Quiz)
  async getSubmissions(_teacherId) {
    return prisma.submission.findMany({
      include: {
        student: { select: { id: true, fullName: true, email: true, avatar: true } },
        exam: { select: { id: true, title: true, type: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  // 3. Chấm điểm & Gửi nhận xét
  async gradeSubmission(submissionId, { gradeScore, feedback, teacherId }) {
    return prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: 'GRADED',
        gradeScore,
        feedback,
        gradedById: teacherId,
        gradedAt: new Date(),
      },
    });
  },
};
