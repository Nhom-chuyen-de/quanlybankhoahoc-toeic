import { mockDatabase } from '../../config/db.js';

export const examService = {
  // Lấy đề thi Quiz
  async getQuiz(quizId) {
    const quiz = mockDatabase.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Không tìm thấy bài Quiz');

    // Ẩn đáp án đúng khi gửi đề thi cho học viên
    const sanitizedQuestions = quiz.questions.map((q) => ({
      id: q.id,
      cauHoi: q.cauHoi,
      amThanh: q.amThanh,
      hinhAnh: q.hinhAnh,
      luaChon: q.luaChon,
    }));

    return {
      id: quiz.id,
      tieuDe: quiz.tieuDe,
      thoiGianPhut: quiz.thoiGianPhut,
      tongSoCau: sanitizedQuestions.length,
      questions: sanitizedQuestions,
    };
  },

  // Nộp bài làm Quiz & Chấm điểm tự động
  async submitQuiz(userId, quizId, answers = {}) {
    const quiz = mockDatabase.quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error('Không tìm thấy bài Quiz');

    let soCauDung = 0;
    const chiTietKetQua = [];

    quiz.questions.forEach((q) => {
      const luaChonHocVien = answers[q.id];
      const dung = luaChonHocVien === q.dapAnDung;
      if (dung) soCauDung++;

      chiTietKetQua.push({
        cauHoiId: q.id,
        cauHoi: q.cauHoi,
        luaChonHocVien,
        dapAnDung: q.dapAnDung,
        dung,
        giaiThich: q.giaiThich,
      });
    });

    const diemHe10 = Math.round((soCauDung / quiz.questions.length) * 100) / 10;
    const diemTOEIC = Math.round((soCauDung / quiz.questions.length) * 990);

    const record = {
      id: 'QZR_' + Date.now().toString(36),
      hocVienId: userId,
      quizId,
      tieuDe: quiz.tieuDe,
      soCauDung,
      tongSoCau: quiz.questions.length,
      diemHe10,
      diemTOEIC,
      ngayNop: new Date(),
      chiTietKetQua,
    };

    mockDatabase.quizResults.push(record);
    return record;
  },

  // Xem lịch sử điểm thi của học viên
  async getMyScores(userId) {
    return mockDatabase.quizResults.filter((r) => r.hocVienId === userId);
  },
};
