'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/Search.module.css';

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    router.push(`/profile/${searchTerm}`);
  };

  return (
    <>
      <Header 
        currentUser={user}
        onLogout={logout}
      />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.searchSection}>
            <h1 className={styles.sectionTitle}>사용자 검색</h1>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색할 닉네임을 입력하세요"
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                검색
              </button>
            </form>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      </main>
    </>
  );
} 