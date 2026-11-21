// services/userService.js
// TODO: nối API - Implement các hàm gọi API thật

export const userService = {
  // TODO: nối API GET /api/admin/users
  getUsers: async (params) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API GET /api/admin/users/:id
  getUserById: async (id) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API POST /api/admin/users
  createUser: async (data) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API PUT /api/admin/users/:id
  updateUser: async (id, data) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API PATCH /api/admin/users/:id/status
  updateUserStatus: async (id, status) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API DELETE /api/admin/users/:id
  deleteUser: async (id) => {
    throw new Error('Not implemented');
  },
};

export const courseService = {
  // TODO: nối API GET /api/admin/courses
  getCourses: async (params) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API GET /api/admin/courses/:id
  getCourseById: async (id) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API PATCH /api/admin/courses/:id/status
  updateCourseStatus: async (id, status) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API DELETE /api/admin/courses/:id
  deleteCourse: async (id) => {
    throw new Error('Not implemented');
  },
};

export const orderService = {
  // TODO: nối API GET /api/admin/orders
  getOrders: async (params) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API GET /api/admin/orders/:id
  getOrderById: async (id) => {
    throw new Error('Not implemented');
  },
};

export const dashboardService = {
  // TODO: nối API GET /api/admin/dashboard/stats
  getStats: async () => {
    throw new Error('Not implemented');
  },

  // TODO: nối API GET /api/admin/dashboard/revenue
  getRevenueChart: async (period) => {
    throw new Error('Not implemented');
  },
};

export const authService = {
  // TODO: nối API POST /api/admin/auth/login
  login: async (credentials) => {
    throw new Error('Not implemented');
  },

  // TODO: nối API POST /api/admin/auth/logout
  logout: async () => {
    throw new Error('Not implemented');
  },

  // TODO: nối API GET /api/admin/auth/me
  getMe: async () => {
    throw new Error('Not implemented');
  },
};
