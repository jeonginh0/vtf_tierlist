interface AgentStat {
  agentName: string;
  playCount: number;
  kills: number;
  deaths: number;
  assists: number;
}

function calculateKD(stat: AgentStat): number {
  if (stat.deaths === 0) return Infinity;
  return (stat.kills + stat.assists) / stat.deaths;
}

export function getMostUsedAgent(agentStats: AgentStat[]): string {
  if (!agentStats || agentStats.length === 0) return '없음';
  
  // 플레이 횟수가 가장 많은 요원들을 찾음
  const maxPlayCount = Math.max(...agentStats.map(stat => stat.playCount));
  const mostPlayedAgents = agentStats.filter(stat => stat.playCount === maxPlayCount);
  
  // 플레이 횟수가 같은 요원이 여러 개인 경우 K/D가 가장 높은 요원을 선택
  if (mostPlayedAgents.length > 1) {
    return mostPlayedAgents.reduce((prev, current) => {
      const prevKD = calculateKD(prev);
      console.log('prevKD:', prevKD);
      const currentKD = calculateKD(current);
      console.log('currentKD:', currentKD);
      return currentKD > prevKD ? current : prev;
    }).agentName;
  }
  
  // 플레이 횟수가 같은 요원이 하나뿐인 경우
  if (mostPlayedAgents.length === 1) {
    return mostPlayedAgents[0].agentName;
  }
  
  // 모든 요원의 플레이 횟수가 0인 경우 K/D가 가장 높은 요원을 선택
  return agentStats.reduce((prev, current) => {
    const prevKD = calculateKD(prev);
    const currentKD = calculateKD(current);
    return currentKD > prevKD ? current : prev;
  }).agentName;
} 