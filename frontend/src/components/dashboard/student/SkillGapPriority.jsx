import React, { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { getSkillGaps, getAdaptiveLearningRecommendations } from '../../../services/careerService';
import { api } from '../../../services/api';
import SkillGapItem from '../../career/SkillGapItem';
import WhatIfSimulator from '../../career/WhatIfSimulator';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';

const SkillGapPriority = () => {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [learningRecs, setLearningRecs] = useState([]);

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

  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await getAdaptiveLearningRecommendations();
        setLearningRecs(res?.data?.data?.recommendations || []);
      } catch (err) {
        console.warn('[SkillGapPriority] recs fetch error:', err?.message);
      }
    };
    fetchRecs();
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

      {learningRecs.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">📚 Recommended Learning</h4>
          {learningRecs.map((rec, i) => (
            <div key={i} className="mb-2">
              <p className="text-xs font-medium text-gray-600">{rec.skillName}</p>
              {rec.guides.slice(0, 2).map((guide, j) => (
                <a key={j} href={guide.link || '#'} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-blue-600 hover:underline block ml-2">📖 {guide.title}</a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillGapPriority;
