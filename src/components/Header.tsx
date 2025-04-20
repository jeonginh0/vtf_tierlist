'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '@/styles/Header.module.css';

const Header: React.FC = () => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 로컬 스토리지에서 사용자 정보 로드
    const user = localStorage.getItem('currentUser');
    const role = localStorage.getItem('role');
    setCurrentUser(user);
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    // 로컬 스토리지 클리어
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('valorantNickname');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    
    // 상태 업데이트
    setCurrentUser(null);
    setUserRole(null);
    
    // 홈페이지로 리다이렉트
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.content}>
          <Link href="/" className={styles.logoText}>
            VTF
          </Link>
          <nav className={styles.nav}>
            <div className={styles.navLinks}>
              <Link href="/rankings" className={styles.navLink}>
                랭킹
              </Link>
              <Link href="/tierlist" className={styles.navLink}>
                티어리스트
              </Link>
              {userRole === 'ADMIN' && (
                <Link href="/admin" className={styles.navLink}>관리</Link>
              )}
            </div>
          </nav>
          <div className={styles.actions}>
            <button className={styles.button}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {currentUser ? (
              <div className={styles.userSection}>
                <Link href="/mypage" className={styles.userName}>
                  {currentUser}
                </Link>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className={styles.loginButton}>
                  로그인
                </Link>
                <Link href="/signup" className={styles.signupButton}>
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 