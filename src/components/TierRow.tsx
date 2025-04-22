'use client';

import React from 'react';
import styles from '@/styles/TierList.module.css';

interface TierRowProps {
  tier: string;
  backgroundColor: string;
  agents: string[];
}

const TierRow: React.FC<TierRowProps> = ({ 
  tier, 
  backgroundColor, 
  agents
}) => {
  return (
    <div className={styles.tierRow}>
      <div 
        className={styles.tierLabel}
        style={{ backgroundColor }}
      >
        <span className={styles.tierLabelText}>{tier}</span>
      </div>
      <div className={styles.agentsContainer}>
        {agents.map((agent, index) => (
          <div 
            key={index}
            className={styles.agentTag}
          >
            <span className={styles.agentName}>{agent}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TierRow; 