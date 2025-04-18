import dotenv from 'dotenv';
import connectDB from '../src/lib/mongodb.js';
import User from '../src/models/User.js';
import TierList from '../src/models/TierList.js';
import bcrypt from 'bcryptjs';

// 환경 변수 로드
dotenv.config();

const initialTiers = [
  { tier: '1티어', color: '#FF9999', agents: [] },
  { tier: '2티어', color: '#FFB266', agents: [] },
  { tier: '3티어', color: '#FFE5B2', agents: [] },
  { tier: '4티어', color: '#FFFF99', agents: [] },
  { tier: '5티어', color: '#B2FFB2', agents: [] },
];

async function initDB() {
  try {
    await connectDB();

    // 관리자 계정 생성
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD!, 10);
    const adminUser = await User.findOneAndUpdate(
      { username: process.env.ADMIN_USERNAME },
      {
        username: process.env.ADMIN_USERNAME,
        password: hashedPassword,
        nickname: process.env.ADMIN_NICKNAME,
        isAdmin: true,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('관리자 계정이 생성되었습니다:', adminUser);

    // 초기 티어리스트 생성
    const tierList = await TierList.findOneAndUpdate(
      {},
      { tiers: initialTiers, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    console.log('초기 티어리스트가 생성되었습니다:', tierList);

    process.exit(0);
  } catch (error) {
    console.error('데이터베이스 초기화 중 오류 발생:', error);
    process.exit(1);
  }
}

initDB(); 