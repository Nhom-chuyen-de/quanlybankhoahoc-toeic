// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('auth_token') || null;
  });

  const login = (userData, authToken = null) => {
    const fullUser = {
      id: userData?.id || 'USR-001',
      hoTen: userData?.hoTen || 'Học viên',
      email: userData?.email || 'student@toeic.vn',
      vaiTro: userData?.vaiTro || ROLES.STUDENT,
      anhDaiDien: userData?.anhDaiDien || null,
      soDienThoai: userData?.soDienThoai || '',
    };
    setUser(fullUser);
    localStorage.setItem('auth_user', JSON.stringify(fullUser));

    if (authToken) {
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
    }
    return fullUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
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
