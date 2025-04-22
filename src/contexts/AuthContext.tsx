'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 페이지 로드 시 로컬 스토리지에서 토큰 확인
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token) as { userId: string; email: string; role: string; nickname: string };
        setUser({
          id: decoded.userId,
          email: decoded.email,
          nickname: decoded.nickname,
          role: decoded.role
        });
      } catch (error) {
        console.error('토큰 디코딩 실패:', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser({
      id: userData.id,
      email: userData.email,
      nickname: userData.nickname,
      role: userData.role
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 