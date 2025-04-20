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
  let mostUsedAgent = { agentName: '미지정', playCount: 0, kd: 0 };

  agentStats?.forEach(stat => {
    const agentKD = stat.deaths === 0 ? stat.kills : stat.kills / stat.deaths;

    if (stat.playCount > mostUsedAgent.playCount || 
        (stat.playCount === mostUsedAgent.playCount && agentKD > mostUsedAgent.kd)) {
      mostUsedAgent = {
        agentName: stat.agentName,
        playCount: stat.playCount,
        kd: agentKD
      };
    }
  });

  return mostUsedAgent.agentName;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overall';
    
    const client = await clientPromise;
    const db = client.db('vtf');
    
    const users = await db.collection('users').find({}).toArray() as User[];
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
      
      return NextResponse.json({ rankings: agentRankings });
      
    } else if (type === 'position') {
      // 포지션별 랭킹
      const positionRankings: PositionRanking[] = [];
      const positionMap = new Map<string, PositionRanking['users']>();
      
      users.forEach(user => {
        const position = user.preferredPosition || '미지정';
        if (!positionMap.has(position)) {
          positionMap.set(position, []);
        }
        
        const mostUsedAgent = user.agentStats?.length > 0 
          ? user.agentStats.reduce((prev, current) => 
              prev.playCount > current.playCount ? prev : current
            ).agentName
          : '미지정';
          
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
      
      positionMap.forEach((users, position) => {
        positionRankings.push({
          position,
          users: users.sort((a, b) => {
            if (a.kda === 'Perfect') return -1;
            if (b.kda === 'Perfect') return 1;
            return parseFloat(b.kda) - parseFloat(a.kda);
          })
        });
      });
      
      return NextResponse.json({ rankings: positionRankings });
      
    } else if (type === 'tier') {
      // 티어별 랭킹
      const tierRankings: TierRanking[] = [];
      const tierMap = new Map<string, TierRanking['users']>();
      
      for (const user of users) {
        // 유저의 티어 찾기
        const userTier = await tiersCollection.findOne({ 'agents.userId': user._id.toString() });
        const tier = userTier?.tier || '미배정';
        
        if (!tierMap.has(tier)) {
          tierMap.set(tier, []);
        }
        
        const mostUsedAgent = user.agentStats?.length > 0 
          ? user.agentStats.reduce((prev, current) => 
              prev.playCount > current.playCount ? prev : current
            ).agentName
          : '미지정';
          
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
      
      tierMap.forEach((users, tier) => {
        tierRankings.push({
          tier,
          users: users.sort((a, b) => {
            if (a.kda === 'Perfect') return -1;
            if (b.kda === 'Perfect') return 1;
            return parseFloat(b.kda) - parseFloat(a.kda);
          })
        });
      });
      
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
        if (a.kda === 'Perfect') return -1;
        if (b.kda === 'Perfect') return 1;
        return parseFloat(b.kda) - parseFloat(a.kda);
      });

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