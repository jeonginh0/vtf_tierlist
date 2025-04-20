'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import styles from '@/styles/MyPage.module.css';

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
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  agentStats: AgentStats[];
}

export default function MyPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    valorantNickname: '',
    preferredPosition: ''
  });
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/users/me', {
          headers: {
            'x-user-id': userId
          }
        });
        if (!response.ok) {
          throw new Error('프로필 정보를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setProfile(data);
        setEditForm({
          nickname: data.nickname,
          valorantNickname: data.valorantNickname,
          preferredPosition: data.preferredPosition
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId || ''
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error('프로필 수정에 실패했습니다.');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const calculateKDA = (kills: number, deaths: number) => {
    return deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2);
  };

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total === 0 ? '0%' : `${((wins / total) * 100).toFixed(1)}%`;
  };

  const calculateOverallStats = (agentStats: AgentStats[]) => {
    let totalKills = 0;
    let totalDeaths = 0;
    let totalWins = 0;
    let totalLosses = 0;
    let mostPlayedAgent = { agentName: '없음', playCount: 0, kd: 0 };

    agentStats?.forEach(stat => {
      totalKills += stat.kills;
      totalDeaths += stat.deaths;
      totalWins += stat.wins;
      totalLosses += stat.losses;

      const agentKD = stat.deaths === 0 ? stat.kills : stat.kills / stat.deaths;

      if (stat.playCount > mostPlayedAgent.playCount || 
          (stat.playCount === mostPlayedAgent.playCount && agentKD > mostPlayedAgent.kd)) {
        mostPlayedAgent = { 
          agentName: stat.agentName, 
          playCount: stat.playCount,
          kd: agentKD
        };
      }
    });

    const overallKD = calculateKDA(totalKills, totalDeaths);
    const overallWinRate = calculateWinRate(totalWins, totalLosses);

    return { overallKD, overallWinRate, mostPlayedAgent };
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!profile) return <div className={styles.error}>프로필을 찾을 수 없습니다.</div>;

  const { overallKD, overallWinRate, mostPlayedAgent } = calculateOverallStats(profile.agentStats || []);

  return (
    <>
      <Header />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.profileSection}>
            <h1 className={styles.title}>내 프로필</h1>
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="nickname">닉네임</label>
                  <input
                    type="text"
                    id="nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="valorantNickname">발로란트 닉네임</label>
                  <input
                    type="text"
                    id="valorantNickname"
                    value={editForm.valorantNickname}
                    onChange={(e) => setEditForm({ ...editForm, valorantNickname: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="preferredPosition">주요 포지션</label>
                  <select
                    id="preferredPosition"
                    value={editForm.preferredPosition}
                    onChange={(e) => setEditForm({ ...editForm, preferredPosition: e.target.value })}
                  >
                    <option value="">선택하세요</option>
                    <option value="감시자">감시자</option>
                    <option value="전문가">전문가</option>
                    <option value="타격대">타격대</option>
                    <option value="척후대">척후대</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveButton}>저장</button>
                  <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelButton}>취소</button>
                </div>
              </form>
            ) : (
              <div className={styles.profileInfo}>
                <p><strong>닉네임:</strong> {profile.nickname}</p>
                <p><strong>발로란트 닉네임:</strong> {profile.valorantNickname}</p>
                <p><strong>주요 포지션:</strong> {profile.preferredPosition || '미지정'}</p>
                <div className={styles.overallStats}>
                  <p><strong>전체 K/D:</strong> {overallKD}</p>
                  <p><strong>전체 승률:</strong> {overallWinRate}</p>
                  <p><strong>가장 많이 플레이한 요원:</strong> {mostPlayedAgent.agentName} ({mostPlayedAgent.playCount}회)</p>
                </div>
                <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                  프로필 수정
                </button>
              </div>
            )}
          </div>

          <div className={styles.statsSection}>
            <h2 className={styles.subtitle}>요원 통계</h2>
            <div className={styles.agentStats}>
              {profile.agentStats?.map((stat) => (
                <div key={stat.agentName} className={styles.agentCard}>
                  <h3 className={styles.agentName}>{stat.agentName}</h3>
                  <div className={styles.statInfo}>
                    <p>K/D: {calculateKDA(stat.kills, stat.deaths)}</p>
                    <p>승률: {calculateWinRate(stat.wins, stat.losses)}</p>
                    <p>플레이 수: {stat.playCount}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(stat.agentName)}
                    className={styles.detailButton}
                  >
                    상세보기
                  </button>
                </div>
              ))}
            </div>
          </div>

          {selectedAgent && profile.agentStats?.find(stat => stat.agentName === selectedAgent)?.matches && (
            <div className={styles.matchHistory}>
              <h2 className={styles.subtitle}>매치 기록 - {selectedAgent}</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className={styles.closeButton}
              >
                닫기
              </button>
              <table className={styles.matchTable}>
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>K/D/A</th>
                    <th>결과</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.agentStats
                    .find(stat => stat.agentName === selectedAgent)
                    ?.matches.map((match, index) => (
                      <tr key={index} className={match.isWin ? styles.winMatch : styles.lossMatch}>
                        <td>{new Date(match.matchDate).toLocaleDateString()}</td>
                        <td>{match.kills}/{match.deaths}/{match.assists}</td>
                        <td>{match.isWin ? '승리' : '패배'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
} 