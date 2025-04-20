'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Login.module.css';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: '',
  });
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: '',
      general: '',
    }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이메일 유효성 검사
    if (!validateEmail(formData.email)) {
      setErrors(prev => ({
        ...prev,
        email: '올바른 이메일 형식을 입력해주세요.',
      }));
      return;
    }

    // 비밀번호 유효성 검사
    if (!formData.password) {
      setErrors(prev => ({
        ...prev,
        password: '비밀번호를 입력해주세요.',
      }));
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 로그인 성공 시 사용자 정보와 토큰 저장
        login(data.user, data.token);
        router.push('/');
      } else {
        if (response.status === 401) {
          setErrors(prev => ({
            ...prev,
            general: '이메일 또는 비밀번호가 일치하지 않습니다.',
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            general: data.error || '로그인에 실패했습니다.',
          }));
        }
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        general: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }));
    }
  };

  return (
    <>
      <Header currentUser={null} onLogout={() => {}} />
      <div className={styles.loginContainer}>
        <h1 className={styles.title}>로그인</h1>
        {errors.general && <p className={styles.errorText}>{errors.general}</p>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">이메일 주소*</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="예) vlrttfgg@vlrttfgg.co.kr"
              className={errors.email ? styles.inputError : ''}
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="비밀번호를 입력해주세요"
              className={errors.password ? styles.inputError : ''}
            />
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          </div>

          <button type="submit" className={styles.submitButton}>
            로그인
          </button>
        </form>
      </div>
    </>
  );
} 