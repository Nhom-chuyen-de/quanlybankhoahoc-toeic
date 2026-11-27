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

  async googleLogin(profile) {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  async forgotPassword(email) {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async getMe() {
    return apiRequest('/auth/me', { method: 'GET' });
  },
};
