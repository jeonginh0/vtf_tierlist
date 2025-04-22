'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Image from 'next/image';
import styles from '@/styles/Home.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface TopPlayer {
  nickname: string;
  tier: string;
  kda: number;
  winRate: number;
  totalGames: number;
}

export default function Home() {
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const response = await fetch('/api/rankings');
        if (!response.ok) {
          throw new Error('상위 플레이어 정보를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setTopPlayers(data.rankings.slice(0, 3).map((player: TopPlayer) => ({
          nickname: player.nickname,
          tier: player.tier,
          kda: player.kda,
          winRate: player.winRate,
          totalGames: player.totalGames || 0
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
  }, []);

  return (
    <>
      <Header 
        currentUser={user} 
        onLogout={logout} 
      />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            <div className={styles.heroImageContainer}>
              <Image src="/VTFIMG.svg" alt="VTF" width={800} height={800} className={styles.heroImage} />
              <div className={styles.heroTextContainer}>
                <h1 className={styles.heroTitle}>
                  Ready for your Team Fight
                </h1>
                <h2 className={styles.heroSubtitle}>
                  VTF에서 체계적인 내전을 지원합니다!
                </h2>
              </div>
              <div className={styles.scrollIndicator}>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={styles.scrollArrow} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Main Categories */}
          <div className={styles.categoriesGrid}>
            {/* Rank */}
            <div className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <Image src="/main-rank-img.svg" alt="Rank" width={120} height={120} className="mx-auto" />
              </div>
              <h3 className={styles.categoryTitle}>랭킹</h3>
              <p className={styles.categoryDescription}>
                내 실력은 어떨까?
                <br />
                VTF 에서의 
                <br />
                당신의 랭킹을 확인하세요!
              </p>
            </div>

            {/* Team Build -> Tier List */}
            <div className={styles.categoryCard}>
              <div className={styles.categoryIcon}>
                <Image src="/main-team-img.svg" alt="Tier List" width={120} height={120} className="mx-auto" />
              </div>
              <h3 className={styles.categoryTitle}>티어리스트</h3>
              <p className={styles.categoryDescription}>
                VTF의
                <br />
                티어리스트를 확인하세요!
              </p>
            </div>
          </div>

          {/* Top Players */}
          <div className={styles.topPlayers}>
            <h2 className={styles.sectionTitle}>Top Player</h2>
            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.loading}>로딩 중...</p>
            ) : (
              <table className={styles.playerTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>KDA</th>
                    <th>Tier</th>
                    <th>Win / Lose</th>
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.slice(0, 3).map((player, index) => (
                    <tr key={index} className={styles.playerRow}>
                      <td className={styles.playerRank}>{index + 1}</td>
                      <td>{player.nickname}</td>
                      <td className={styles.kda}>{player.kda}</td>
                      <td className={styles.tier}>{player.tier}</td>
                      <td className={styles.winRate}>{player.winRate}</td>
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

