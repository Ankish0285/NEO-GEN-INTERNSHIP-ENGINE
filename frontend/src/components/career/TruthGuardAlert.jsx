import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../ui/Button';

const severityStyles = {
  high: {
    wrapper: 'bg-red-50 border-red-400',
    badge: 'bg-red-100 text-red-700',
    icon: 'text-red-500',
  },
  medium: {
    wrapper: 'bg-[#fff4e8] border-[#FF9933]',
    badge: 'bg-[#fff4e8] text-[#e68a2e]',
    icon: 'text-[#FF9933]',
  },
  low: {
    wrapper: 'bg-[#fff4e8] border-[#FFD9A0]',
    badge: 'bg-[#fff4e8] text-[#e68a2e]',
    icon: 'text-[#FF9933]',
  },
};

const TruthGuardAlert = ({
  issues = [],
  onEdit,
  defaultDismissed = false,
}) => {
  const [dismissed, setDismissed] = useState(defaultDismissed);

  if (dismissed || issues.length === 0) return null;

  const hasHighSeverity = issues.some((i) => i.severity === 'high');
  const topStyle = hasHighSeverity ? severityStyles.high : severityStyles.medium;

  return (
    <div className={`relative border-l-4 rounded-xl p-4 ${topStyle.wrapper}`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={18} className={topStyle.icon} />
        <span className="font-semibold text-gray-800 text-sm">
          TruthGuard — {issues.length} issue{issues.length !== 1 ? 's' : ''} detected
        </span>
      </div>

      <ul className="space-y-2 mb-3">
        {issues.map((item, idx) => {
          const style = severityStyles[item.severity] || severityStyles.medium;
          return (
            <li key={idx} className="text-sm">
              <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium mr-2 ${style.badge}`}>
                {item.severity}
              </span>
              <span className="font-medium text-gray-700">{item.claim}</span>
              {item.issue && (
                <span className="text-gray-500"> — {item.issue}</span>
              )}
            </li>
          );
        })}
      </ul>

      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit claims
        </Button>
      )}
    </div>
  );
};

export default TruthGuardAlert;
