import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import ConfidenceBar from './ConfidenceBar';

const SkillEvidenceCard = ({
  skillName,
  proficiency,
  confidenceScore = 0,
  evidenceSources = [],
  isVerified = false,
}) => {
  return (
    <motion.div
      className="neo-glass p-4 rounded-xl"
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className="font-semibold text-gray-800">{skillName}</span>
        {proficiency && (
          <span className="bg-[#fff4e8] text-[#e68a2e] text-xs px-2 py-0.5 rounded-full">
            {proficiency}
          </span>
        )}
        {isVerified && (
          <ShieldCheck size={16} className="text-[#138808]" />
        )}
      </div>

      <div className="mb-3">
        <ConfidenceBar
          score={confidenceScore}
          label="Confidence"
          showPercent
          size="sm"
        />
      </div>

      {evidenceSources.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {evidenceSources.map((source, idx) => (
            <span
              key={idx}
              className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md"
            >
              {source}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default SkillEvidenceCard;
