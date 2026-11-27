// backend/src/modules/exams/exam.service.js
import prisma from '../../config/prisma.js';

export const examService = {
  // 1. Danh sách bài thi / bài tập
  async getExams({ courseId, type } = {}) {
    const where = {};
    if (courseId) where.courseId = courseId;
    if (type) where.type = type.toUpperCase();

    return prisma.exam.findMany({
      where,
      include: {
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  // 2. Chi tiết đề thi Quiz
  async getQuiz(quizId) {
    const exam = await prisma.exam.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!exam) throw new Error('Không tìm thấy bài thi tương ứng');
    return exam;
  },

  // 3. Nộp bài làm (Speaking / Writing / Quiz)
  async submitExam(userId, examId, { answers, audioUrl, transcript, textContent, durationSpent } = {}) {
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) throw new Error('Không tìm thấy bài thi tương ứng');

    return prisma.submission.create({
      data: {
        examId,
        studentId: userId,
        status: exam.type === 'QUIZ' ? 'GRADED' : 'PENDING',
        durationSpent: durationSpent || '30 phút',
        answersJson: answers ? JSON.stringify(answers) : null,
        audioRecordingUrl: audioUrl || null,
        transcript: transcript || null,
        textContent: textContent || null,
      },
    });
  },

  async submitQuiz(userId, quizId, answers = {}) {
    return this.submitExam(userId, quizId, { answers });
  },

  // 4. Xem kết quả bài thi của học viên
  async getMySubmissions(userId) {
    return prisma.submission.findMany({
      where: { studentId: userId },
      include: {
        exam: true,
        gradedBy: { select: { fullName: true, title: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
  },

  async getMyScores(userId) {
    return this.getMySubmissions(userId);
  },
};
