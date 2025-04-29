'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/MainProfile.module.css';
import { jwtDecode } from 'jwt-decode';
import Image from 'next/image';

interface UserStats {
  _id: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  tier: string;
  role: string;
  agentStats: Array<{
    agentName: string;
    playCount: number;
    wins: number;
    losses: number;
    kills: number;
    deaths: number;
    assists: number;
  }>;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  winRate: string;
  kda: string;
  mostUsedAgent: string;
  leaguePoint: number;
}

export default function MyPage() {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchUserStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        // 토큰에서 사용자 정보 디코딩
        const decoded = jwtDecode(token) as { userId: string; email: string; role: string; nickname: string };
        const response = await fetch(`/api/users/search/${decoded.nickname}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        const data = await response.json();
        setUserStats(data);
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError('사용자 정보를 불러오는데 실패했습니다.');
        if (error instanceof Error && error.message === '사용자를 찾을 수 없습니다.') {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [router]);

  if (loading) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
        </div>
      </>
    );
  }

  if (error || !userStats) {
    return (
      <>
        <Header currentUser={user} onLogout={logout} />
        <div className={styles.errorContainer}>{error}</div>
      </>
    );
  }

  return (
    <>
      <Header currentUser={user} onLogout={logout} />
      <div className={styles.profileContainer}>
        <div className={styles.container}>
          {/* 프로필 헤더 */}
          <div className={styles.profileHeader}>
            <div className={styles.profileContent}>
              <div className={styles.avatar}>
                {userStats.nickname[0]}
              </div>
              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>{userStats.nickname}</h1>
                <div className={styles.infoGrid}>
                  <div>
                    <p className={styles.infoLabel}>발로란트 닉네임</p>
                    <p className={styles.infoValue}>{userStats.valorantNickname}</p>
                  </div>
                  <div>
                    <p className={styles.infoLabel}>티어</p>
                    <p className={styles.infoValue}>{userStats.tier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h2 className={`${styles.statTitle} ${styles.statTitleBlue}`}>주요 요원</h2>
              <div className={styles.statLabel}>
                <div className={`${styles.statCircle} ${styles.statCircleBlue}`}>
                  <Image 
                    src={`/agent/${userStats.mostUsedAgent}.svg`} 
                    alt={userStats.mostUsedAgent}
                    width={40}
                    height={40}
                    className={styles.agentIcon}
                  />
                </div>
                <p>{userStats.mostUsedAgent}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <h2 className={`${styles.statTitle} ${styles.statTitleGreen}`}>선호 포지션</h2>
              <div className={styles.statLabel}>
                <div className={`${styles.statCircle} ${styles.statCircleGreen}`}>
                  <Image 
                    src={`/position/${userStats.preferredPosition}.svg`} 
                    alt={userStats.preferredPosition}
                    width={40}
                    height={40}
                    className={styles.positionIcon}
                  />
                </div>
                <p>{userStats.preferredPosition}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <h2 className={`${styles.statTitle} ${styles.statTitlePurple}`}>전체 통계</h2>
              <div className={styles.statsRow}>
                <div className={styles.statCirclePurple}>
                  <span className={styles.statValuePurple}>{userStats.totalGames}</span>
                </div>
                <div className={styles.statCirclePurple}>
                  <span className={styles.statValuePurple}>{userStats.winRate}%</span>
                </div>
                <div className={styles.statCirclePurple}>
                  <span className={styles.statValuePurple}>{userStats.leaguePoint || 0}</span>
                </div>
              </div>
              <div className={styles.statsLabelRow}>
                <span>총 게임</span>
                <span>승률</span>
                <span>LP</span>
              </div>
            </div>
          </div>

          {/* 요원 통계 테이블 */}
          <div className={styles.statsTable}>
            <h2 className={styles.tableTitle}>요원별 통계</h2>
            <div className="overflow-x-auto">
              <table className={styles.table}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th>요원</th>
                    <th>플레이</th>
                    <th>K/D/A</th>
                    <th>승률</th>
                    <th>승/패</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {userStats.agentStats.map((stat) => {
                    const winRate = stat.playCount > 0
                      ? ((stat.wins / stat.playCount) * 100).toFixed(1)
                      : '0.0';
                    const kda = stat.deaths > 0
                      ? ((stat.kills + stat.assists) / stat.deaths).toFixed(2)
                      : '0.00';

                    return (
                      <tr key={stat.agentName} className={styles.tableRow}>
                        <td className={styles.tableCell}>
                          <div className={styles.agentCell}>
                            <Image 
                              src={`/agent/${stat.agentName}.svg`} 
                              alt={stat.agentName}
                              width={24}
                              height={24}
                              className={styles.agentIcon}
                            />
                            <span>{stat.agentName}</span>
                          </div>
                        </td>
                        <td className={styles.tableCell}>{stat.playCount}게임</td>
                        <td className={styles.tableCell}>{kda}</td>
                        <td className={styles.tableCell}>{winRate}%</td>
                        <td className={styles.tableCell}>
                          <span className={styles.winText}>{stat.wins}승</span>{' '}
                          <span className={styles.lossText}>{stat.losses}패</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 