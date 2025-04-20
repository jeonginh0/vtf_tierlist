'use client';

import React from 'react';
import TierRow from './TierRow';

interface Agent {
  userId: string;
  nickname: string;
}

interface Tier {
  tier: string;
  color: string;
  agents: Agent[];
}

interface TierListProps {
  tiers: Tier[];
}

const TierList: React.FC<TierListProps> = ({ tiers }) => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {tiers.map((tier) => (
          <TierRow
            key={tier.tier}
            tier={tier.tier}
            backgroundColor={tier.color}
            agents={tier.agents.map(agent => agent.nickname)}
          />
        ))}
      </div>
    </div>
  );
};

export default TierList; 