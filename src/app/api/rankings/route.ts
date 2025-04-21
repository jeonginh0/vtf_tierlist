import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface AgentStats {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
  wins: number;
  losses: number;
}

interface User {
  _id: ObjectId;
  nickname: string;
  preferredPosition: string;
  tier: string;
  agentStats: AgentStats[];
}

interface RankingUser {
  _id: string;
  nickname: string;
  preferredPosition: string;
  tier: string;
  mostUsedAgent: string;
  kda: string;
  winRate: string;
}

interface AgentRanking {
  agentName: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    playCount: number;
  }[];
}

interface PositionRanking {
  position: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    mostUsedAgent: string;
  }[];
}

interface TierRanking {
  tier: string;
  users: {
    nickname: string;
    kda: string;
    winRate: string;
    mostUsedAgent: string;
  }[];
}

const getMostUsedAgent = (agentStats: AgentStats[]) => {
  if (!agentStats || agentStats.length === 0) return '미지정';

  const sortedAgents = [...agentStats].sort((a, b) => {
    if (b.playCount !== a.playCount) {
      return b.playCount - a.playCount;
    }
    const aKD = a.deaths === 0 ? a.kills : a.kills / a.deaths;
    const bKD = b.deaths === 0 ? b.kills : b.kills / b.deaths;
    return bKD - aKD;
  });

  return sortedAgents[0].agentName;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall';
    
    console.log('랭킹 API 호출 - 타입:', type);
    
    const client = await clientPromise;
    const db = client.db('vtf');
    
    const users = await db.collection('users').find({}).toArray() as User[];
    console.log('DB에서 가져온 사용자 수:', users.length);
    
    const tiersCollection = db.collection('tiers');
    
    if (type === 'agent') {
      // 요원별 랭킹
      const agentRankings: AgentRanking[] = [];
      const agentMap = new Map<string, AgentRanking['users']>();
      
      users.forEach(user => {
        user.agentStats?.forEach(stat => {
          if (!agentMap.has(stat.agentName)) {
            agentMap.set(stat.agentName, []);
          }
          
          const kda = stat.deaths === 0 
            ? 'Perfect' 
            : ((stat.kills + stat.assists) / stat.deaths).toFixed(2);
            
          const winRate = (stat.wins + stat.losses) === 0 
            ? '0%' 
            : `${((stat.wins / (stat.wins + stat.losses)) * 100).toFixed(1)}%`;
            
          agentMap.get(stat.agentName)?.push({
            nickname: user.nickname,
            kda,
            winRate,
            playCount: stat.playCount
          });
        });
      });
      
      agentMap.forEach((users, agentName) => {
        agentRankings.push({
          agentName,
          users: users.sort((a, b) => {
            if (a.kda === 'Perfect') return -1;
            if (b.kda === 'Perfect') return 1;
            return parseFloat(b.kda) - parseFloat(a.kda);
          })
        });
      });
      
      console.log('요원별 랭킹 데이터:', agentRankings);
      return NextResponse.json({ rankings: agentRankings });
    } else if (type === 'position') {
      // 포지션별 랭킹
      const positionRankings: PositionRanking[] = [];
      const positionMap = new Map<string, PositionRanking['users']>();
      
      // 포지션 순서 정의
      const positionOrder = ['타격대', '감시자', '전략가', '척후대'];
      
      users.forEach(user => {
        const position = user.preferredPosition || '미지정';
        if (!positionMap.has(position)) {
          positionMap.set(position, []);
        }
        
        const mostUsedAgent = getMostUsedAgent(user.agentStats || []);
          
        const totalKills = user.agentStats?.reduce((sum, stat) => sum + stat.kills, 0) || 0;
        const totalDeaths = user.agentStats?.reduce((sum, stat) => sum + stat.deaths, 0) || 0;
        const totalAssists = user.agentStats?.reduce((sum, stat) => sum + stat.assists, 0) || 0;
        const kda = totalDeaths === 0 
          ? 'Perfect' 
          : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
          
        const totalWins = user.agentStats?.reduce((sum, stat) => sum + stat.wins, 0) || 0;
        const totalLosses = user.agentStats?.reduce((sum, stat) => sum + stat.losses, 0) || 0;
        const totalGames = totalWins + totalLosses;
        const winRate = totalGames === 0 
          ? '0%' 
          : `${((totalWins / totalGames) * 100).toFixed(1)}%`;
          
        positionMap.get(position)?.push({
          nickname: user.nickname,
          kda,
          winRate,
          mostUsedAgent
        });
      });
      
      // 포지션 순서대로 정렬
      positionOrder.forEach(position => {
        if (positionMap.has(position)) {
          positionRankings.push({
            position,
            users: positionMap.get(position)!.sort((a, b) => {
              // 주요 요원이 '미지정'이고 K/D가 'Perfect'인 경우 맨 아래로
              if (a.mostUsedAgent === '미지정' && a.kda === 'Perfect') return 1;
              if (b.mostUsedAgent === '미지정' && b.kda === 'Perfect') return -1;
              
              // 나머지 경우는 기존 정렬 로직 유지
              if (a.kda === 'Perfect' && b.kda !== 'Perfect') return -1;
              if (b.kda === 'Perfect' && a.kda !== 'Perfect') return 1;
              return parseFloat(b.kda) - parseFloat(a.kda);
            })
          });
        }
      });
      
      console.log('포지션별 랭킹 데이터:', positionRankings);
      return NextResponse.json({ rankings: positionRankings });
    } else if (type === 'tier') {
      // 티어별 랭킹
      const tierRankings: TierRanking[] = [];
      const tierMap = new Map<string, TierRanking['users']>();
      
      // 티어 순서 정의
      const tierOrder = ['1티어', '2티어', '3티어', '4티어', '5티어'];
      
      for (const user of users) {
        // 유저의 티어 찾기
        const userTier = await tiersCollection.findOne({ 'agents.userId': user._id.toString() });
        const tier = userTier?.tier || '미배정';
        
        if (!tierMap.has(tier)) {
          tierMap.set(tier, []);
        }
        
        const mostUsedAgent = getMostUsedAgent(user.agentStats || []);
          
        const totalKills = user.agentStats?.reduce((sum, stat) => sum + stat.kills, 0) || 0;
        const totalDeaths = user.agentStats?.reduce((sum, stat) => sum + stat.deaths, 0) || 0;
        const totalAssists = user.agentStats?.reduce((sum, stat) => sum + stat.assists, 0) || 0;
        const kda = totalDeaths === 0 
          ? 'Perfect' 
          : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
          
        const totalWins = user.agentStats?.reduce((sum, stat) => sum + stat.wins, 0) || 0;
        const totalLosses = user.agentStats?.reduce((sum, stat) => sum + stat.losses, 0) || 0;
        const totalGames = totalWins + totalLosses;
        const winRate = totalGames === 0 
          ? '0%' 
          : `${((totalWins / totalGames) * 100).toFixed(1)}%`;
          
        tierMap.get(tier)?.push({
          nickname: user.nickname,
          kda,
          winRate,
          mostUsedAgent
        });
      }
      
      // 티어 순서대로 정렬
      tierOrder.forEach(tier => {
        if (tierMap.has(tier)) {
          tierRankings.push({
            tier,
            users: tierMap.get(tier)!.sort((a, b) => {
              // 주요 요원이 '미지정'이고 K/D가 'Perfect'인 경우 맨 아래로
              if (a.mostUsedAgent === '미지정' && a.kda === 'Perfect') return 1;
              if (b.mostUsedAgent === '미지정' && b.kda === 'Perfect') return -1;
              
              // 나머지 경우는 기존 정렬 로직 유지
              if (a.kda === 'Perfect' && b.kda !== 'Perfect') return -1;
              if (b.kda === 'Perfect' && a.kda !== 'Perfect') return 1;
              return parseFloat(b.kda) - parseFloat(a.kda);
            })
          });
        }
      });
      
      console.log('티어별 랭킹 데이터:', tierRankings);
      return NextResponse.json({ rankings: tierRankings });
    } else {
      // 전체 랭킹
      const rankings: RankingUser[] = await Promise.all(users.map(async (user) => {
        const userTier = await tiersCollection.findOne({ 'agents.userId': user._id.toString() });
        
        const totalKills = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.kills, 0) || 0;
        const totalDeaths = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.deaths, 0) || 0;
        const totalAssists = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.assists, 0) || 0;
        const kda = totalDeaths === 0 
          ? 'Perfect' 
          : ((totalKills + totalAssists) / totalDeaths).toFixed(2);

        const totalWins = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.wins, 0) || 0;
        const totalLosses = user.agentStats?.reduce((sum: number, stat: AgentStats) => sum + stat.losses, 0) || 0;
        const totalGames = totalWins + totalLosses;
        const winRate = totalGames === 0 
          ? '0%' 
          : `${((totalWins / totalGames) * 100).toFixed(1)}%`;

        return {
          _id: user._id.toString(),
          nickname: user.nickname,
          preferredPosition: user.preferredPosition || '미지정',
          tier: userTier?.tier || '미배정',
          mostUsedAgent: getMostUsedAgent(user.agentStats || []),
          kda,
          winRate
        };
      }));

      rankings.sort((a, b) => {
        // 주요 요원이 '미지정'이고 K/D가 'Perfect'인 경우 맨 아래로
        if (a.mostUsedAgent === '미지정' && a.kda === 'Perfect') return 1;
        if (b.mostUsedAgent === '미지정' && b.kda === 'Perfect') return -1;
        
        // 나머지 경우는 기존 정렬 로직 유지
        if (a.kda === 'Perfect' && b.kda !== 'Perfect') return -1;
        if (b.kda === 'Perfect' && a.kda !== 'Perfect') return 1;
        return parseFloat(b.kda) - parseFloat(a.kda);
      });

      console.log('전체 랭킹 데이터:', rankings);
      return NextResponse.json({ rankings });
    }
  } catch (error) {
    console.error('랭킹 정보 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 