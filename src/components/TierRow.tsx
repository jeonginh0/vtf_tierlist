'use client';

import React from 'react';

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
    <div className="flex w-full h-[150px] border-b border-gray-700">
      <div 
        className="flex items-center justify-center w-[120px] h-full shrink-0" 
        style={{ backgroundColor }}
      >
        <span className="text-2xl font-bold text-gray-800">{tier}</span>
      </div>
      <div className="flex-1 flex flex-wrap content-start gap-2 p-4 bg-gray-800 overflow-y-auto">
        {agents.map((agent, index) => (
          <div 
            key={index}
            className="px-4 py-2 bg-gray-700 rounded-full text-white flex items-center gap-2 text-lg"
          >
            <span>{agent}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TierRow; 