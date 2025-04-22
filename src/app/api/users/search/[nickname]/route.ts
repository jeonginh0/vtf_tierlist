import { NextResponse } from 'next/server';
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

export async function GET(
  request: Request,
  context: { params: { nickname: string } }
) {
  try {
    const { nickname } = await context.params;
    const decodedNickname = decodeURIComponent(nickname);
    console.log('검색할 닉네임:', decodedNickname);
    
    console.log('MongoDB 연결 시도...');
    await connectDB();
    console.log('MongoDB 연결 성공');
    
    console.log('사용자 검색 쿼리 실행:', {
      nickname: decodedNickname,
      projection: {
        _id: 1,
        nickname: 1,
        valorantNickname: 1,
        preferredPosition: 1,
        tier: 1,
        role: 1,
        agentStats: 1
      }
    });
    
    const startTime = Date.now();
    const user = await User.findOne(
      { nickname: decodedNickname },
      { 
        _id: 1,
        nickname: 1,
        valorantNickname: 1,
        preferredPosition: 1,
        tier: 1,
        role: 1,
        agentStats: 1
      }
    )
    .hint({ nickname: 1 })
    .lean()
    .maxTimeMS(10000);

    const endTime = Date.now();
    
    console.log('쿼리 실행 시간:', endTime - startTime, 'ms');
    console.log('검색 결과:', user ? '사용자 찾음' : '사용자 없음');
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const typedUser = user as unknown as UserWithStats;

    // 에이전트 통계 계산
    const totalGames = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.playCount, 0);
    const totalWins = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.wins, 0);
    const totalLosses = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.losses, 0);
    const totalKills = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.kills, 0);
    const totalDeaths = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.deaths, 0);
    const totalAssists = typedUser.agentStats.reduce((sum: number, stat: AgentStat) => sum + stat.assists, 0);

    const winRate = totalGames > 0 ? (totalWins / totalGames * 100).toFixed(1) : '0.0';
    const kda = totalDeaths > 0 
      ? ((totalKills + totalAssists) / totalDeaths).toFixed(2)
      : '0.00';

    // 가장 많이 사용한 에이전트 계산
    const mostUsedAgent = getMostUsedAgent(typedUser.agentStats);

    console.log('계산된 통계:', {
      totalGames,
      totalWins,
      totalLosses,
      totalKills,
      totalDeaths,
      totalAssists,
      winRate,
      kda,
      mostUsedAgent
    });

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
      mostUsedAgent
    });
  } catch (error) {
    console.error('사용자 검색 중 오류 발생:', error);
    if (error instanceof Error) {
      console.error('오류 상세 정보:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getMostUsedAgent(agentStats: Array<{
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
}>) {
  if (!agentStats || agentStats.length === 0) return '없음';

  // 플레이 횟수와 KDA를 기준으로 정렬
  const sortedAgents = [...agentStats].sort((a, b) => {
    // 먼저 플레이 횟수로 비교
    if (b.playCount !== a.playCount) {
      return b.playCount - a.playCount;
    }
    
    // 플레이 횟수가 같으면 KDA로 비교
    const aKDA = a.deaths > 0 ? (a.kills + a.assists) / a.deaths : a.kills + a.assists;
    const bKDA = b.deaths > 0 ? (b.kills + b.assists) / b.deaths : b.kills + b.assists;
    return bKDA - aKDA;
  });

  return sortedAgents[0].agentName;
} 