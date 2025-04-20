'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './Header.module.css';

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

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <div className={styles.leftSection}>
          <Link href="/" className={styles.logo}>
            VTF
          </Link>
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
        <div className={styles.rightSection}>
          {currentUser ? (
            <div className={styles.userSection}>
              <Link href="/mypage" className={styles.userName}>
                {currentUser.nickname}
              </Link>
              <button className={styles.logoutButton} onClick={handleLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            <div className={styles.authSection}>
              <Link href="/login" className={styles.authButton}>
                로그인
              </Link>
              <Link href="/signup" className={styles.authButton}>
                회원가입
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header; 