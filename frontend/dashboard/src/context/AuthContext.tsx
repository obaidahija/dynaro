'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi } from '@/lib/api';
import type { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  // On mount, restore session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('dynaro_token');
    const userRaw = localStorage.getItem('dynaro_user');
    if (token && userRaw) {
      try {
        setState({ user: JSON.parse(userRaw), token, isLoading: false });
      } catch {
        setState({ user: null, token: null, isLoading: false });
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token, user } = res.data.data;  // backend: { success, data: { user, token } }
    localStorage.setItem('dynaro_token', token);
    localStorage.setItem('dynaro_user', JSON.stringify(user));
    setState({ user, token, isLoading: false });
    // Navigation is handled by the login page's useEffect
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('dynaro_token');
    localStorage.removeItem('dynaro_user');
    setState({ user: null, token: null, isLoading: false });
    // Navigation is handled by the dashboard layout's useEffect
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
