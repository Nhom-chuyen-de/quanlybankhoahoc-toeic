// src/services/studentService.js
import { apiRequest } from './apiClient';

export const studentAuthService = {
  async register(formData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(formData),
    });
  },

  async login(credentials) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async forgotPassword(email) {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async googleLogin(profile) {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async getMe() {
    return apiRequest('/auth/me', { method: 'GET' });
  },
};

export const studentCourseService = {
  async getAllCourses(params = {}) {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/courses${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  async getCourseById(id) {
    return apiRequest(`/courses/${id}`, { method: 'GET' });
  },
};

export const studentLearningService = {
  // Lấy các khóa học đã ghi danh
  async getMyCourses() {
    return apiRequest('/learning/my-courses', { method: 'GET' });
  },

  // Khung chương trình
  async getCourseCurriculum(courseId) {
    return apiRequest(`/learning/courses/${courseId}/curriculum`, { method: 'GET' });
  },

  // Chi tiết bài học
  async getLessonDetail(courseId, lessonId) {
    return apiRequest(`/learning/courses/${courseId}/lessons/${lessonId}`, { method: 'GET' });
  },

  // Đánh dấu hoàn thành bài học
  async completeLesson(courseId, lessonId) {
    return apiRequest(`/learning/courses/${courseId}/lessons/${lessonId}/complete`, { method: 'POST' });
  },

  // Lớp học, lịch học, điểm danh
  async getMyClasses() {
    return apiRequest('/learning/my-classes', { method: 'GET' });
  },

  async getMySchedules() {
    return apiRequest('/learning/schedules', { method: 'GET' });
  },

  async getMyAttendance() {
    return apiRequest('/learning/attendance', { method: 'GET' });
  },
};

export const studentExamService = {
  async getQuiz(quizId) {
    return apiRequest(`/exams/quizzes/${quizId}`, { method: 'GET' });
  },

  async submitQuiz(quizId, answers) {
    return apiRequest(`/exams/quizzes/${quizId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },

  async getMyScores() {
    return apiRequest('/exams/my-scores', { method: 'GET' });
  },
};

export const studentOrderService = {
  async validateCoupon(code, amount) {
    return apiRequest('/orders/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, amount }),
    });
  },

  async checkout(orderData) {
    return apiRequest('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  async getMyOrders() {
    return apiRequest('/orders/my-orders', { method: 'GET' });
  },

  async initQRPayment(data) {
    return apiRequest('/orders/qr-init', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async confirmQRPayment(orderId) {
    return apiRequest(`/orders/${orderId}/qr-confirm`, {
      method: 'POST',
    });
  },
};

export const studentSupportService = {
  async getNotifications() {
    return apiRequest('/support/notifications', { method: 'GET' });
  },

  async markNotificationRead(id) {
    return apiRequest(`/support/notifications/${id}/read`, { method: 'PATCH' });
  },

  async getMyCertificates() {
    return apiRequest('/support/my-certificates', { method: 'GET' });
  },

  async createTicket(ticketData) {
    return apiRequest('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  },
};
