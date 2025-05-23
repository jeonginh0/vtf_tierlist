import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';

interface AgentStats {
  agentName: string;
  playCount: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface User {
  _id: string;
  email: string;
  password?: string;
  nickname: string;
  valorantNickname: string;
  preferredPosition: string;
  tier: string;
  role: string;
  agentStats: AgentStats[];
  mostUsedAgent: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('vtf');
    
    const users = await db.collection<User>('users')
      .find({}, { projection: { password: 0 } })
      .toArray();
    
    return NextResponse.json({ users });
  } catch (error) {
    console.error('사용자 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새로운 사용자 생성
export async function POST(request: Request) {
  try {
    const { email, password, nickname, valorantNickname, preferredPosition } = await request.json();
    
    if (!email || !password || !nickname || !valorantNickname || !preferredPosition) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    
    // 이메일 중복 확인
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 존재하는 이메일입니다.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const existingNickname = await db.collection('users').findOne({ nickname });
    if (existingNickname) {
      return NextResponse.json(
        { error: '이미 존재하는 닉네임입니다.' },
        { status: 400 }
      );
    }

    // 발로란트 닉네임 중복 확인
    const existingValorantNickname = await db.collection('users').findOne({ valorantNickname });
    if (existingValorantNickname) {
      return NextResponse.json(
        { error: '이미 존재하는 발로란트 닉네임입니다.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const newUser: Omit<User, '_id'> = {
      email,
      password, // 실제 프로덕션에서는 해시화된 비밀번호를 저장해야 합니다
      nickname,
      valorantNickname,
      preferredPosition,
      tier: '언랭크',
      mostUsedAgent: '없음',
      role: 'USER',
      agentStats: [],
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection('users').insertOne(newUser);
    
    return NextResponse.json({ 
      message: '회원가입이 완료되었습니다.',
      user: {
        _id: result.insertedId,
        email: newUser.email,
        nickname: newUser.nickname,
        valorantNickname: newUser.valorantNickname,
        preferredPosition: newUser.preferredPosition,
        role: newUser.role,
        agentStats: newUser.agentStats,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 