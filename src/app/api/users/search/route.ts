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

  let mostUsedAgent = agentStats[0];
  
  for (const stat of agentStats) {
    if (stat.playCount > mostUsedAgent.playCount) {
      mostUsedAgent = stat;
    } else if (stat.playCount === mostUsedAgent.playCount) {
      const prevKD = mostUsedAgent.deaths === 0 ? Infinity : (mostUsedAgent.kills + mostUsedAgent.assists) / mostUsedAgent.deaths;
      const currentKD = stat.deaths === 0 ? Infinity : (stat.kills + stat.assists) / stat.deaths;
      if (currentKD > prevKD) {
        mostUsedAgent = stat;
      }
    }
  }

  return mostUsedAgent.agentName;
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
      { nickname: nickname },
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
      if (error.name === 'MongoNetworkError') {
        return NextResponse.json({ error: 'MongoDB 네트워크 오류' }, { status: 500 });
      }
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error instanceof Error ? error.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
} 