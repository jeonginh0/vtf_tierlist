'use client';

import React, { useState, useEffect } from 'react';

interface AgentStats {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  wins: number;
  losses: number;
}

interface User {
  _id: string;
  email: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  agentStats: AgentStats[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">로딩 중...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">{error}</div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">사용자 정보를 찾을 수 없습니다.</div>;
  }

  const calculateKDA = (kills: number, deaths: number) => {
    return deaths === 0 ? kills.toFixed(2) : (kills / deaths).toFixed(2);
  };

  const calculateWinRate = (wins: number, losses: number) => {
    const total = wins + losses;
    return total === 0 ? '0%' : `${((wins / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">프로필</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">닉네임</p>
            <p className="font-medium">{user.nickname}</p>
          </div>
          <div>
            <p className="text-gray-600">발로란트 닉네임</p>
            <p className="font-medium">{user.valorantNickname}</p>
          </div>
          <div>
            <p className="text-gray-600">선호 포지션</p>
            <p className="font-medium">{user.preferredPosition}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">요원 통계</h2>
        {user.agentStats && user.agentStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요원</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">플레이 횟수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">K/D/A</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승률</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승/패</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {user.agentStats.map((stat) => (
                  <tr key={stat.agentName}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{stat.agentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.playCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{calculateKDA(stat.kills, stat.deaths)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{calculateWinRate(stat.wins, stat.losses)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{stat.wins}승 {stat.losses}패</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">아직 요원 통계가 없습니다.</p>
        )}
      </div>
    </div>
  );
} 