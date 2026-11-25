import { mockDatabase } from '../../config/db.js';

export const learningService = {
  // Khóa học của tôi (My Courses)
  async getMyCourses(userId) {
    const enrollments = mockDatabase.enrollments.filter(
      (e) => e.hocVienId === userId && e.trangThai === 'active'
    );

    const result = enrollments.map((enr) => {
      const course = mockDatabase.courses.find((c) => c.id === enr.khoaHocId);
      const userProgress = mockDatabase.progress.filter(
        (p) => p.hocVienId === userId && p.khoaHocId === enr.khoaHocId && p.daHoanThanh
      );

      const totalLessons = course ? course.tongSoBaiHoc || 30 : 30;
      const progressPercent = Math.min(100, Math.round((userProgress.length / totalLessons) * 100));

      return {
        enrollmentId: enr.id,
        ngayDangKy: enr.ngayDangKy,
        course,
        progressPercent,
        completedLessonsCount: userProgress.length,
        totalLessons,
      };
    });

    return result;
  },

  // Khung chương trình bài học kèm trạng thái đã hoàn thành của học viên
  async getCourseLessons(userId, courseId) {
    const isEnrolled = mockDatabase.enrollments.some(
      (e) => e.hocVienId === userId && e.khoaHocId === courseId && e.trangThai === 'active'
    );

    if (!isEnrolled) {
      throw new Error('Bạn chưa đăng ký khóa học này');
    }

    const chapters = mockDatabase.chapters.filter((ch) => ch.khoaHocId === courseId);
    const userProgress = mockDatabase.progress.filter(
      (p) => p.hocVienId === userId && p.khoaHocId === courseId
    );

    const completedLessonIds = new Set(
      userProgress.filter((p) => p.daHoanThanh).map((p) => p.baiHocId)
    );

    const curriculum = chapters.map((ch) => ({
      ...ch,
      lessons: ch.lessons.map((les) => ({
        ...les,
        daHoanThanh: completedLessonIds.has(les.id),
      })),
    }));

    return curriculum;
  },

  // Chi tiết một bài học (Video, bài giảng, tài liệu)
  async getLessonDetail(userId, courseId, lessonId) {
    const isEnrolled = mockDatabase.enrollments.some(
      (e) => e.hocVienId === userId && e.khoaHocId === courseId && e.trangThai === 'active'
    );

    if (!isEnrolled) throw new Error('Bạn cần tham gia khóa học để xem nội dung bài học');

    let foundLesson = null;
    for (const ch of mockDatabase.chapters) {
      if (ch.khoaHocId === courseId) {
        const l = ch.lessons.find((item) => item.id === lessonId);
        if (l) {
          foundLesson = l;
          break;
        }
      }
    }

    if (!foundLesson) throw new Error('Không tìm thấy bài học');

    const progressRecord = mockDatabase.progress.find(
      (p) => p.hocVienId === userId && p.khoaHocId === courseId && p.baiHocId === lessonId
    );

    return {
      ...foundLesson,
      daHoanThanh: progressRecord ? progressRecord.daHoanThanh : false,
    };
  },

  // Đánh dấu hoàn thành bài học
  async completeLesson(userId, courseId, lessonId) {
    let progress = mockDatabase.progress.find(
      (p) => p.hocVienId === userId && p.khoaHocId === courseId && p.baiHocId === lessonId
    );

    if (!progress) {
      progress = {
        id: 'PRG_' + Date.now().toString(36),
        hocVienId: userId,
        khoaHocId: courseId,
        baiHocId: lessonId,
        daHoanThanh: true,
        ngayHoanThanh: new Date(),
      };
      mockDatabase.progress.push(progress);
    } else {
      progress.daHoanThanh = true;
      progress.ngayHoanThanh = new Date();
    }

    return { success: true, message: 'Đã hoàn thành bài học' };
  },

  // Xem danh sách lớp học của tôi
  async getMyClasses(userId) {
    return mockDatabase.classes;
  },

  // Xem thời khóa biểu & lịch học sắp tới
  async getMySchedules(userId) {
    return mockDatabase.schedules;
  },

  // Xem lịch sử điểm danh
  async getMyAttendance(userId) {
    return mockDatabase.attendances.filter((a) => a.hocVienId === userId);
  },
};
