import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

interface AgentStat {
  agentName: string;
  playCount: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface UserWithStats {
  _id: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  tier: string;
  role: string;
  agentStats: AgentStat[];
}

function getMostUsedAgent(agentStats: AgentStat[]): string {
  if (!agentStats || agentStats.length === 0) return '없음';
  return agentStats.reduce((prev, current) => 
    (prev.playCount > current.playCount) ? prev : current
  ).agentName;
}

export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const nickname = decodeURIComponent(pathname.split('/').pop() || '');

    console.log('검색할 닉네임:', nickname);

    await connectDB();

    const user = await User.findOne(
      { nickname },
      {
        _id: 1,
        nickname: 1,
        valorantNickname: 1,
        preferredPosition: 1,
        tier: 1,
        role: 1,
        agentStats: 1,
      }
    )
      .hint({ nickname: 1 })
      .lean()
      .maxTimeMS(10000);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const typedUser = user as unknown as UserWithStats;

    const totalGames = typedUser.agentStats.reduce((sum, stat) => sum + stat.playCount, 0);
    const totalWins = typedUser.agentStats.reduce((sum, stat) => sum + stat.wins, 0);
    const totalLosses = typedUser.agentStats.reduce((sum, stat) => sum + stat.losses, 0);
    const totalKills = typedUser.agentStats.reduce((sum, stat) => sum + stat.kills, 0);
    const totalDeaths = typedUser.agentStats.reduce((sum, stat) => sum + stat.deaths, 0);
    const totalAssists = typedUser.agentStats.reduce((sum, stat) => sum + stat.assists, 0);

    const winRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : '0.0';
    const kda = totalDeaths > 0
      ? ((totalKills + totalAssists) / totalDeaths).toFixed(2)
      : '0.00';

    const mostUsedAgent = getMostUsedAgent(typedUser.agentStats);

    return NextResponse.json({
      ...typedUser,
      totalGames,
      totalWins,
      totalLosses,
      totalKills,
      totalDeaths,
      totalAssists,
      winRate,
      kda,
      mostUsedAgent,
    });
  } catch (error) {
    console.error('사용자 검색 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}