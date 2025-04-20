import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, valorantNickname, password, preferredPosition } = await request.json();

    // 필수 필드 검증
    if (!email || !valorantNickname || !password || !preferredPosition) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vtf');

    // 이메일 중복 검사
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 검사
    const existingNickname = await db.collection('users').findOne({ valorantNickname });
    if (existingNickname) {
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 관리자 계정 생성
    await db.collection('users').insertOne({
      email,
      valorantNickname,
      password: hashedPassword,
      preferredPosition,
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json(
      { message: '관리자 계정이 생성되었습니다.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('관리자 계정 생성 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 