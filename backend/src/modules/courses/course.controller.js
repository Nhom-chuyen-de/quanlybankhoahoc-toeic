import { courseService } from './course.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const courseController = {
  async getAllCourses(req, res, next) {
    try {
      const courses = await courseService.getAllCourses(req.query);
      return apiSuccess(res, courses, 'Danh sách khóa học');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getCourseById(req, res, next) {
    try {
      const course = await courseService.getCourseById(req.params.id);
      return apiSuccess(res, course, 'Chi tiết khóa học');
    } catch (error) {
      return apiError(res, error.message, 404);
    }
  },
};
