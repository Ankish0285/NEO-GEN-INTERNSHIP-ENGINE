import React from 'react';
import ConfidenceBar from './ConfidenceBar';

const strengthColor = (score) => {
  if (score >= 70) return 'text-[#138808]';
  if (score >= 40) return 'text-[#FF9933]';
  return 'text-red-500';
};

const ApplicationStrengthBar = ({
  strength = 0,
  breakdown = {},
  disclaimer,
}) => {
  const { fitScore, evidenceScore, completenessScore } = breakdown;

  return (
    <div className="space-y-4">
      <div className="text-center">
        <span className={`text-3xl font-black ${strengthColor(strength)}`}>
          {strength}%
        </span>
        <p className="text-xs text-gray-500 mt-0.5">Application Strength</p>
      </div>

      <ConfidenceBar score={strength} size="lg" />

      {(fitScore !== undefined || evidenceScore !== undefined || completenessScore !== undefined) && (
        <div className="space-y-2 mt-3">
          {fitScore !== undefined && (
            <ConfidenceBar score={fitScore} label="Fit Score" showPercent size="sm" />
          )}
          {evidenceScore !== undefined && (
            <ConfidenceBar score={evidenceScore} label="Evidence Score" showPercent size="sm" />
          )}
          {completenessScore !== undefined && (
            <ConfidenceBar score={completenessScore} label="Completeness" showPercent size="sm" />
          )}
        </div>
      )}

      {disclaimer && (
        <p className="text-xs text-gray-400 italic">{disclaimer}</p>
      )}
    </div>
  );
};

export default ApplicationStrengthBar;
