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

// 유저 ID 추출 함수
function getUserIdFromUrl(req: NextRequest): string | null {
  const pathname = req.nextUrl.pathname;
  const match = pathname.match(/\/users\/([^/]+)\/agent-stats/);
  return match ? match[1] : null;
}

// PUT: 요원 통계 업데이트
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromUrl(request);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const { agentName, kills, deaths, assists, isWin } = await request.json();
    if (!agentName || kills === undefined || deaths === undefined || assists === undefined || isWin === undefined) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const existingStats = user.agentStats?.find((stat: AgentStats) => stat.agentName === agentName);
    const updatedStats: AgentStats = {
      agentName,
      playCount: (existingStats?.playCount || 0) + 1,
      kills: (existingStats?.kills || 0) + kills,
      deaths: (existingStats?.deaths || 0) + deaths,
      assists: (existingStats?.assists || 0) + assists,
      wins: (existingStats?.wins || 0) + (isWin ? 1 : 0),
      losses: (existingStats?.losses || 0) + (isWin ? 0 : 1),
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          agentStats: existingStats
            ? user.agentStats.map((stat: AgentStats) =>
                stat.agentName === agentName ? updatedStats : stat
              )
            : [...(user.agentStats || []), updatedStats],
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: '통계 업데이트에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('통계 업데이트 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// GET: 요원 통계 조회
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromUrl(request);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

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

// POST: agent_stats 콜렉션에 통계 저장
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromUrl(request);
    if (!userId) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

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
