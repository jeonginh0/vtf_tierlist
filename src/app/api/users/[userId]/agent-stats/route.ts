import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface AgentStats {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  losses: number;
}

// PUT: 기존 users 컬렉션 내 embedded stats 업데이트
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    // URL 패턴: /api/users/[userId]/agent-stats
    const userId = url.pathname.split('/')[3];
    console.log('userId:', userId);
    
    if (!userId) return NextResponse.json({ error: 'Missing userId in URL' }, { status: 400 });

    // ObjectId 형식 검증
    if (!ObjectId.isValid(userId)) {
      console.log('유효하지 않은 userId:', userId);
      return NextResponse.json({ error: '유효하지 않은 사용자 ID입니다.' }, { status: 400 });
    }

    const requestData = await request.json();
    console.log('요청 데이터:', requestData);
    console.log('데이터 타입:', {
      agentName: typeof requestData.agentName,
      kills: typeof requestData.kills,
      deaths: typeof requestData.deaths,
      assists: typeof requestData.assists,
      wins: typeof requestData.wins,
      losses: typeof requestData.losses,
      playCount: typeof requestData.playCount
    });

    const { agentName, kills, deaths, assists, wins, losses, playCount } = requestData;

    if (!agentName) {
      console.log('agentName 누락');
      return NextResponse.json({ error: '요원 이름이 필요합니다.' }, { status: 400 });
    }
    if (kills === undefined || kills === null) {
      console.log('kills 누락:', kills);
      return NextResponse.json({ error: '킬 수가 필요합니다.' }, { status: 400 });
    }
    if (deaths === undefined || deaths === null) {
      console.log('deaths 누락:', deaths);
      return NextResponse.json({ error: '데스 수가 필요합니다.' }, { status: 400 });
    }
    if (assists === undefined || assists === null) {
      console.log('assists 누락:', assists);
      return NextResponse.json({ error: '어시스트 수가 필요합니다.' }, { status: 400 });
    }
    if (wins === undefined || wins === null) {
      console.log('wins 누락:', wins);
      return NextResponse.json({ error: '승리 수가 필요합니다.' }, { status: 400 });
    }
    if (losses === undefined || losses === null) {
      console.log('losses 누락:', losses);
      return NextResponse.json({ error: '패배 수가 필요합니다.' }, { status: 400 });
    }
    if (playCount === undefined || playCount === null) {
      console.log('playCount 누락:', playCount);
      return NextResponse.json({ error: '플레이 수가 필요합니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingStats = user.agentStats?.find((stat: AgentStats) => stat.agentName === agentName);
    const newStats: AgentStats = {
      agentName,
      playCount,
      kills,
      deaths,
      assists,
      wins,
      losses,
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          agentStats: existingStats
            ? user.agentStats.map((stat: AgentStats) =>
                stat.agentName === agentName ? newStats : stat
              )
            : [...(user.agentStats || []), newStats]
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: '통계 추가에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('통계 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: agent_stats 컬렉션에서 통계 조회
export async function GET(
  request: Request
) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4];
    if (!userId) return NextResponse.json({ error: 'Missing userId in URL' }, { status: 400 });

    const client = await clientPromise;
    const db = client.db('vtf');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const agentStats = await db
      .collection('agent_stats')
      .find({ userId: new ObjectId(userId) })
      .toArray();

    return NextResponse.json(agentStats);
  } catch (error) {
    console.error('Error fetching agent stats:', error);
    return NextResponse.json({ error: 'Failed to fetch agent stats' }, { status: 500 });
  }
}

// POST: agent_stats 컬렉션에 통계 누적 저장
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4];
    if (!userId) return NextResponse.json({ error: 'Missing userId in URL' }, { status: 400 });

    const { agent, kills, deaths, assists, isWin } = await request.json();

    if (!agent || kills === undefined || deaths === undefined || assists === undefined || isWin === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('vtf');

    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await db.collection('agent_stats').updateOne(
      { userId: new ObjectId(userId), agent },
      {
        $inc: {
          kills,
          deaths,
          assists,
          wins: isWin ? 1 : 0,
          losses: isWin ? 0 : 1,
          matches: 1,
        },
        $setOnInsert: {
          userId: new ObjectId(userId),
          agent,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating agent stats:', error);
    return NextResponse.json({ error: 'Failed to update agent stats' }, { status: 500 });
  }
}
