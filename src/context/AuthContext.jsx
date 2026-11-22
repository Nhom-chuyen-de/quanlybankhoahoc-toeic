// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // TODO: nối API - lấy thông tin user xác thực từ JWT token hoặc session thật
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    // TODO: nối API POST /api/auth/login và lưu token vào Cookie / LocalStorage
    const fullUser = {
      id: userData?.id || 'USR-001',
      hoTen: userData?.hoTen || 'Người dùng thử',
      email: userData?.email || 'user@example.com',
      vaiTro: userData?.vaiTro || ROLES.ADMIN,
    };
    setUser(fullUser);
    localStorage.setItem('auth_user', JSON.stringify(fullUser));
    return fullUser;
  };

  const logout = () => {
    // TODO: nối API POST /api/auth/logout và xóa token
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
