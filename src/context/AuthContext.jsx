// src/context/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export function normalizeRole(rawRole, email = '') {
  if (rawRole) {
    const r = String(rawRole).toLowerCase().trim();
    if (r === ROLES.ADMIN || r === 'admin' || r === 'quan_tri_vien') return ROLES.ADMIN;
    if (r === ROLES.TEACHER || r === 'teacher' || r === 'giang_vien') return ROLES.TEACHER;
    if (r === ROLES.STUDENT || r === 'student' || r === 'hoc_vien') return ROLES.STUDENT;
  }
  const lowerEmail = String(email || '').toLowerCase();
  if (lowerEmail.includes('admin')) return ROLES.ADMIN;
  if (lowerEmail.includes('teacher') || lowerEmail.includes('giangvien')) return ROLES.TEACHER;
  return ROLES.STUDENT;
}

export function getSavedUserFromStorage() {
  try {
    const savedUser = localStorage.getItem('auth_user');
    if (!savedUser) return null;
    const parsed = JSON.parse(savedUser);
    if (!parsed) return null;
    return {
      ...parsed,
      vaiTro: normalizeRole(parsed.vaiTro, parsed.email),
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSavedUserFromStorage());
  const [token, setToken] = useState(() => localStorage.getItem('auth_token') || null);

  const login = useCallback((userData, authToken = null) => {
    const normalizedVaiTro = normalizeRole(userData?.vaiTro || userData?.role, userData?.email);
    const fullUser = {
      id: userData?.id || 'USR-001',
      hoTen: userData?.hoTen || userData?.fullName || 'Học viên',
      email: userData?.email || 'user@example.com',
      vaiTro: normalizedVaiTro,
      anhDaiDien: userData?.anhDaiDien || userData?.avatar || null,
      soDienThoai: userData?.soDienThoai || userData?.phoneNumber || '',
      authProvider: userData?.authProvider || 'Email/Password',
    };

    localStorage.setItem('auth_user', JSON.stringify(fullUser));
    setUser(fullUser);

    if (authToken) {
      localStorage.setItem('auth_token', authToken);
      setToken(authToken);
    }
    return fullUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((currentUser) => {
      const base = currentUser || getSavedUserFromStorage() || {};
      const nextUser = {
        ...base,
        ...updates,
        vaiTro: normalizeRole(updates?.vaiTro || base?.vaiTro, updates?.email || base?.email),
      };
      localStorage.setItem('auth_user', JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  // Đồng bộ tự động khi tab khác cập nhật localStorage
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'auth_user') {
        setUser(getSavedUserFromStorage());
      } else if (e.key === 'auth_token') {
        setToken(localStorage.getItem('auth_token') || null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const activeUser = user || getSavedUserFromStorage();

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        token,
        login,
        logout,
        updateUser,
        isAuthenticated: !!activeUser,
      }}
    >
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
