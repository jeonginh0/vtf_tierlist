import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'tierlist.json');

// 데이터 디렉토리가 없으면 생성
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
}

// 초기 데이터
const initialTiers = [
  { tier: '1티어', color: '#FF9999', agents: [] },
  { tier: '2티어', color: '#FFB266', agents: [] },
  { tier: '3티어', color: '#FFE5B2', agents: [] },
  { tier: '4티어', color: '#FFFF99', agents: [] },
  { tier: '5티어', color: '#B2FFB2', agents: [] },
];

export async function GET() {
  try {
    await ensureDataDirectory();
    
    try {
      const data = await fs.readFile(dataFilePath, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    } catch {
      // 파일이 없으면 초기 데이터로 생성
      await fs.writeFile(dataFilePath, JSON.stringify(initialTiers, null, 2));
      return NextResponse.json(initialTiers);
    }
  } catch {
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // 요청 데이터 검증
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: '잘못된 데이터 형식입니다.' }, { status: 400 });
    }

    await ensureDataDirectory();
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ message: '저장 완료' });
  } catch {
    return NextResponse.json({ error: '데이터 저장에 실패했습니다.' }, { status: 500 });
  }
} 