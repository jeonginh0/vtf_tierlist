import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';
import { generateToken } from '@/lib/jwt';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // MongoDB 연결
    let client;
    try {
      client = await clientPromise;
      console.log('MongoDB 연결 성공');
    } catch (error) {
      console.error('MongoDB 연결 실패:', error);
      return NextResponse.json(
        { error: '데이터베이스 연결에 실패했습니다.' },
        { status: 500 }
      );
    }

    const db = client.db('vtf');

    // 사용자 조회
    let user;
    try {
      user = await db.collection('users').findOne({ email });
      console.log('사용자 조회 결과:', user ? '사용자 발견' : '사용자 없음');
    } catch (error) {
      console.error('사용자 조회 중 오류:', error);
      return NextResponse.json(
        { error: '사용자 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    let isPasswordValid;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('비밀번호 확인 결과:', isPasswordValid ? '일치' : '불일치');
    } catch (error) {
      console.error('비밀번호 확인 중 오류:', error);
      return NextResponse.json(
        { error: '비밀번호 확인 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const tokenPayload = {
      id: user._id,
      email: user.email,
      nickname: user.nickname,
      valorantNickname: user.valorantNickname,
      role: user.role,
    };
    const token = generateToken(tokenPayload);

    // 비밀번호 제외하고 응답
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      ...userWithoutPassword,
      token,
    });
  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', error);
    return NextResponse.json(
      { error: '로그인에 실패했습니다.' },
      { status: 500 }
    );
  }
} 