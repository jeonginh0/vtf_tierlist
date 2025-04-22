'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import TierList from '@/components/TierList';
import styles from '@/styles/TierList.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface Agent {
  userId: string;
  nickname: string;
}

interface Tier {
  tier: string;
  color: string;
  agents: Agent[];
}

export default function TierListPage() {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchTierList = async () => {
      try {
        const response = await fetch('/api/tierlist');
        if (response.ok) {
          const data = await response.json();
          setTiers(data.tiers);
        }
      } catch (error) {
        console.error('티어리스트 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTierList();
  }, []);

  if (isLoading) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header currentUser={user} onLogout={logout} />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>티어 리스트</h1>
          <TierList tiers={tiers} />
        </div>
      </main>
    </>
  );
} 