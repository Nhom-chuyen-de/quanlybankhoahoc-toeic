import { learningService } from './learning.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const learningController = {
  async getMyCourses(req, res) {
    try {
      const courses = await learningService.getMyCourses(req.user.id);
      return apiSuccess(res, courses, 'Khóa học của tôi');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getCourseLessons(req, res) {
    try {
      const curriculum = await learningService.getCourseLessons(req.user.id, req.params.courseId);
      return apiSuccess(res, curriculum, 'Giáo trình bài học');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getLessonDetail(req, res) {
    try {
      const { courseId, lessonId } = req.params;
      const lesson = await learningService.getLessonDetail(req.user.id, courseId, lessonId);
      return apiSuccess(res, lesson, 'Chi tiết bài học');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async completeLesson(req, res) {
    try {
      const { courseId, lessonId } = req.params;
      const result = await learningService.completeLesson(req.user.id, courseId, lessonId);
      return apiSuccess(res, result, 'Cập nhật tiến độ thành công');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyClasses(req, res) {
    try {
      const classes = await learningService.getMyClasses(req.user.id);
      return apiSuccess(res, classes, 'Lớp học của tôi');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMySchedules(req, res) {
    try {
      const schedules = await learningService.getMySchedules(req.user.id);
      return apiSuccess(res, schedules, 'Lịch học sắp diễn ra');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyAttendance(req, res) {
    try {
      const attendances = await learningService.getMyAttendance(req.user.id);
      return apiSuccess(res, attendances, 'Lịch sử điểm danh');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },
};
