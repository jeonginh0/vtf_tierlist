import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { saveVerificationCode } from '@/lib/verification';

// 이메일 인증 코드를 저장할 임시 저장소
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // 6자리 랜덤 코드 생성
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 코드를 임시 저장소에 저장 (5분 동안 유효)
    saveVerificationCode(email, verificationCode);

    // 이메일 전송 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 이메일 내용 설정
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '[VTF] 이메일 인증 코드',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">VTF 이메일 인증</h2>
          <p style="color: #666; font-size: 16px;">
            안녕하세요, VTF 회원가입을 위한 인증 코드입니다.
          </p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0;">인증 코드: ${verificationCode}</h3>
          </div>
          <p style="color: #666; font-size: 14px;">
            이 코드는 5분 동안만 유효합니다.
          </p>
        </div>
      `
    };

    // 이메일 전송
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Verification code sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    );
  }
}

// 인증 코드 검증을 위한 유틸리티 함수
export function verifyCode(email: string, code: string): boolean {
  const verification = verificationCodes.get(email);
  
  if (!verification) {
    return false;
  }

  if (Date.now() > verification.timestamp) {
    verificationCodes.delete(email);
    return false;
  }

  if (verification.code !== code) {
    return false;
  }

  verificationCodes.delete(email);
  return true;
} 