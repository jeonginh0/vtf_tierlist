import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

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
  nickname: string;
  agentStats: AgentStats[];
}

interface TopPlayer {
  nickname: string;
  tier: string;
  kda: string;
  winRate: string;
  totalGames: number;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('vtf');
    
    // 모든 유저 가져오기
    const users = await db.collection<User>('users').find().toArray();
    const tiersCollection = db.collection('tiers');
    
    const topPlayers: TopPlayer[] = await Promise.all(
      users.map(async (user) => {
        // 유저의 티어 찾기
        const userTier = await tiersCollection.findOne({ 'agents.userId': user._id.toString() });
        
        // 전체 통계 계산
        const totalStats = user.agentStats?.reduce((acc, stat) => ({
          kills: acc.kills + stat.kills,
          deaths: acc.deaths + stat.deaths,
          assists: acc.assists + stat.assists,
          wins: acc.wins + stat.wins,
          losses: acc.losses + stat.losses,
          totalGames: acc.totalGames + stat.wins + stat.losses
        }), { kills: 0, deaths: 0, assists: 0, wins: 0, losses: 0, totalGames: 0 });

        const kda = totalStats.deaths > 0 
          ? `${(totalStats.kills / totalStats.deaths).toFixed(2)}/${(totalStats.assists / totalStats.deaths).toFixed(2)}`
          : '0/0';
          
        const winRate = totalStats.totalGames > 0
          ? ((totalStats.wins / totalStats.totalGames) * 100).toFixed(1)
          : '0';

        return {
          nickname: user.nickname,
          tier: userTier?.tier || '미배정',
          kda,
          winRate: `${winRate}%`,
          totalGames: totalStats.totalGames
        };
      })
    );

    // KDA 비율로 정렬
    const sortedPlayers = topPlayers.sort((a, b) => {
      const aKDA = parseFloat(a.kda.split('/')[0]);
      const bKDA = parseFloat(b.kda.split('/')[0]);
      return bKDA - aKDA;
    });

    return NextResponse.json({ topPlayers: sortedPlayers });
  } catch (error) {
    console.error('상위 플레이어 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 