// backend/src/modules/teacher/teacher.controller.js
import { teacherService } from './teacher.service.js';
import { apiSuccess } from '../../utils/response.js';

export const teacherController = {
  async getDashboard(req, res, next) {
    try {
      const teacherId = req.user?.id || 'USR-TEACHER-01';
      const data = await teacherService.getDashboard(teacherId);
      return apiSuccess(res, data, 'Lấy dữ liệu Dashboard giảng viên thành công');
    } catch (error) {
      next(error);
    }
  },

  async getSubmissions(req, res, next) {
    try {
      const teacherId = req.user?.id || 'USR-TEACHER-01';
      const list = await teacherService.getSubmissions(teacherId);
      return apiSuccess(res, list, 'Lấy danh sách bài nộp cần chấm thành công');
    } catch (error) {
      next(error);
    }
  },

  async gradeSubmission(req, res, next) {
    try {
      const { id } = req.params;
      const { gradeScore, feedback } = req.body;
      const teacherId = req.user?.id || 'USR-TEACHER-01';
      const result = await teacherService.gradeSubmission(id, { gradeScore, feedback, teacherId });
      return apiSuccess(res, result, 'Chấm điểm và phản hồi bài nộp thành công');
    } catch (error) {
      next(error);
    }
  },
};
