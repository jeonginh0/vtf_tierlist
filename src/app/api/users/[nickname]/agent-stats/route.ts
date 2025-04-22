import { NextRequest, NextResponse } from 'next/server';
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
  agentStats: AgentStat[];
}

// URL 패턴: /api/users/[nickname]/agent-stats
export async function GET(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const nickname = decodeURIComponent(pathname.split('/')[4] || '');

    await connectDB();

    const user = await User.findOne(
      { nickname },
      { agentStats: 1 }
    ).lean() as UserWithStats | null;

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(user.agentStats || []);
  } catch (error) {
    console.error('요원 통계 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;
    const nickname = decodeURIComponent(pathname.split('/')[4] || '');
    const body = await request.json();

    await connectDB();

    const user = await User.findOneAndUpdate(
      { nickname },
      { $push: { agentStats: body } },
      { new: true }
    ).lean() as UserWithStats | null;

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(user.agentStats);
  } catch (error) {
    console.error('요원 통계 추가 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 