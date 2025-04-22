'use client';

import React from 'react';
import TierRow from './TierRow';
import styles from '@/styles/TierList.module.css';

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
    <div className={styles.tierListContainer}>
      {tiers.map((tier) => (
        <TierRow
          key={tier.tier}
          tier={tier.tier}
          backgroundColor={tier.color}
          agents={tier.agents.map(agent => agent.nickname)}
        />
      ))}
    </div>
  );
};

export default TierList; 