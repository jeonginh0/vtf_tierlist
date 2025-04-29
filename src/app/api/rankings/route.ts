import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { ObjectId } from 'mongodb';
import { getMostUsedAgent } from '@/utils/agentStats';

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
  _id: ObjectId;
  nickname: string;
  preferredPosition: string;
  tier: string;
  agentStats: AgentStats[];
  leaguePoint?: number;
}

interface RankingUser {
  _id: string;
  nickname: string;
  preferredPosition: string;
  tier: string;
  mostUsedAgent: string;
  kda: string;
  winRate: string;
  leaguePoint: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall';
    
    console.log('랭킹 API 호출 - 타입:', type);
    
    const db = await connectDB();
    
    const users = await db.collection('users').find({}).toArray() as User[];
    console.log('DB에서 가져온 사용자 수:', users.length);
    
    const tiersCollection = db.collection('tiers');
    
    // 전체 랭킹
    const rankings: RankingUser[] = await Promise.all(users.map(async (user) => {
      const userTier = await tiersCollection.findOne({ 'agents.userId': user._id.toString() });
        
      const totalKills = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.kills, 0) || 0;
      const totalDeaths = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.deaths, 0) || 0;
      const totalAssists = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.assists, 0) || 0;
      const kda = totalDeaths === 0 
        ? 'Perfect' 
        : ((totalKills + totalAssists) / totalDeaths).toFixed(2);

      const totalWins = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.wins, 0) || 0;
      const totalLosses = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.losses, 0) || 0;
      const totalGames = totalWins + totalLosses;
      const winRate = totalGames === 0 
        ? '0%' 
        : `${((totalWins / totalGames) * 100).toFixed(1)}%`;

      return {
        _id: user._id.toString(),
        nickname: user.nickname,
        preferredPosition: user.preferredPosition || '미지정',
        tier: userTier?.tier || '미배정',
        mostUsedAgent: getMostUsedAgent(user.agentStats || []),
        kda,
        winRate,
        leaguePoint: user.leaguePoint || 0
      };
    }));

    rankings.sort((a, b) => {
      // 리그 포인트로 먼저 정렬
      if (a.leaguePoint !== b.leaguePoint) {
        return b.leaguePoint - a.leaguePoint;
      }
      
      // 리그 포인트가 같으면 기존 정렬 로직 적용
      if (a.mostUsedAgent === '없음' && a.kda === 'Perfect') return 1;
      if (b.mostUsedAgent === '없음' && b.kda === 'Perfect') return -1;
        
      if (a.kda === 'Perfect' && b.kda !== 'Perfect') return -1;
      if (b.kda === 'Perfect' && a.kda !== 'Perfect') return 1;
      return parseFloat(b.kda) - parseFloat(a.kda);
    });

    console.log('전체 랭킹 데이터:', rankings);
    return NextResponse.json({ rankings });
  } catch (error) {
    console.error('랭킹 정보 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 