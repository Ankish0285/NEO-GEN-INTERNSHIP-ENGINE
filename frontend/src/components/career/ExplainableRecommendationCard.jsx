import React, { useState } from 'react';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

const fitScoreColor = (score) => {
  if (score >= 70) return 'bg-emerald-100 text-emerald-700';
  if (score >= 40) return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

const ExplainableRecommendationCard = ({
  internship = {},
  matchedSkills = [],
  missingSkills = [],
  fitScore = 0,
  reasons = [],
  warnings = [],
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="neo-glass p-5 rounded-xl space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-800">{internship.title}</p>
          {internship.organization && (
            <p className="text-sm text-gray-500">{internship.organization}</p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${fitScoreColor(fitScore)}`}>
          {fitScore}% fit
        </span>
      </div>

      {/* Matched skills */}
      {matchedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {matchedSkills.map((skill, idx) => (
            <span key={idx} className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Expand toggle */}
      <button
        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Show less' : 'Why recommended?'}
      </button>

      {expanded && (
        <div className="space-y-3 pt-1">
          {/* Reasons */}
          {reasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">Why recommended</p>
              <ul className="space-y-1">
                {reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing skills */}
          {missingSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">What's missing</p>
              <ul className="space-y-1">
                {missingSkills.map((skill, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 mb-1">Warnings</p>
              <ul className="space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-amber-700">
                    <XCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExplainableRecommendationCard;
