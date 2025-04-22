import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  serverSelectionTimeoutMS: 10000, // 서버 선택 타임아웃 10초
  socketTimeoutMS: 45000, // 소켓 타임아웃 45초
  connectTimeoutMS: 15000, // 연결 타임아웃 15초
  maxPoolSize: 50, // 최대 연결 풀 크기
  minPoolSize: 10, // 최소 연결 풀 크기
  maxIdleTimeMS: 30000, // 유휴 연결 타임아웃 30초
  waitQueueTimeoutMS: 30000, // 대기 큐 타임아웃 30초
  retryWrites: true, // 쓰기 실패 시 재시도
  retryReads: true, // 읽기 실패 시 재시도
};

console.log('MongoDB 연결 설정:', {
  uri: uri.replace(/\/\/[^@]+@/, '//***:***@'), // 비밀번호 마스킹
  options
});

// Mongoose 설정
mongoose.set('bufferTimeoutMS', 30000);
mongoose.set('maxTimeMS', 30000);
mongoose.set('bufferCommands', false); // 버퍼링 비활성화
mongoose.set('strictQuery', true);

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let mongooseConnection: Promise<typeof mongoose> | null = null;

if (process.env.NODE_ENV === 'development') {
  console.log('개발 환경: MongoDB 클라이언트 초기화');
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
    _mongooseConnection?: Promise<typeof mongoose>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('새로운 MongoDB 클라이언트 생성');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  } else {
    console.log('기존 MongoDB 클라이언트 재사용');
  }
  clientPromise = globalWithMongo._mongoClientPromise;

  if (!globalWithMongo._mongooseConnection) {
    console.log('새로운 Mongoose 연결 생성');
    globalWithMongo._mongooseConnection = mongoose.connect(uri, {
      ...options,
      bufferCommands: false
    });
  } else {
    console.log('기존 Mongoose 연결 재사용');
  }
  mongooseConnection = globalWithMongo._mongooseConnection;
} else {
  console.log('프로덕션 환경: 새로운 MongoDB 클라이언트 생성');
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
  mongooseConnection = mongoose.connect(uri, {
    ...options,
    bufferCommands: false
  });
}

export { clientPromise };

export async function connectDB() {
  try {
    console.log('MongoDB 연결 시도...');
    const startTime = Date.now();
    
    // Mongoose 연결이 완료될 때까지 기다림
    if (mongooseConnection) {
      console.log('Mongoose 연결 대기 중...');
      await mongooseConnection;
    }
    
    const client = await clientPromise;
    console.log('MongoDB 클라이언트 연결 성공:', {
      connectionTime: `${Date.now() - startTime}ms`
    });
    
    const db = client.db('vtf');
    console.log('데이터베이스 연결 성공:', {
      dbName: db.databaseName,
      collections: await db.listCollections().toArray()
    });
    
    // 연결 상태 확인
    await db.command({ ping: 1 });
    
    return db;
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    throw new Error('데이터베이스 연결에 실패했습니다.');
  }
} 