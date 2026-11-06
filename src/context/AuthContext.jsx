// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES } from '../constants/roles';
import { authService } from '../services/adminService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      setIsLoading(false);
      return;
    }
    authService.getMe()
      .then((profile) => setUser({ id: profile.id, hoTen: profile.name, email: profile.email, vaiTro: ROLES.ADMIN }))
      .catch(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    localStorage.setItem('auth_token', result.token);
    const fullUser = {
      id: result.user.id,
      hoTen: result.user.name,
      email: result.user.email,
      vaiTro: ROLES.ADMIN,
    };
    setUser(fullUser);
    localStorage.setItem('auth_user', JSON.stringify(fullUser));
    return fullUser;
  };

  const logout = async () => {
    try { if (localStorage.getItem('auth_token')) await authService.logout(); } catch { /* local sign-out still clears the session */ }
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
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
