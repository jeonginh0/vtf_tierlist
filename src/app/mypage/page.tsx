'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import styles from '@/styles/MyPage.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface AgentStats {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  losses: number;
  matches: {
    kills: number;
    deaths: number;
    assists: number;
    isWin: boolean;
    matchDate: string;
  }[];
}

interface UserProfile {
  _id: string;
  email: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  agentStats: AgentStats[];
}

export default function MyPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('프로필을 불러올 수 없습니다.');
        }

        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  if (loading) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.loading}>로딩 중...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.error}>{error}</div>
      </>
    );
  }

  if (!userProfile) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.error}>사용자 정보를 찾을 수 없습니다.</div>
      </>
    );
  }

  const calculateKDA = (stats: AgentStats) => {
    const totalKills = stats.kills;
    const totalDeaths = stats.deaths;
    return totalDeaths === 0 ? totalKills.toFixed(2) : (totalKills / totalDeaths).toFixed(2);
  };

  const calculateWinRate = (stats: AgentStats) => {
    const totalGames = stats.wins + stats.losses;
    return totalGames === 0 ? '0.0' : ((stats.wins / totalGames) * 100).toFixed(1);
  };

  const calculateOverallKD = (agentStats: AgentStats[]) => {
    const totalKills = agentStats.reduce((sum, stats) => sum + stats.kills, 0);
    const totalDeaths = agentStats.reduce((sum, stats) => sum + stats.deaths, 0);
    return totalDeaths === 0 ? totalKills.toFixed(2) : (totalKills / totalDeaths).toFixed(2);
  };

  const getMostPlayedAgent = (agentStats: AgentStats[]) => {
    if (agentStats.length === 0) return null;

    const sortedAgents = [...agentStats].sort((a, b) => {
      if (b.playCount !== a.playCount) {
        return b.playCount - a.playCount;
      }
      const aKD = a.deaths === 0 ? a.kills : a.kills / a.deaths;
      const bKD = b.deaths === 0 ? b.kills : b.kills / b.deaths;
      return bKD - aKD;
    });

    return sortedAgents[0];
  };

  return (
    <>
      <Header currentUser={user} onLogout={logout} />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.profileSection}>
            <h1 className={styles.title}>내 프로필</h1>
            <div className={styles.profileInfo}>
              <p><strong>닉네임:</strong> {userProfile.nickname}</p>
              <p><strong>발로란트 닉네임:</strong> {userProfile.valorantNickname}</p>
              <p><strong>선호 포지션:</strong> {userProfile.preferredPosition}</p>
            </div>
          </div>

          <div className={styles.overallStats}>
            <div className={styles.statBox}>
              <span className={styles.statTitle}>전체 K/D</span>
              <span className={styles.statValue}>{calculateOverallKD(userProfile.agentStats)}</span>
            </div>
            {getMostPlayedAgent(userProfile.agentStats) && (
              <div className={styles.statBox}>
                <span className={styles.statTitle}>최다 플레이 요원</span>
                <span className={`${styles.statValue} ${styles.mostPlayedAgent}`}>
                  {getMostPlayedAgent(userProfile.agentStats)?.agentName}
                </span>
              </div>
            )}
          </div>

          <div className={styles.statsSection}>
            <h2 className={styles.subtitle}>요원별 통계</h2>
            <div className={styles.agentStats}>
              {userProfile.agentStats.map((stats) => (
                <div key={stats.agentName} className={styles.agentCard}>
                  <h3 className={styles.agentName}>{stats.agentName}</h3>
                  <div className={styles.statGrid}>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>K/D</span>
                      <span className={styles.statValue}>{calculateKDA(stats)}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>승률</span>
                      <span className={styles.statValue}>{calculateWinRate(stats)}%</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>플레이 수</span>
                      <span className={styles.statValue}>{stats.playCount}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span className={styles.statLabel}>승/패</span>
                      <span className={styles.statValue}>{stats.wins}승 {stats.losses}패</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 