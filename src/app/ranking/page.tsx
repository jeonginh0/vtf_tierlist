'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/styles/Rankings.module.css';

interface User {
  _id: string;
  nickname: string;
  tier: string;
  preferredPosition: string;
  mainAgent: string;
  mostUsedAgent?: string;
  kda?: string;
  winRate?: string;
  agentStats?: Array<{
    agentName: string;
    kills: number;
    deaths: number;
    wins: number;
    losses: number;
    playCount: number;
  }>;
}

const RankingPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [selectedMainAgent, setSelectedMainAgent] = useState<string>('');

  const agents = ['바이퍼', '소바', '브림스톤', '사이퍼', '제트', '레이즈', '브리치', '오멘', '킬조이', '스카이', '요루', '아스트라', '페이드', '하버', '게코', '데드록', '네온', '클로브'];
  const tiers = ['1티어', '2티어', '3티어', '4티어', '5티어'];
  const positions = ['타격대', '척후대', '감시자', '전략가'];

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('API 호출 시작');
        const response = await fetch('/api/rankings');
        console.log('API 응답 상태:', response.status);
        const data = await response.json();
        console.log('API 응답 데이터:', JSON.stringify(data, null, 2));
        
        if (data && data.rankings) {
          console.log('rankings 데이터:', data.rankings);
          const usersWithMainAgent = data.rankings.map((user: User) => {
            console.log('사용자 데이터:', {
              nickname: user.nickname,
              mostUsedAgent: user.mostUsedAgent,
              tier: user.tier,
              preferredPosition: user.preferredPosition,
              kda: user.kda,
              winRate: user.winRate
            });
            return {
              ...user,
              mainAgent: user.mostUsedAgent || '없음'
            };
          });
          console.log('처리된 사용자 데이터:', usersWithMainAgent);
          setUsers(usersWithMainAgent);
        } else {
          console.error('API 응답에 rankings 데이터가 없습니다:', data);
        }
      } catch (error) {
        console.error('사용자 목록 로딩 오류:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('users 상태 변경:', users.map(user => ({
      nickname: user.nickname,
      mostUsedAgent: user.mostUsedAgent,
      tier: user.tier,
      preferredPosition: user.preferredPosition
    })));
  }, [users]);

  const calculateTotalGames = (user: User) => {
    return user.agentStats?.reduce((sum, stat) => sum + stat.wins + stat.losses, 0) || 0;
  };

  const filteredUsers = users.filter(user => {
    const matchesAgent = !selectedAgent || user.agentStats?.some(stat => stat.agentName === selectedAgent);
    const matchesTier = !selectedTier || user.tier === selectedTier;
    const matchesPosition = !selectedPosition || user.preferredPosition === selectedPosition;
    const matchesMainAgent = !selectedMainAgent || user.mostUsedAgent === selectedMainAgent;
    console.log('필터링된 사용자:', {
      nickname: user.nickname,
      mostUsedAgent: user.mostUsedAgent,
      tier: user.tier,
      preferredPosition: user.preferredPosition,
      matchesAgent,
      matchesTier,
      matchesPosition,
      matchesMainAgent
    });
    return matchesAgent && matchesTier && matchesPosition && matchesMainAgent;
  });

  console.log('최종 filteredUsers:', filteredUsers.map(user => ({
    nickname: user.nickname,
    mostUsedAgent: user.mostUsedAgent,
    tier: user.tier,
    preferredPosition: user.preferredPosition
  })));

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>랭킹</h1>
      
      <div className={styles.filters}>
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className={styles.filter}
        >
          <option value="">모든 요원</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>

        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className={styles.filter}
        >
          <option value="">모든 티어</option>
          {tiers.map(tier => (
            <option key={tier} value={tier}>{tier}</option>
          ))}
        </select>

        <select
          value={selectedPosition}
          onChange={(e) => setSelectedPosition(e.target.value)}
          className={styles.filter}
        >
          <option value="">모든 포지션</option>
          {positions.map(position => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>

        <select
          value={selectedMainAgent}
          onChange={(e) => setSelectedMainAgent(e.target.value)}
          className={styles.filter}
        >
          <option value="">모든 주요 요원</option>
          {agents.map(agent => (
            <option key={agent} value={agent}>{agent}</option>
          ))}
        </select>
      </div>

      {/* 전체 랭킹 */}
      <div className={styles.rankingSection}>
        <h2 className={styles.sectionTitle}>전체 랭킹</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>순위</th>
              <th>닉네임</th>
              <th>티어</th>
              <th>포지션</th>
              <th>주요 요원</th>
              <th>K/D</th>
              <th>승률</th>
              <th>게임 수</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user, index) => {
              console.log('전체 랭킹 - 사용자:', {
                nickname: user.nickname,
                mostUsedAgent: user.mostUsedAgent
              });
              return (
                <tr key={user._id}>
                  <td>{index + 1}</td>
                  <td>{user.nickname}</td>
                  <td>{user.tier}</td>
                  <td>{user.preferredPosition}</td>
                  <td>{user.mostUsedAgent || '없음'}</td>
                  <td>{user.kda}</td>
                  <td>{user.winRate}</td>
                  <td>{calculateTotalGames(user)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 포지션별 랭킹 */}
      {positions.map(position => {
        const positionUsers = users.filter(user => user.preferredPosition === position);
        if (positionUsers.length === 0) return null;

        console.log(`${position} 랭킹 - 사용자들:`, positionUsers.map(user => ({
          nickname: user.nickname,
          mostUsedAgent: user.mostUsedAgent
        })));

        return (
          <div key={position} className={styles.rankingSection}>
            <h2 className={styles.sectionTitle}>{position} 랭킹</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>티어</th>
                  <th>주요 요원</th>
                  <th>K/D</th>
                  <th>승률</th>
                  <th>게임 수</th>
                </tr>
              </thead>
              <tbody>
                {positionUsers.map((user, index) => {
                  console.log(`${position} 랭킹 - 사용자:`, {
                    nickname: user.nickname,
                    mostUsedAgent: user.mostUsedAgent
                  });
                  return (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user.nickname}</td>
                      <td>{user.tier}</td>
                      <td>{user.mostUsedAgent || '없음'}</td>
                      <td>{user.kda}</td>
                      <td>{user.winRate}</td>
                      <td>{calculateTotalGames(user)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* 티어별 랭킹 */}
      {tiers.map(tier => {
        const tierUsers = users.filter(user => user.tier === tier);
        if (tierUsers.length === 0) return null;

        console.log(`${tier} 랭킹 - 사용자들:`, tierUsers.map(user => ({
          nickname: user.nickname,
          mostUsedAgent: user.mostUsedAgent
        })));

        return (
          <div key={tier} className={styles.rankingSection}>
            <h2 className={styles.sectionTitle}>{tier} 랭킹</h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>닉네임</th>
                  <th>포지션</th>
                  <th>주요 요원</th>
                  <th>K/D</th>
                  <th>승률</th>
                  <th>게임 수</th>
                </tr>
              </thead>
              <tbody>
                {tierUsers.map((user, index) => {
                  console.log(`${tier} 랭킹 - 사용자:`, {
                    nickname: user.nickname,
                    mostUsedAgent: user.mostUsedAgent
                  });
                  return (
                    <tr key={user._id}>
                      <td>{index + 1}</td>
                      <td>{user.nickname}</td>
                      <td>{user.preferredPosition}</td>
                      <td>{user.mostUsedAgent || '없음'}</td>
                      <td>{user.kda}</td>
                      <td>{user.winRate}</td>
                      <td>{calculateTotalGames(user)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
};

export default RankingPage; 