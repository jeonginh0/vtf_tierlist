'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '@/styles/Header.module.css';

interface HeaderProps {
  currentUser: {
    id: string;
    email: string;
    nickname: string;
    role: string;
  } | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
    router.push('/');
  };

  const handleMyPageClick = () => {
    router.push('/mypage');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(`/api/users/search?nickname=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data.users);
    } catch {
      setSearchResults([]);
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.logo}>
            <Link href="/" className={styles.logoText}>
              VTF
            </Link>
          </div>
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
          <div className={styles.actions}>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="닉네임 검색"
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                검색
              </button>
            </form>
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