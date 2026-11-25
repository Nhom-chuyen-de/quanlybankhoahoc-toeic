import { examService } from './exam.service.js';
import { apiSuccess, apiError } from '../../utils/response.js';

export const examController = {
  async getQuiz(req, res, next) {
    try {
      const quiz = await examService.getQuiz(req.params.id);
      return apiSuccess(res, quiz, 'Đề thi trắc nghiệm');
    } catch (error) {
      return apiError(res, error.message, 404);
    }
  },

  async submitQuiz(req, res, next) {
    try {
      const result = await examService.submitQuiz(req.user.id, req.params.id, req.body.answers);
      return apiSuccess(res, result, 'Nộp bài và chấm điểm thành công');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },

  async getMyScores(req, res, next) {
    try {
      const scores = await examService.getMyScores(req.user.id);
      return apiSuccess(res, scores, 'Lịch sử điểm kiểm tra');
    } catch (error) {
      return apiError(res, error.message, 400);
    }
  },
};
