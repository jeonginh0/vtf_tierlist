import { NextRequest, NextResponse } from 'next/server';
import {clientPromise} from '@/lib/mongodb';
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

export async function PUT(request: NextRequest) {
  try {
    const { userId, agentName, kills, deaths, assists, isWin } = await request.json();

    // 필수 항목 확인
    const missingFields: string[] = [];

    if (!userId) missingFields.push('userId');
    if (!agentName) missingFields.push('agentName');
    if (kills === undefined) missingFields.push('kills');
    if (deaths === undefined) missingFields.push('deaths');
    if (assists === undefined) missingFields.push('assists');
    if (isWin === undefined) missingFields.push('isWin');

    // 누락된 필드가 있을 경우
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.', missingFields },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const existingStats = user.agentStats?.find((stat: AgentStats) => stat.agentName === agentName);
    const updatedStats: AgentStats = {
      agentName,
      playCount: (existingStats?.playCount || 0) + 1,
      kills: (existingStats?.kills || 0) + kills,
      deaths: (existingStats?.deaths || 0) + deaths,
      assists: (existingStats?.assists || 0) + assists,
      wins: (existingStats?.wins || 0) + (isWin ? 1 : 0),
      losses: (existingStats?.losses || 0) + (isWin ? 0 : 1)
    };

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          agentStats: existingStats
            ? user.agentStats.map((stat: AgentStats) =>
                stat.agentName === agentName ? updatedStats : stat
              )
            : [...(user.agentStats || []), updatedStats]
        }
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: '통계 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('통계 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 