// src/services/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Lỗi yêu cầu: ${res.statusText}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Nếu không kết nối được tới server (server offline)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const err = new Error('Không thể kết nối đến máy chủ Backend (http://localhost:5000). Vui lòng kiểm tra lại dịch vụ.');
      err.isNetworkError = true;
      throw err;
    }
    throw error;
  }
}
