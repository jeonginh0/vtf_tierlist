'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/Rankings.module.css';

interface RankingUser {
  _id: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  tier: string;
  mostUsedAgent: string;
  kda: string;
  winRate: string;
  totalGames: number;
}

export default function Rankings() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch('/api/rankings');
        if (!response.ok) {
          throw new Error('랭킹 정보를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setRankings(data.rankings || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  return (
    <>
      <Header 
        currentUser={user}
        onLogout={logout}
      />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.rankingsSection}>
            <h1 className={styles.sectionTitle}>전체 랭킹</h1>
            
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.loading}>로딩 중...</p>
            ) : (
              <table className={styles.rankingsTable}>
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>닉네임</th>
                    <th>주요 포지션</th>
                    <th>티어</th>
                    <th>주요 요원</th>
                    <th>KDA</th>
                    <th>승률</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((user, index) => (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user.nickname}</td>
                      <td>
                        <div className={styles.positionCell}>
                          <img 
                            src={`/position/${user.preferredPosition}.svg`} 
                            alt={user.preferredPosition}
                            className={styles.positionIcon}
                          />
                          <span>{user.preferredPosition}</span>
                        </div>
                      </td>
                      <td>{user.tier}</td>
                      <td>
                        <div className={styles.agentCell}>
                          <img 
                            src={`/agent/${user.mostUsedAgent}.svg`} 
                            alt={user.mostUsedAgent}
                            className={styles.agentIcon}
                          />
                          <span>{user.mostUsedAgent}</span>
                        </div>
                      </td>
                      <td>{user.kda}</td>
                      <td>{user.winRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 