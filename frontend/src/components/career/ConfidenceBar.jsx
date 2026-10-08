import React from 'react';
import { motion } from 'framer-motion';

const ConfidenceBar = ({
  score = 0,
  label,
  showPercent = false,
  size = 'md',
  colorOverride,
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));

  const barColor = colorOverride
    ? colorOverride
    : clampedScore < 30
    ? 'bg-red-500'
    : clampedScore < 60
    ? 'bg-[#FF9933]'
    : 'bg-[#138808]';

  const heightClass =
    size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5';

  return (
    <div className="w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs text-gray-500">{label}</span>
          )}
          {showPercent && (
            <span className="text-xs font-medium text-gray-700 ml-auto">
              {clampedScore}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClass}`}>
        <motion.div
          className={`${heightClass} rounded-full ${barColor}`}
          initial={{ width: '0%' }}
          animate={{ width: `${clampedScore}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

export default ConfidenceBar;
