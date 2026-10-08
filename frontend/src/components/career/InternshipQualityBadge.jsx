import React, { useState } from 'react';
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
  qualityData,
}) => {
  const [roiExpanded, setRoiExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
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

      {qualityData?.roiDetails && (
        <div className="text-xs mt-0.5">
          <button
            onClick={() => setRoiExpanded(!roiExpanded)}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold focus:outline-none"
          >
            ROI Details {roiExpanded ? '▲' : '▼'}
          </button>
          {roiExpanded && (
            <div className="mt-1 px-2 py-1.5 bg-blue-50 rounded text-xs text-blue-900 space-y-0.5">
              <p><span className="font-semibold">Career Value:</span> {qualityData.roiDetails.careerValue}</p>
              <p><span className="font-semibold">Skill Growth:</span> {qualityData.roiDetails.skillGrowth}</p>
              <p><span className="font-semibold">Portfolio Value:</span> {qualityData.roiDetails.portfolioValue}</p>
              <p className="text-blue-500 italic mt-1">{qualityData.roiDetails.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InternshipQualityBadge;
