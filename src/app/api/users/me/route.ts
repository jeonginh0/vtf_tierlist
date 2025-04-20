import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface UserProfile {
  _id: ObjectId;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  agentStats: {
    agentName: string;
    playCount: number;
    kills: number;
    deaths: number;
    assists: number;
    wins: number;
    losses: number;
    matches: {
      kills: number;
      deaths: number;
      assists: number;
      isWin: boolean;
      matchDate: string;
    }[];
  }[];
}

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('사용자 정보 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 