import React from 'react';
import ConfidenceBar from './ConfidenceBar';

const priorityColors = {
  high: 'bg-[#fff4e8] text-[#e68a2e] border border-[#FFD9A0]',
  medium: 'bg-[#e8f5e6] text-[#138808]',
  low: 'bg-gray-100 text-gray-600',
};

const SkillGapItem = ({
  rank,
  skillName,
  priority = 'medium',
  currentConfidence = 0,
  gapScore,
  estimatedImpact,
  learningEffort,
  reason,
}) => {
  return (
    <div className="neo-glass p-4 rounded-xl flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {rank !== undefined && (
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#FF9933] text-white text-xs font-bold shrink-0">
              {rank}
            </span>
          )}
          <span className="font-semibold text-gray-800 flex-1 min-w-0">{skillName}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {priority && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                priorityColors[priority] || priorityColors.medium
              }`}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)} impact
            </span>
          )}
          {learningEffort && (
            <span className={`bg-[#fff4e8] text-[#e68a2e] text-xs px-2 py-0.5 rounded-full`}>
              {learningEffort} effort
            </span>
          )}
        </div>
      </div>

      <ConfidenceBar
        score={currentConfidence}
        label="Current confidence"
        showPercent
        size="sm"
      />

      {reason && (
        <p className="text-sm text-gray-600">{reason}</p>
      )}
    </div>
  );
};

export default SkillGapItem;
