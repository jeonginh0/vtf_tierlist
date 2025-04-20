'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import styles from '@/styles/Rankings.module.css';
import { useAuth } from '@/contexts/AuthContext';

interface RankingUser {
  _id: string;
  nickname: string;
  preferredPosition: string;
  tier: string;
  mostUsedAgent: string;
  kda: string;
  winRate: string;
}

interface AgentRanking {
  agentName: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    playCount: number;
  }[];
}

interface PositionRanking {
  position: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    mostUsedAgent: string;
  }[];
}

interface TierRanking {
  tier: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    mostUsedAgent: string;
  }[];
}

interface Tier {
  tier: string;
  color: string;
  agents: {
    userId: string;
    nickname: string;
  }[];
}

type RankingType = 'overall' | 'agent' | 'position' | 'tier';

export default function Rankings() {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [agentRankings, setAgentRankings] = useState<AgentRanking[]>([]);
  const [positionRankings, setPositionRankings] = useState<PositionRanking[]>([]);
  const [tierRankings, setTierRankings] = useState<TierRanking[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RankingType>('overall');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const { user, logout } = useAuth();

  const agents = ['제트', '바이퍼', '소바', '브림스톤', '사이퍼', '레이즈', '킬조이', '스카이', '브리치', '오멘', '페이드', '하버'];
  const positions = ['타격대', '감시자', '전략가', '척후대'];
  const tierNumbers = ['1티어', '2티어', '3티어', '4티어', '5티어'];

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const response = await fetch(`/api/rankings?type=${activeTab}`);
        if (!response.ok) {
          throw new Error('랭킹 정보를 불러올 수 없습니다.');
        }
        const data = await response.json();
        console.log('API 응답 데이터:', data);
        
        if (activeTab === 'overall') {
          setRankings(data.rankings || []);
        } else if (activeTab === 'agent') {
          setAgentRankings(data.rankings || []);
        } else if (activeTab === 'position') {
          setPositionRankings(data.rankings || []);
        } else if (activeTab === 'tier') {
          setTierRankings(data.rankings || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    const fetchTierList = async () => {
      try {
        const response = await fetch('/api/tierlist');
        if (!response.ok) {
          throw new Error('티어 목록을 불러올 수 없습니다.');
        }
        const data = await response.json();
        console.log('티어 목록 데이터:', data);
        setTiers(data.tiers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      }
    };

    fetchRankings();
    fetchTierList();
  }, [activeTab]);

  const getTierColor = (tier: string) => {
    const tierInfo = tiers.find(t => t.tier === tier);
    return tierInfo?.color || '#000000';
  };

  const renderOverallRankings = () => (
    <div className={styles.rankingsContainer}>
      <table className={styles.rankingsTable}>
        <thead>
          <tr>
            <th>순위</th>
            <th>닉네임</th>
            <th>주요 포지션</th>
            <th>티어</th>
            <th>주요 요원</th>
            <th>K/D</th>
            <th>승률</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((user, index) => (
            <tr key={user._id}>
              <td>{index + 1}</td>
              <td>{user.nickname}</td>
              <td>{user.preferredPosition}</td>
              <td style={{ color: getTierColor(user.tier) }}>{user.tier}</td>
              <td>{user.mostUsedAgent}</td>
              <td>{user.kda}</td>
              <td>{user.winRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAgentRankings = () => (
    <div className={styles.rankingsContainer}>
      <div className={styles.filterButtons}>
        {agents.map((agent) => (
          <button
            key={agent}
            className={`${styles.filterButton} ${selectedAgent === agent ? styles.active : ''}`}
            onClick={() => setSelectedAgent(agent)}
          >
            {agent}
          </button>
        ))}
      </div>
      {agentRankings
        .filter(ranking => !selectedAgent || ranking.agentName === selectedAgent)
        .map(ranking => (
          <div key={ranking.agentName} className={styles.rankingSection}>
            <h3 className={styles.sectionTitle}>{ranking.agentName}</h3>
            <table className={styles.rankingsTable}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>K/D</th>
                  <th>승률</th>
                  <th>플레이 수</th>
                </tr>
              </thead>
              <tbody>
                {ranking.users.map((user, index) => (
                  <tr key={`${ranking.agentName}-${user.nickname}`}>
                    <td>{index + 1}</td>
                    <td>{user.nickname}</td>
                    <td>{user.kda}</td>
                    <td>{user.winRate}</td>
                    <td>{user.playCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );

  const renderPositionRankings = () => (
    <div className={styles.rankingsContainer}>
      <div className={styles.filterButtons}>
        {positions.map((position) => (
          <button
            key={position}
            className={`${styles.filterButton} ${selectedPosition === position ? styles.active : ''}`}
            onClick={() => setSelectedPosition(position)}
          >
            {position}
          </button>
        ))}
      </div>
      {positionRankings
        .filter(ranking => !selectedPosition || ranking.position === selectedPosition)
        .map(ranking => (
          <div key={ranking.position} className={styles.rankingSection}>
            <h3 className={styles.sectionTitle}>{ranking.position}</h3>
            <table className={styles.rankingsTable}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>주요 요원</th>
                  <th>K/D</th>
                  <th>승률</th>
                </tr>
              </thead>
              <tbody>
                {ranking.users.map((user, index) => (
                  <tr key={`${ranking.position}-${user.nickname}`}>
                    <td>{index + 1}</td>
                    <td>{user.nickname}</td>
                    <td>{user.mostUsedAgent}</td>
                    <td>{user.kda}</td>
                    <td>{user.winRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );

  const renderTierRankings = () => (
    <div className={styles.rankingsContainer}>
      <div className={styles.filterButtons}>
        {tierNumbers.map((tier) => (
          <button
            key={tier}
            className={`${styles.filterButton} ${selectedTier === tier ? styles.active : ''}`}
            onClick={() => setSelectedTier(tier)}
          >
            {tier}
          </button>
        ))}
      </div>
      {tierRankings
        .filter(ranking => !selectedTier || ranking.tier === selectedTier)
        .map(ranking => (
          <div key={ranking.tier} className={styles.rankingSection}>
            <h3 className={styles.sectionTitle} style={{ color: getTierColor(ranking.tier) }}>
              {ranking.tier}
            </h3>
            <table className={styles.rankingsTable}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>주요 요원</th>
                  <th>K/D</th>
                  <th>승률</th>
                </tr>
              </thead>
              <tbody>
                {ranking.users.map((user, index) => (
                  <tr key={`${ranking.tier}-${user.nickname}`}>
                    <td>{index + 1}</td>
                    <td>{user.nickname}</td>
                    <td>{user.mostUsedAgent}</td>
                    <td>{user.kda}</td>
                    <td>{user.winRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );

  return (
    <>
      <Header 
        currentUser={user}
        onLogout={logout}
      />
      <main className={styles.mainContent}>
        <div className={styles.container}>
          <div className={styles.rankingsSection}>
            <h1 className={styles.sectionTitle}>랭킹</h1>
            
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'overall' ? styles.active : ''}`}
                onClick={() => setActiveTab('overall')}
              >
                전체 랭킹
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'agent' ? styles.active : ''}`}
                onClick={() => setActiveTab('agent')}
              >
                요원별 랭킹
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'position' ? styles.active : ''}`}
                onClick={() => setActiveTab('position')}
              >
                포지션별 랭킹
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'tier' ? styles.active : ''}`}
                onClick={() => setActiveTab('tier')}
              >
                티어별 랭킹
              </button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            {loading ? (
              <p className={styles.loading}>로딩 중...</p>
            ) : (
              <>
                {activeTab === 'overall' && renderOverallRankings()}
                {activeTab === 'agent' && renderAgentRankings()}
                {activeTab === 'position' && renderPositionRankings()}
                {activeTab === 'tier' && renderTierRankings()}
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 