// 이메일 인증 코드를 저장할 임시 저장소
const verificationCodes = new Map<string, { code: string; timestamp: number }>();

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

// 인증 코드 저장 함수
export function saveVerificationCode(email: string, code: string): void {
  verificationCodes.set(email, {
    code,
    timestamp: Date.now() + 5 * 60 * 1000 // 5분 유효
  });
} 