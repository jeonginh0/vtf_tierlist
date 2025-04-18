import { NextResponse } from 'next/server';

const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  nickname: process.env.ADMIN_NICKNAME
};

export async function POST(request: Request) {
  try {
    // 환경변수 체크
    if (!ADMIN_USER.username || !ADMIN_USER.password || !ADMIN_USER.nickname) {
      console.error('관리자 계정 환경변수가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      return NextResponse.json({
        username: ADMIN_USER.username,
        nickname: ADMIN_USER.nickname
      });
    }

    return NextResponse.json(
      { error: '관리자 계정이 아닙니다.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: '로그인에 실패했습니다.' },
      { status: 500 }
    );
  }
} 