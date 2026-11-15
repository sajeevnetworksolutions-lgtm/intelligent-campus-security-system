import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User, AuthResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isSOCAnalyst: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    fetchMe();
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.post<AuthResponse>('/auth/login', credentials);
    const { access_token, user_id, username, role, full_name, department } = res.data;
    localStorage.setItem('token', access_token);
    setToken(access_token);
    setUser({
      id: user_id,
      username,
      email: `${username}@ssit.edu.in`,
      full_name,
      role,
      department,
      is_active: true,
      is_locked: false,
      created_at: new Date().toISOString()
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const isAdmin = user?.role === 'Super Administrator';
  const isSOCAnalyst = user?.role === 'Security Administrator' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isAdmin, isSOCAnalyst }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
