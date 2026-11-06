const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, params, token = localStorage.getItem('auth_token') } = {}) {
  const url = new URL(`${API_URL}${path}`, window.location.origin);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  const response = await fetch(url, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error?.message || `Yêu cầu thất bại (${response.status}).`);
    error.status = response.status;
    error.code = result.error?.code;
    throw error;
  }
  return result.data;
}

const resource = (base) => ({
  list: (params) => request(base, { params }),
  get: (id) => request(`${base}/${id}`),
  create: (data) => request(base, { method: 'POST', body: data }),
  update: (id, data) => request(`${base}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${base}/${id}`, { method: 'DELETE' }),
});

export const apiRequest = request;
export const userService = {
  ...resource('/admin/users'),
  getUsers: (params) => request('/admin/users', { params }),
  getUserById: (id) => request(`/admin/users/${id}`),
  createUser: (data) => request('/admin/users', { method: 'POST', body: data }),
  updateUser: (id, data) => request(`/admin/users/${id}`, { method: 'PUT', body: data }),
  updateUserStatus: (id, status) => request(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  bulkAction: (ids, action) => request('/admin/users/bulk-action', { method: 'POST', body: { ids, action } }),
};
export const courseService = {
  ...resource('/admin/courses'),
  getCourses: (params) => request('/admin/courses', { params }),
  getCourseById: (id) => request(`/admin/courses/${id}/detail`),
  createCourse: (data) => request('/admin/courses', { method: 'POST', body: data }),
  updateCourse: (id, data) => request(`/admin/courses/${id}`, { method: 'PUT', body: data }),
  updateCourseStatus: (id, status) => request(`/admin/courses/${id}/status`, { method: 'PATCH', body: { status } }),
  updateCourseVisibility: (id, isVisible) => request(`/admin/courses/${id}/visibility`, { method: 'PATCH', body: { isVisible } }),
  getEnrollments: (id) => request(`/admin/courses/${id}/enrollments`),
  updateEnrollment: (courseId, enrollmentId, data) => request(`/admin/courses/${courseId}/enrollments/${enrollmentId}`, { method: 'PATCH', body: data }),
  deleteCourse: (id) => request(`/admin/courses/${id}`, { method: 'DELETE' }),
};
export const orderService = { ...resource('/admin/orders'), getOrders: (params) => request('/admin/orders', { params }), getOrderById: (id) => request(`/admin/orders/${id}`), createInvoice: (id) => request(`/admin/orders/${id}/invoice`, { method: 'POST', body: {} }) };
export const dashboardService = {
  getStats: () => request('/admin/dashboard/stats'),
  getRevenueChart: (months = 12) => request('/admin/dashboard/revenue-chart', { params: { months } }),
  getEnrollmentChart: (months = 12) => request('/admin/dashboard/enrollment-chart', { params: { months } }),
  getRoleDistribution: () => request('/admin/dashboard/role-distribution'),
  getRecentOrders: () => request('/admin/dashboard/recent-orders'),
  getPendingReviews: () => request('/admin/dashboard/pending-reviews'),
  getUrgentTickets: () => request('/admin/dashboard/urgent-tickets'),
};
export const profileService = {
  get: () => request('/admin/profile'),
  update: (data) => request('/admin/profile', { method: 'PUT', body: data }),
  changePassword: (data) => request('/admin/profile/change-password', { method: 'PUT', body: data }),
};
export const authService = {
  login: (credentials) => request('/admin/auth/login', { method: 'POST', body: credentials, token: null }),
  logout: () => request('/admin/auth/logout', { method: 'POST', body: {} }),
  getMe: () => request('/admin/auth/me'),
};
export const categoryService = resource('/admin/categories');
export const classService = {
  ...resource('/admin/classes'),
  getById: (id) => request(`/admin/classes/${id}`),
  updateStatus: (id, status) => request(`/admin/classes/${id}/status`, { method: 'PATCH', body: { status } }),
  addStudent: (id, data) => request(`/admin/classes/${id}/students`, { method: 'POST', body: data }),
  updateStudent: (id, studentId, status) => request(`/admin/classes/${id}/students/${studentId}`, { method: 'PATCH', body: { status } }),
};
export const teacherService = { list: (params) => request('/admin/teachers', { params }) };
export const moderationService = { list: (params) => request('/admin/moderation', { params }), approve: (id) => request(`/admin/moderation/${id}/approve`, { method: 'POST', body: {} }), reject: (id, reason) => request(`/admin/moderation/${id}/reject`, { method: 'POST', body: { reason } }) };
export const couponService = { ...resource('/admin/coupons'), toggle: (id) => request(`/admin/coupons/${id}/toggle`, { method: 'PATCH', body: {} }) };
export const paymentService = {
  list: (params) => request('/admin/payments', { params }),
  confirm: (id) => request(`/admin/payments/${id}/manual-confirm`, { method: 'POST', body: {} }),
  gateways: (params) => request('/admin/payment-gateways', { params }),
  createGateway: (data) => request('/admin/payment-gateways', { method: 'POST', body: data }),
  updateGateway: (id, data) => request(`/admin/payment-gateways/${id}`, { method: 'PUT', body: data }),
  toggleGateway: (id) => request(`/admin/payment-gateways/${id}/toggle`, { method: 'PATCH', body: {} }),
};
export const refundService = { list: (params) => request('/admin/refunds', { params }), approve: (id, note) => request(`/admin/refunds/${id}/approve`, { method: 'POST', body: { note } }), reject: (id, reason) => request(`/admin/refunds/${id}/reject`, { method: 'POST', body: { reason } }), complete: (id, note) => request(`/admin/refunds/${id}/complete`, { method: 'POST', body: { note } }) };
export const supportService = { list: (params) => request('/admin/tickets', { params }), update: (id, data) => request(`/admin/tickets/${id}`, { method: 'PATCH', body: data }), replies: (id) => request(`/admin/tickets/${id}/replies`), reply: (id, content) => request(`/admin/tickets/${id}/reply`, { method: 'POST', body: { content } }), broadcast: (data) => request('/admin/notifications/broadcast', { method: 'POST', body: data }) };
export const certificateService = { ...resource('/admin/certificates'), revoke: (id) => request(`/admin/certificates/${id}/revoke`, { method: 'PATCH', body: {} }) };
export const certificateEnrollmentService = { list: () => request('/admin/certificate-enrollments') };
export const reviewService = { list: (params) => request('/admin/reviews', { params }), stats: () => request('/admin/reviews/stats'), remove: (id) => request(`/admin/reviews/${id}`, { method: 'DELETE' }), approveContent: (id) => request(`/admin/moderation/${id}/approve`, { method: 'POST', body: {} }), rejectContent: (id, reason) => request(`/admin/moderation/${id}/reject`, { method: 'POST', body: { reason } }) };
export const notificationService = { list: (params) => request('/admin/notifications', { params }), markRead: (id) => request(`/admin/notifications/${id}/read`, { method: 'PATCH', body: {} }), markUnread: (id) => request(`/admin/notifications/${id}/unread`, { method: 'PATCH', body: {} }), markAllRead: () => request('/admin/notifications/mark-all-read', { method: 'PUT', body: {} }), remove: (id) => request(`/admin/notifications/${id}`, { method: 'DELETE' }) };
export const reportService = {
  list: (params) => request('/admin/reports', { params }),
  generate: (data) => request('/admin/reports/generate', { method: 'POST', body: data }),
  remove: (id) => request(`/admin/reports/${id}`, { method: 'DELETE' }),
  downloadUrl: (id) => `${API_URL}/admin/reports/${id}/download`,
  download: async (id) => {
    const response = await fetch(`${API_URL}/admin/reports/${id}/download`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } });
    if (!response.ok) { const payload = await response.json().catch(() => ({})); throw new Error(payload.error?.message || 'Không tải được báo cáo.'); }
    const blob = await response.blob(), url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url; anchor.download = `report-${id}.csv`; anchor.click(); URL.revokeObjectURL(url);
  },
};
