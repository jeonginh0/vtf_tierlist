import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getMostUsedAgent } from '@/utils/agentStats';

// 캐싱 비활성화 설정
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const nickname = decodeURIComponent(pathname.split('/').pop() || '');

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임이 필요합니다.' },
        { status: 400 }
      );
    }

    // MongoDB 연결
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      );
    }

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