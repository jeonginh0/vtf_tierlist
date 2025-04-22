import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// 티어 정보 타입 정의
interface TierAgent {
  userId: string;
  nickname: string;
}

interface Tier {
  tier: string;
  color: string;
  agents: TierAgent[];
}

// 초기 티어 데이터
const initialTiers: Tier[] = [
  { tier: '1티어', color: '#FFD700', agents: [] },
  { tier: '2티어', color: '#C0C0C0', agents: [] },
  { tier: '3티어', color: '#CD7F32', agents: [] },
  { tier: '4티어', color: '#B87333', agents: [] },
  { tier: '5티어', color: '#8B4513', agents: [] }
];

// GET: 티어 목록 조회
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('vtf');
    const tiersCollection = db.collection<Tier>('tiers');

    let tiers = await tiersCollection.find().toArray();
    
    // 티어 데이터가 없으면 초기 데이터 생성
    if (tiers.length === 0) {
      await tiersCollection.insertMany(initialTiers);
      tiers = await tiersCollection.find().toArray();
    }
    
    return NextResponse.json({ tiers });
  } catch (error) {
    console.error('티어 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 티어에 사용자 추가/제거
export async function PUT(request: Request) {
  try {
    const { userId, tierName, action = 'add' } = await request.json();

    if (!userId || !tierName) {
      return NextResponse.json(
        { error: '사용자 ID와 티어 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('vtf');
    const tiersCollection = db.collection<Tier>('tiers');
    const usersCollection = db.collection('users');

    // 사용자 정보 조회
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (action === 'remove') {
      // 티어에서 사용자 제거
      const result = await tiersCollection.updateOne(
        { tier: tierName },
        { $pull: { agents: { userId } } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: '티어를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // User 모델의 tier 필드 업데이트
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { tier: '미배정' } }
      );
    } else {
      // 이미 다른 티어에 있는지 확인
      const existingTier = await tiersCollection.findOne({
        'agents.userId': userId
      });

      if (existingTier) {
        // 기존 티어에서 제거
        await tiersCollection.updateOne(
          { 'agents.userId': userId },
          { $pull: { agents: { userId } } }
        );
      }

      // 새로운 티어에 추가
      const result = await tiersCollection.updateOne(
        { tier: tierName },
        {
          $push: {
            agents: {
              userId,
              nickname: user.nickname
            }
          }
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          { error: '티어를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      // User 모델의 tier 필드 업데이트
      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { tier: tierName } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('티어 업데이트 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 