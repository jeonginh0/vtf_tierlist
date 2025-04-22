'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import styles from '@/styles/Admin.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface AgentStats {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  losses: number;
}

interface User {
  _id: string;
  email: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  role: string;
  agentStats: AgentStats[];
}

interface TierAgent {
  userId: string;
  nickname: string;
}

interface Tier {
  tier: string;
  color: string;
  agents: TierAgent[];
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [agentStats, setAgentStats] = useState({
    agentName: '',
    kills: 0,
    deaths: 0,
    assists: 0,
    isWin: false,
    isLoss: false
  });
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkAdmin = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('권한이 없습니다.');
        }
        
        const data = await response.json();
        if (data.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        
        await fetchUsers();
        await fetchTierList();
        setLoading(false);
      } catch (error) {
        console.error('인증 오류:', error);
        router.push('/login');
      }
    };

    checkAdmin();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('사용자 목록을 불러올 수 없습니다.');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const fetchTierList = async () => {
    try {
      const response = await fetch('/api/tierlist');
      if (!response.ok) {
        throw new Error('티어 목록을 불러올 수 없습니다.');
      }
      const data = await response.json();
      console.log('티어 데이터:', data);
      setTiers(data.tiers);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleAddToTier = async () => {
    if (!selectedUser || !selectedTier) {
      setError('사용자와 티어를 선택해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/tierlist', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          tierName: selectedTier,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '티어 추가에 실패했습니다.');
      }

      await fetchTierList();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleRemoveFromTier = async (tierName: string, userId: string) => {
    try {
      const response = await fetch('/api/tierlist', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
        body: JSON.stringify({
          userId,
          tierName,
          action: 'remove',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '티어에서 제거하는데 실패했습니다.');
      }

      await fetchTierList();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  const handleWinLossChange = (type: 'win' | 'loss') => {
    setAgentStats(prev => ({
      ...prev,
      isWin: type === 'win',
      isLoss: type === 'loss',
    }));
  };

  const calculateUserStats = (user: User) => {
    const agentStats = user.agentStats || [];

    if (!agentStats || agentStats.length === 0) {
      return {
        averageKD: '0.00',
        totalGames: 0,
        mostPlayedAgent: '없음',
        mostPlayedCount: 0
      };
    }

    const totalStats = agentStats.reduce((acc, stat) => ({
      kills: acc.kills + stat.kills,
      deaths: acc.deaths + stat.deaths,
      totalGames: acc.totalGames + stat.wins + stat.losses
    }), { kills: 0, deaths: 0, totalGames: 0 });

    const mostPlayedAgent = agentStats.reduce((max, current) => 
      current.playCount > max.playCount ? current : max
    , agentStats[0]);

    return {
      averageKD: totalStats.deaths === 0 ? totalStats.kills.toFixed(2) : (totalStats.kills / totalStats.deaths).toFixed(2),
      totalGames: totalStats.totalGames,
      mostPlayedAgent: mostPlayedAgent.agentName,
      mostPlayedCount: mostPlayedAgent.playCount
    };
  };

  const handleUpdateAgentStats = async () => {
    if (!selectedUser || !agentStats.agentName || agentStats.kills < 0 || agentStats.deaths < 0 || agentStats.assists < 0) {
      setError('모든 필드를 입력해주세요.');
      return;
    }
  
    if (!agentStats.isWin && !agentStats.isLoss) {
      setError('승/패를 선택해주세요.');
      return;
    }
  
    const userData = users.find((u) => u._id === selectedUser);
    const existingAgent = userData?.agentStats.find((a) => a.agentName === agentStats.agentName);
  
    const updatedStats = {
      userId: selectedUser,
      agentName: agentStats.agentName,
      kills: (existingAgent?.kills || 0) + agentStats.kills,
      deaths: (existingAgent?.deaths || 0) + agentStats.deaths,
      assists: (existingAgent?.assists || 0) + agentStats.assists,
      wins: (existingAgent?.wins || 0) + (agentStats.isWin ? 1 : 0),
      losses: (existingAgent?.losses || 0) + (agentStats.isLoss ? 1 : 0),
      playCount: (existingAgent?.playCount || 0) + 1,
      isWin: agentStats.isWin,  // 승리 여부를 추가
      isLoss: agentStats.isLoss  // 패배 여부를 추가
    };

    try {
      const response = await fetch(`/api/users/id/${selectedUser}/agent-stats`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStats),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '요원 통계 업데이트에 실패했습니다.');
      }
  
      await fetchUsers();
      setError(null);
      setAgentStats({
        agentName: '',
        kills: 0,
        deaths: 0,
        assists: 0,
        isWin: false,
        isLoss: false
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <>
        <Header 
          currentUser={user}
          onLogout={logout}
        />
        <div className={styles.loading}>로딩 중...</div>
      </>
    );
  }

  return (
    <>
      <Header 
        currentUser={user}
        onLogout={logout}
      />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <h1 className={styles.title}>관리자 페이지</h1>
          
          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>티어 관리</h2>
            <div className={styles.formGroup}>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.select}
              >
                <option value="">사용자 선택</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.nickname} ({user.valorantNickname})
                  </option>
                ))}
              </select>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className={styles.select}
              >
                <option value="">티어 선택</option>
                {tiers.map((tier, index) => (
                  <option key={index} value={tier.tier}>
                    {tier.tier}
                  </option>
                ))}
              </select>
              <button onClick={handleAddToTier} className={styles.button}>
                티어 추가
              </button>
            </div>

            <div className={styles.tierList}>
              {tiers.map((tier, index) => (
                <div 
                  key={index}
                  className={styles.tier} 
                  style={{ borderColor: tier.color }}
                  data-tier-number={tier.tier}
                >
                  <h3 className={styles.tierTitle} style={{ color: tier.color }}>
                    {tier.tier}
                  </h3>
                  <div className={styles.agentList}>
                    {tier.agents.map((agent) => (
                      <div key={agent.userId} className={styles.agent}>
                        <span>{agent.nickname}</span>
                        <button
                          onClick={() => handleRemoveFromTier(tier.tier, agent.userId)}
                          className={styles.removeButton}
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.statsSection}>
            <h2 className={styles.sectionTitle}>요원 통계 관리</h2>
            <div className={styles.statsForm}>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.statsInput}
              >
                <option value="">사용자 선택</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.nickname} ({user.valorantNickname})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="요원 이름"
                value={agentStats.agentName}
                onChange={(e) => setAgentStats({ ...agentStats, agentName: e.target.value })}
                className={styles.statsInput}
              />
              <input
                type="number"
                placeholder="킬 수"
                value={agentStats.kills}
                onChange={(e) => setAgentStats({ ...agentStats, kills: parseInt(e.target.value) })}
                className={styles.statsInput}
              />
              <input
                type="number"
                placeholder="데스 수"
                value={agentStats.deaths}
                onChange={(e) => setAgentStats({ ...agentStats, deaths: parseInt(e.target.value) })}
                className={styles.statsInput}
              />
              <input
                type="number"
                placeholder="어시스트 수"
                value={agentStats.assists}
                onChange={(e) => setAgentStats({ ...agentStats, assists: parseInt(e.target.value) })}
                className={styles.statsInput}
              />
              <div className={styles.checkboxGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={agentStats.isWin}
                    onChange={() => handleWinLossChange('win')}
                    disabled={agentStats.isLoss}
                  />
                  승리
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={agentStats.isLoss}
                    onChange={() => handleWinLossChange('loss')}
                    disabled={agentStats.isWin}
                  />
                  패배
                </label>
              </div>
              <button onClick={handleUpdateAgentStats} className={styles.button}>
                통계 업데이트
              </button>
            </div>

            {selectedUser && (
              <div className={styles.agentStats}>
                <h3 className={styles.sectionTitle}>사용자 통계</h3>
                {(() => {
                  const user = users.find(u => u._id === selectedUser);
                  if (!user) return null;
                  const stats = calculateUserStats(user);
                  return (
                    <div className={styles.userStats}>
                      <p>전체 K/D: {stats.averageKD}</p>
                      <p>총 게임 수: {stats.totalGames}</p>
                      <p>가장 많이 사용한 요원: {stats.mostPlayedAgent} ({stats.mostPlayedCount}회)</p>
                    </div>
                  );
                })()}
                <h3 className={styles.sectionTitle}>요원별 통계</h3>
                <table className={styles.statsTable}>
                  <thead>
                    <tr>
                      <th>요원</th>
                      <th>플레이 횟수</th>
                      <th>K/D</th>
                      <th>승률</th>
                      <th>승/패</th>
                    </tr>
                  </thead>
                  <tbody>
                  {users.find(u => u._id === selectedUser)?.agentStats?.map((stat) => (
                    <tr key={stat.agentName}>
                      <td>{stat.agentName}</td>
                      <td>{stat.playCount}</td>
                      <td>{stat.deaths === 0 ? stat.kills.toFixed(2) : (stat.kills / stat.deaths).toFixed(2)}</td>
                      <td>{((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(1)}%</td>
                      <td>{stat.wins}승 {stat.losses}패</td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 