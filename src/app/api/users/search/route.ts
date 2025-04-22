import { NextRequest, NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

interface AgentStat {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
}

function getMostUsedAgent(agentStats: AgentStat[]): string {
  if (!agentStats || agentStats.length === 0) return '없음';
  
  // 플레이 횟수가 가장 많은 요원들을 찾음
  const maxPlayCount = Math.max(...agentStats.map(stat => stat.playCount));
  const mostPlayedAgents = agentStats.filter(stat => stat.playCount === maxPlayCount);
  
  // 플레이 횟수가 같은 요원이 여러 개인 경우 K/D가 가장 높은 요원을 선택
  if (mostPlayedAgents.length > 1) {
    return mostPlayedAgents.reduce((prev, current) => {
      const prevKD = prev.deaths === 0 ? Infinity : (prev.kills + prev.assists) / prev.deaths;
      const currentKD = current.deaths === 0 ? Infinity : (current.kills + current.assists) / current.deaths;
      return currentKD > prevKD ? current : prev;
    }).agentName;
  }
  
  return mostPlayedAgents[0].agentName;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const nickname = searchParams.get('nickname');

    if (!nickname) {
      return NextResponse.json(
        { error: '닉네임을 입력해주세요.' },
        { status: 400 }
      );
    }

    console.log('검색할 닉네임:', nickname);

    const client = await clientPromise;
    console.log('MongoDB 연결 성공');

    const db = client.db('vtf');
    console.log('데이터베이스 선택 성공');
    
    const user = await db.collection('users').findOne(
      { nickname: { $regex: new RegExp(nickname, 'i') } },
      {
        projection: {
          _id: 1,
          nickname: 1,
          valorantNickname: 1,
          preferredPosition: 1,
          tier: 1,
          role: 1,
          agentStats: 1
        }
      }
    );

    console.log('검색 결과:', user);

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 가장 많이 사용한 요원 찾기
    const mostUsedAgent = getMostUsedAgent(user.agentStats || []);

    return NextResponse.json({
      ...user,
      mostUsedAgent
    });
  } catch (error) {
    console.error('사용자 검색 중 오류 발생:', error);
    if (error instanceof Error) {
      console.error('에러 상세:', error.message);
      console.error('에러 스택:', error.stack);
    }
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 