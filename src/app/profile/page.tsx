'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';

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
  tier: string;
  role: string;
  agentStats: AgentStats[];
  mostUsedAgent: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, logout } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
          throw new Error('사용자 정보를 불러올 수 없습니다.');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const calculateKDA = (kills: number, deaths: number, assists: number) => {
    return deaths === 0 ? 'Perfect' : ((kills + assists) / deaths).toFixed(2);
  };

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total === 0 ? '0%' : `${((wins / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <>
        <Header currentUser={currentUser} onLogout={logout} />
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header currentUser={currentUser} onLogout={logout} />
        <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header currentUser={currentUser} onLogout={logout} />
        <div className="flex justify-center items-center min-h-screen">사용자 정보를 찾을 수 없습니다.</div>
      </>
    );
  }

  const totalGames = user.agentStats.reduce((acc, curr) => acc + curr.playCount, 0);
  const totalWins = user.agentStats.reduce((acc, curr) => acc + curr.wins, 0);
  const totalLosses = user.agentStats.reduce((acc, curr) => acc + curr.losses, 0);
  const totalKills = user.agentStats.reduce((acc, curr) => acc + curr.kills, 0);
  const totalDeaths = user.agentStats.reduce((acc, curr) => acc + curr.deaths, 0);
  const totalAssists = user.agentStats.reduce((acc, curr) => acc + curr.assists, 0);

  return (
    <>
      <Header currentUser={currentUser} onLogout={logout} />
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto px-4 py-8">
          {/* 프로필 헤더 */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-700">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-32 bg-blue-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {user.nickname[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold mb-2">{user.nickname}</h1>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400">발로란트 닉네임</p>
                    <p className="text-xl">{user.valorantNickname}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">티어</p>
                    <p className="text-xl">{user.tier}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 섹션 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">주요 요원</h2>
              <div className="text-center">
                <div className="w-24 h-24 bg-blue-900 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold">{user.mostUsedAgent}</span>
                </div>
                <p className="text-gray-400">가장 많이 사용한 요원</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-green-400">선호 포지션</h2>
              <div className="text-center">
                <div className="w-24 h-24 bg-green-900 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                  <span className="text-3xl font-bold">{user.preferredPosition}</span>
                </div>
                <p className="text-gray-400">주로 플레이하는 포지션</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">전체 통계</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400">총 게임</p>
                  <p className="text-2xl font-bold">{totalGames}게임</p>
                </div>
                <div>
                  <p className="text-gray-400">승률</p>
                  <p className="text-2xl font-bold">{calculateWinRate(totalWins, totalLosses)}</p>
                </div>
                <div>
                  <p className="text-gray-400">KDA</p>
                  <p className="text-2xl font-bold">{calculateKDA(totalKills, totalDeaths, totalAssists)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 요원 통계 테이블 */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-yellow-400">요원별 통계</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">요원</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">플레이</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">K/D/A</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">승률</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">승/패</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {user.agentStats.map((stat) => (
                    <tr key={stat.agentName} className="hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{stat.agentName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{stat.playCount}게임</td>
                      <td className="px-6 py-4 whitespace-nowrap">{calculateKDA(stat.kills, stat.deaths, stat.assists)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{calculateWinRate(stat.wins, stat.losses)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-green-400">{stat.wins}승</span> <span className="text-red-400">{stat.losses}패</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 