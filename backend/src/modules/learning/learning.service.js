// backend/src/modules/learning/learning.service.js
import prisma from '../../config/prisma.js';

export const learningService = {
  // 1. Khóa học của tôi (My Courses)
  async getMyCourses(userId) {
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: userId },
      include: {
        course: {
          include: {
            teacher: { select: { fullName: true } },
          },
        },
        lessonProgress: {
          where: { isCompleted: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((enr) => {
      const course = enr.course;
      const completedCount = enr.lessonProgress.length;
      const totalLessons = course.totalLessons || 1;
      const progressPercent = Math.min(100, Math.round((completedCount / totalLessons) * 100));

      return {
        enrollmentId: enr.id,
        ngayDangKy: enr.enrolledAt,
        progressPercent,
        completedLessonsCount: completedCount,
        totalLessons,
        course: {
          id: course.id,
          maKhoaHoc: course.code,
          tieuDe: course.title,
          hinhAnh: course.thumbnail,
          giangVien: course.teacher?.fullName,
        },
      };
    });
  },

  // 2. Khung chương trình bài học kèm trạng thái hoàn thành
  async getCourseLessons(userId, courseId) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: userId,
        },
      },
      include: {
        lessonProgress: true,
      },
    });

    if (!enrollment) {
      throw new Error('Bạn chưa đăng ký khóa học này');
    }

    const completedLessonIds = new Set(
      enrollment.lessonProgress.filter((p) => p.isCompleted).map((p) => p.lessonId)
    );

    const chapters = await prisma.chapter.findMany({
      where: { courseId },
      include: {
        lessons: { orderBy: { order: 'asc' } },
      },
      orderBy: { order: 'asc' },
    });

    return chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      order: ch.order,
      lessons: ch.lessons.map((les) => ({
        id: les.id,
        title: les.title,
        type: les.type.toLowerCase(),
        duration: les.duration,
        resourceUrl: les.resourceUrl,
        daHoanThanh: completedLessonIds.has(les.id),
      })),
    }));
  },

  // 3. Chi tiết một bài học
  async getLessonDetail(userId, courseId, lessonId) {
    await this.getCourseLessons(userId, courseId);

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) throw new Error('Không tìm thấy bài học');

    return {
      id: lesson.id,
      title: lesson.title,
      type: lesson.type.toLowerCase(),
      duration: lesson.duration,
      resourceUrl: lesson.resourceUrl,
    };
  },

  // 4. Cập nhật tiến độ hoàn thành bài học
  async updateProgress(userId, courseId, lessonId, { completed = true, lastPosition = 0 } = {}) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: userId,
        },
      },
    });

    if (!enrollment) throw new Error('Không tìm thấy thông tin ghi danh khóa học');

    return prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      update: {
        isCompleted: completed,
        lastPosition,
        completedAt: completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        isCompleted: completed,
        lastPosition,
        completedAt: completed ? new Date() : null,
      },
    });
  },

  async completeLesson(userId, courseId, lessonId) {
    return this.updateProgress(userId, courseId, lessonId, { completed: true });
  },

  // 5. Danh sách lớp học của học viên
  async getMyClasses(userId) {
    const classEnrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      include: {
        class: {
          include: {
            course: { select: { id: true, title: true } },
            teacher: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    return classEnrollments.map((ce) => ce.class);
  },

  // 6. Thời khóa biểu của học viên
  async getMySchedules(userId) {
    const classEnrollments = await prisma.classEnrollment.findMany({
      where: { studentId: userId },
      select: { classId: true },
    });
    const classIds = classEnrollments.map((ce) => ce.classId);

    return prisma.classSchedule.findMany({
      where: { classId: { in: classIds } },
      include: {
        class: { select: { code: true, name: true } },
      },
      orderBy: { sessionDate: 'asc' },
    });
  },

  // 7. Lịch sử điểm danh của học viên
  async getMyAttendance(userId) {
    return prisma.attendance.findMany({
      where: { studentId: userId },
      include: {
        schedule: {
          include: {
            class: { select: { code: true, name: true } },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  },
};
