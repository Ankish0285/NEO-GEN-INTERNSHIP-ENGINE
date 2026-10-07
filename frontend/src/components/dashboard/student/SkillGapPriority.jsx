import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { getSkillGaps } from '../../../services/careerService';
import { api } from '../../../services/api';
import SkillGapItem from '../../career/SkillGapItem';
import WhatIfSimulator from '../../career/WhatIfSimulator';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const SkillGapPriority = () => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGaps = async () => {
      try {
        const data = await getSkillGaps();
        setGaps(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('[SkillGapPriority] fetch error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchGaps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const simulateHandler = async (skill) => {
    const response = await api.post('/career/what-if', { skill });
    return response;
  };

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <Target className="text-[#FF9933]" />
        Skill Gap Priority Engine
      </h1>

      <WhatIfSimulator onSimulate={simulateHandler} />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : gaps.length === 0 ? (
        <EmptyState
          title="No Skill Gaps Identified"
          message="Great work! Keep building your profile to get personalized skill gap analysis."
        />
      ) : (
        <div className="space-y-3">
          {gaps.map((gap, idx) => (
            <SkillGapItem key={gap._id || idx} gap={gap} rank={idx + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillGapPriority;
