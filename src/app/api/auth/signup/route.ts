import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { email, nickname, valorantNickname, password, preferredPosition } = await request.json();

    // 필수 필드 검증
    if (!email || !nickname || !valorantNickname || !password || !preferredPosition) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
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

    // username 중복 확인
    const existingUserByUsername = await db.collection('users').findOne({ username: email.split('@')[0] });
    if (existingUserByUsername) {
      console.log('username 중복 발견:', email.split('@')[0]);
      return NextResponse.json(
        { error: '이미 사용 중인 아이디입니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existingUserByEmail = await db.collection('users').findOne({ email });
    if (existingUserByEmail) {
      console.log('이메일 중복 발견:', email);
      return NextResponse.json(
        { error: '이미 사용 중인 이메일입니다.' },
        { status: 400 }
      );
    }

    // 닉네임 중복 확인
    const existingUserByNickname = await db.collection('users').findOne({ nickname });
    if (existingUserByNickname) {
      console.log('닉네임 중복 발견:', nickname);
      return NextResponse.json(
        { error: '이미 사용 중인 닉네임입니다.' },
        { status: 400 }
      );
    }

    // 발로란트 닉네임 중복 확인
    const existingUserByValorantNickname = await db.collection('users').findOne({ valorantNickname });
    if (existingUserByValorantNickname) {
      console.log('발로란트 닉네임 중복 발견:', valorantNickname);
      return NextResponse.json(
        { error: '이미 사용 중인 발로란트 닉네임입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('비밀번호 해싱 완료');

    // 사용자 생성
    const result = await db.collection('users').insertOne({
      email,
      username: email.split('@')[0],
      nickname,
      valorantNickname,
      password: hashedPassword,
      preferredPosition,
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('사용자 생성 완료:', result.insertedId);

    // 생성된 사용자 정보 조회 (비밀번호 제외)
    const user = await db.collection('users').findOne(
      { _id: result.insertedId },
      { projection: { password: 0 } }
    );
    if (!user) {
      console.error('사용자 조회 실패');
      throw new Error('사용자 생성에 실패했습니다.');
    }
    console.log('사용자 조회 완료');

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('사용자 생성 중 오류 발생:', error);
    if (error instanceof Error) {
      console.error('에러 상세:', error.message);
      console.error('에러 스택:', error.stack);
    }
    return NextResponse.json(
      { error: '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
} 