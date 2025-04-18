import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TierList from '@/models/TierList';

// 초기 티어 데이터
const initialTiers = [
  { tier: '1티어', color: '#FF9999', agents: [] },
  { tier: '2티어', color: '#FFB266', agents: [] },
  { tier: '3티어', color: '#FFE5B2', agents: [] },
  { tier: '4티어', color: '#FFFF99', agents: [] },
  { tier: '5티어', color: '#B2FFB2', agents: [] },
];

export async function GET() {
  try {
    await connectDB();
    const tierList = await TierList.findOne();
    
    if (!tierList) {
      // 티어리스트가 없으면 초기 데이터 생성
      const newTierList = await TierList.create({ tiers: initialTiers });
      return NextResponse.json({ tiers: newTierList.tiers });
    }
    
    return NextResponse.json({ tiers: tierList.tiers });
  } catch (error) {
    console.error('티어리스트 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '티어리스트를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { tiers } = await request.json();
    
    await connectDB();
    const tierList = await TierList.findOneAndUpdate(
      {},
      { tiers, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    return NextResponse.json({ tiers: tierList.tiers });
  } catch (error) {
    console.error('티어리스트 업데이트 중 오류 발생:', error);
    return NextResponse.json(
      { error: '티어리스트를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 