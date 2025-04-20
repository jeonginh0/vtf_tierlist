import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { signToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log('로그인 시도:', { email });

    if (!email || !password) {
      console.log('이메일 또는 비밀번호 누락');
      return NextResponse.json(
        { error: '이메일과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    console.log('MongoDB 연결 성공');
    
    const db = client.db('vtf');
    console.log('데이터베이스 선택:', db.databaseName);
    
    const usersCollection = db.collection('users');
    console.log('컬렉션 확인:', await usersCollection.countDocuments());
    
    const user = await usersCollection.findOne({ email });
    console.log('사용자 조회 결과:', user ? '사용자 발견' : '사용자 없음');

    if (!user) {
      console.log('사용자를 찾을 수 없음:', email);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    console.log('사용자 발견:', { 
      email: user.email,
      hasPassword: !!user.password 
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('비밀번호 검증 결과:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('비밀번호 불일치');
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      nickname: user.nickname
    });

    console.log('로그인 성공:', { email: user.email });

    return NextResponse.json(
      { 
        token,
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          role: user.role
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.' },
      { status: 500 }
    );
  }
} 