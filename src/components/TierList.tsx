'use client';

import React, { useState, useEffect } from 'react';

interface TierRowProps {
  tier: string;
  backgroundColor: string;
  isEditable: boolean;
  agents: string[];
  onAgentsChange: (tier: string, newAgents: string[]) => void;
}

const TierRow: React.FC<TierRowProps> = ({ 
  tier, 
  backgroundColor, 
  isEditable,
  agents,
  onAgentsChange
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const handleAddAgent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isComposing) {
      e.preventDefault();
      
      const input = e.target as HTMLInputElement;
      const value = input.value;
      
      if (!value) return;
      
      // 입력값을 그대로 저장
      onAgentsChange(tier, [...agents, value]);
      
      // 입력 초기화
      input.value = '';
      setInputValue('');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  const handleRemoveAgent = (index: number) => {
    const newAgents = [...agents];
    newAgents.splice(index, 1);
    onAgentsChange(tier, newAgents);
  };

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
            className={`px-4 py-2 bg-gray-700 rounded-full text-white flex items-center gap-2 text-lg 
              ${isEditable ? 'hover:bg-gray-600 cursor-pointer' : ''}`}
            onClick={isEditable ? () => handleRemoveAgent(index) : undefined}
          >
            <span>{agent}</span>
            {isEditable && (
              <button className="text-lg text-gray-400 hover:text-red-400">×</button>
            )}
          </div>
        ))}
        {isEditable && (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleAddAgent}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="에이전트 이름 입력..."
            className="bg-transparent text-white outline-none border-b border-gray-600 px-2 text-lg"
          />
        )}
      </div>
    </div>
  );
};

interface TierListProps {
  currentUser: string | null;
}

interface TierData {
  tier: string;
  color: string;
  agents: string[];
}

const TierList: React.FC<TierListProps> = ({ currentUser }) => {
  const isEditable = currentUser === 'stitch0913';

  const initialTiers: TierData[] = [
    { tier: '1티어', color: '#FF9999', agents: [] },
    { tier: '2티어', color: '#FFB266', agents: [] },
    { tier: '3티어', color: '#FFE5B2', agents: [] },
    { tier: '4티어', color: '#FFFF99', agents: [] },
    { tier: '5티어', color: '#B2FFB2', agents: [] },
  ];

  const [tiers, setTiers] = useState<TierData[]>(initialTiers);
  const [isLoading, setIsLoading] = useState(true);

  // 티어리스트 데이터 가져오기
  useEffect(() => {
    const fetchTierList = async () => {
      try {
        const response = await fetch('/api/tierlist');
        if (response.ok) {
          const data = await response.json();
          setTiers(data.tiers || initialTiers);
        }
      } catch (error) {
        console.error('티어리스트 데이터를 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTierList();
  }, []);

  const handleAgentsChange = async (tier: string, newAgents: string[]) => {
    const updatedTiers = tiers.map(t => 
      t.tier === tier ? { ...t, agents: newAgents } : t
    );
    
    setTiers(updatedTiers);

    // MongoDB에 저장
    if (isEditable) {
      try {
        const response = await fetch('/api/tierlist', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tiers: updatedTiers }),
        });

        if (!response.ok) {
          throw new Error('티어리스트 업데이트 실패');
        }
      } catch (error) {
        console.error('티어리스트 업데이트 중 오류 발생:', error);
        // 에러 발생 시 이전 상태로 복구
        setTiers(tiers);
      }
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto my-8">
      <div className="flex justify-between items-center mb-6">
        {!isEditable && (
          <div className="text-gray-400 text-sm">
            * 티어리스트 수정은 관리자만 가능합니다
          </div>
        )}
      </div>
      <div className="border border-gray-700 rounded-lg overflow-hidden">
        {tiers.map((tier) => (
          <TierRow
            key={tier.tier}
            tier={tier.tier}
            backgroundColor={tier.color}
            isEditable={isEditable}
            agents={tier.agents}
            onAgentsChange={handleAgentsChange}
          />
        ))}
      </div>
    </div>
  );
};

export default TierList; 