import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('farmix_user') || localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        localStorage.setItem('farmix_user', JSON.stringify(parsedUser));
      }
    } catch {
      localStorage.removeItem('farmix_user');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const getRedirectPath = (userData) => {
    if (!userData) return '/';
    switch (userData.role) {
      case 'admin': return '/admin-dashboard';
      case 'expert': return '/expert-dashboard';
      case 'farmer':
      default: return '/user-dashboard';
    }
  };

  const setSession = (userData) => {
    if (!userData) return;
    localStorage.setItem('farmix_user', JSON.stringify(userData));
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.token) localStorage.setItem('token', userData.token);
    if (userData.refreshToken) localStorage.setItem('refreshToken', userData.refreshToken);
    setUser(userData);
  };

  const clearSession = () => {
    localStorage.removeItem('farmix_user');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const login = async (email, password, loginAs) => {
    const res = await api.post('/api/auth/login', { email, password, loginAs });
    if (res.data.success) {
      setSession(res.data.data);
      return { ...res.data, redirectTo: getRedirectPath(res.data.data) };
    }
    throw new Error('Login failed');
  };

  const registerFarmer = async (data) => {
    const res = await api.post('/api/auth/farmer/register', data);
    if (res.data.success) {
      return res.data;
    }
    throw new Error('Registration failed');
  };

  const registerExpert = async (data) => {
    const res = await api.post('/api/auth/expert/register', data);
    if (res.data.success) {
      return res.data;
    }
    throw new Error('Registration failed');
  };

  // Legacy compat
  const register = async (name, email, password, role = 'farmer') => {
    if (role === 'expert') {
      return registerExpert({ name, email, password });
    }
    return registerFarmer({ name, email, password });
  };

  const logout = async () => {
    const storedUser = localStorage.getItem('farmix_user') || localStorage.getItem('user');
    const parsedUser = storedUser ? (() => { try { return JSON.parse(storedUser); } catch { return null; } })() : null;
    const refreshToken =
      localStorage.getItem('refreshToken') ||
      parsedUser?.refreshToken ||
      parsedUser?.data?.refreshToken ||
      '';

    if (refreshToken) {
      try {
        await api.post('/api/auth/logout', { refreshToken });
      } catch {
        // Ignore logout errors; always clear local session.
      }
    }

    clearSession();
    window.location.href = '/login';
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('farmix_user', JSON.stringify(updated));
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const token = user?.token || localStorage.getItem('token') || null;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      registerFarmer,
      registerExpert,
      logout,
      loading,
      getRedirectPath,
      updateUser,
      setSession,
      clearSession
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
