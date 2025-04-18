import { NextResponse } from 'next/server';

const ADMIN_USER = {
  username: process.env.ADMIN_USERNAME,
  password: process.env.ADMIN_PASSWORD,
  nickname: process.env.ADMIN_NICKNAME
};

export async function POST(request: Request) {
  try {
    console.log('API 호출 시작');
    console.log('환경 변수 상태:', {
      username: !!ADMIN_USER.username,
      password: !!ADMIN_USER.password,
      nickname: !!ADMIN_USER.nickname
    });

    // 환경변수 체크
    if (!ADMIN_USER.username || !ADMIN_USER.password || !ADMIN_USER.nickname) {
      console.error('관리자 계정 환경변수가 설정되지 않았습니다:', ADMIN_USER);
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('요청 바디:', body);
    
    const { username, password } = body;
    
    if (!username || !password) {
      console.error('필수 필드 누락:', { username, password });
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (username === ADMIN_USER.username && password === ADMIN_USER.password) {
      console.log('로그인 성공');
      return NextResponse.json({
        username: ADMIN_USER.username,
        nickname: ADMIN_USER.nickname
      });
    }

    console.log('로그인 실패: 관리자 계정이 아님');
    return NextResponse.json(
      { error: '관리자 계정이 아닙니다.' },
      { status: 401 }
    );
  } catch (error) {
    console.error('로그인 처리 중 오류 발생:', error);
    return NextResponse.json(
      { error: '로그인에 실패했습니다.' },
      { status: 500 }
    );
  }
} 