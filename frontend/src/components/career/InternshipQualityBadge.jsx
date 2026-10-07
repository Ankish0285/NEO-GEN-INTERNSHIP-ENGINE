import React from 'react';
import { Shield } from 'lucide-react';

const qualityColor = (score) => {
  if (score >= 70) return 'bg-green-100 text-green-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const riskColor = (level) => {
  if (level === 'low') return 'bg-green-100 text-green-700';
  if (level === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const InternshipQualityBadge = ({
  qualityScore = 0,
  riskLevel = 'medium',
  roiEstimate,
}) => {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      <span
        title={`Quality score: ${qualityScore}/100`}
        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${qualityColor(qualityScore)}`}
      >
        {qualityScore}/100
      </span>

      <span
        title={`Risk level: ${riskLevel}`}
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${riskColor(riskLevel)}`}
      >
        <Shield size={11} />
        {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} risk
      </span>

      {roiEstimate && (
        <span
          title={`ROI estimate: ${roiEstimate}`}
          className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold"
        >
          {roiEstimate}
        </span>
      )}
    </div>
  );
};

export default InternshipQualityBadge;
