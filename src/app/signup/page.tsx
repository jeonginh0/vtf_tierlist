'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/SignUp.module.css';
import Header from '@/components/Header';

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    valorantNickname: '',
    password: '',
    passwordConfirm: '',
    preferredPosition: '타격대',
  });

  const [errors, setErrors] = useState({
    email: '',
    nickname: '',
    valorantNickname: '',
    password: '',
    passwordConfirm: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (password: string) => {
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,16}$/;
    return re.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {
      email: !validateEmail(formData.email) ? '이메일을 정확히 입력해주세요.' : '',
      nickname: !formData.nickname ? 'VTF 닉네임을 입력해주세요.' : '',
      valorantNickname: !formData.valorantNickname ? '발로란트 닉네임을 입력해주세요.' : '',
      password: !validatePassword(formData.password) ? '영문, 숫자, 특수문자를 조합해서 입력해주세요. (8~16자)' : '',
      passwordConfirm: formData.password !== formData.passwordConfirm ? '비밀번호가 일치하지 않습니다.' : '',
    };

    setErrors(newErrors);

    // Check if there are any errors
    if (Object.values(newErrors).some(error => error !== '')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          nickname: formData.nickname,
          valorantNickname: formData.valorantNickname,
          password: formData.password,
          preferredPosition: formData.preferredPosition,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/login');
      } else {
        if (data.error === '이미 사용 중인 이메일입니다.') {
          setErrors(prev => ({
            ...prev,
            email: '이미 사용 중인 이메일입니다.',
          }));
        } else if (data.error === '이미 사용 중인 닉네임입니다.') {
          setErrors(prev => ({
            ...prev,
            nickname: '이미 사용 중인 닉네임입니다.',
          }));
        } else if (data.error === '이미 사용 중인 발로란트 닉네임입니다.') {
          setErrors(prev => ({
            ...prev,
            valorantNickname: '이미 사용 중인 발로란트 닉네임입니다.',
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            email: data.error || '회원가입에 실패했습니다.',
          }));
        }
      }
    } catch {
      setErrors(prev => ({
        ...prev,
        preferredPosition: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      }));
    }
  };

  return (
    <>
      <Header />
      <div className={styles.signupContainer}>
        <h1 className={styles.title}>회원가입</h1>
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
            <label htmlFor="nickname">VTF 닉네임*</label>
            <input
              type="text"
              id="nickname"
              name="nickname"
              value={formData.nickname}
              onChange={handleInputChange}
              placeholder="VTF에서 사용할 닉네임을 입력하세요"
              className={errors.nickname ? styles.inputError : ''}
            />
            {errors.nickname && <p className={styles.errorText}>{errors.nickname}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="valorantNickname">발로란트 닉네임*</label>
            <input
              type="text"
              id="valorantNickname"
              name="valorantNickname"
              value={formData.valorantNickname}
              onChange={handleInputChange}
              placeholder="예) VLRTTFGG#KR1"
              className={errors.valorantNickname ? styles.inputError : ''}
            />
            {errors.valorantNickname && (
              <p className={styles.errorText}>{errors.valorantNickname}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">비밀번호*</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="영문, 숫자, 특수문자 조합 8-16자"
              className={errors.password ? styles.inputError : ''}
            />
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="passwordConfirm">비밀번호 확인*</label>
            <input
              type="password"
              id="passwordConfirm"
              name="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={handleInputChange}
              placeholder="영문, 숫자, 특수문자 조합 8-16자"
              className={errors.passwordConfirm ? styles.inputError : ''}
            />
            {errors.passwordConfirm && (
              <p className={styles.errorText}>{errors.passwordConfirm}</p>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="preferredPosition">선호 포지션*</label>
            <select
              id="preferredPosition"
              name="preferredPosition"
              value={formData.preferredPosition}
              onChange={handleInputChange}
            >
              <option value="타격대">타격대</option>
              <option value="척후대">척후대</option>
              <option value="감시자">감시자</option>
              <option value="전략가">전략가</option>
            </select>
          </div>

          <button type="submit" className={styles.submitButton}>
            회원가입
          </button>
        </form>
      </div>
    </>
  );
} 