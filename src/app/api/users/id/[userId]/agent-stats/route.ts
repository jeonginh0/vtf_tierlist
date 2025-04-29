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
  matchStats: {
    matchId: string;
    rank: number;
    isGameMVP: boolean;
    isTeamMVP: boolean;
    date: Date;
    points: number;
  }[];
}

// 등수와 MVP에 따른 포인트 계산 함수
function calculatePoints(rank: number, isGameMVP: boolean, isTeamMVP: boolean): number {
  let points = 0;
  
  // 등수에 따른 기본 포인트
  switch(rank) {
    case 1: points = 10; break;
    case 2: points = 9; break;
    case 3: points = 8; break;
    case 4: points = 7; break;
    case 5: points = 6; break;
    default: points = 5; // 6-10등
  }
  
  // MVP 보너스 포인트
  if (isGameMVP) points += 2;
  if (isTeamMVP) points += 1;
  
  return points;
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      userId, 
      agentName, 
      kills, 
      deaths, 
      assists, 
      isWin,
      rank,
      isGameMVP,
      isTeamMVP
    } = await request.json();

    // 필수 항목 확인
    const missingFields: string[] = [];

    if (!userId) missingFields.push('userId');
    if (!agentName) missingFields.push('agentName');
    if (kills === undefined) missingFields.push('kills');
    if (deaths === undefined) missingFields.push('deaths');
    if (assists === undefined) missingFields.push('assists');
    if (isWin === undefined) missingFields.push('isWin');
    if (rank === undefined) missingFields.push('rank');

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
    const matchId = new ObjectId().toString();
    
    // 포인트 계산
    const points = calculatePoints(rank, isGameMVP || false, isTeamMVP || false);
    
    const newMatchStats = {
      matchId,
      rank,
      isGameMVP: isGameMVP || false,
      isTeamMVP: isTeamMVP || false,
      date: new Date(),
      points
    };

    const updatedStats: AgentStats = {
      agentName,
      playCount: (existingStats?.playCount || 0) + 1,
      kills: (existingStats?.kills || 0) + kills,
      deaths: (existingStats?.deaths || 0) + deaths,
      assists: (existingStats?.assists || 0) + assists,
      wins: (existingStats?.wins || 0) + (isWin ? 1 : 0),
      losses: (existingStats?.losses || 0) + (isWin ? 0 : 1),
      matchStats: [...(existingStats?.matchStats || []), newMatchStats]
    };

    // 총 리그 포인트 계산
    const totalPoints = updatedStats.matchStats.reduce((sum, match) => sum + match.points, 0);

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          agentStats: existingStats
            ? user.agentStats.map((stat: AgentStats) =>
                stat.agentName === agentName ? updatedStats : stat
              )
            : [...(user.agentStats || []), updatedStats],
          leaguePoint: totalPoints
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