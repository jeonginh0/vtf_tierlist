'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/Header.module.css'

interface HeaderProps {
  currentUser: {
    nickname: string;
    role: string;
  } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const router = useRouter();

  const handleLogout = () => {
    // 로컬 스토리지 클리어
    localStorage.clear();
    
    // 로그아웃 콜백 실행
    onLogout();
    
    // 홈페이지로 리다이렉트
    router.push('/');
  };

  const handleMyPageClick = () => {
    router.push('/mypage');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>
            <Link href="/" className={styles.logoText}>
              VTF
            </Link>
            <nav className={styles.nav}>
              <div className={styles.navLinks}>
                <Link href="/rankings" className={styles.navLink}>
                  랭킹
                </Link>
                <Link href="/tierlist" className={styles.navLink}>
                  티어표
                </Link>
                {currentUser?.role === 'admin' && (
                  <Link href="/admin" className={styles.navLink}>
                    관리자
                  </Link>
                )}
              </div>
            </nav>
          </div>
          <div className={styles.actions}>
            {currentUser ? (
              <div className={styles.userSection}>
                <button onClick={handleMyPageClick} className={styles.userName}>
                  {currentUser.nickname}
                </button>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            ) : (
              <div className={styles.authSection}>
                <Link href="/login" className={styles.loginButton}>
                  로그인
                </Link>
                <Link href="/signup" className={styles.signupButton}>
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 