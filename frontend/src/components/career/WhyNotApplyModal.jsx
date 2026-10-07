import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';

const severityBadgeStyles = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const riskBadgeStyles = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

const WhyNotApplyModal = ({
  isOpen,
  onClose,
  internshipTitle,
  concerns = [],
  overallRisk = 'medium',
  recommendation,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Why Not Apply?">
      <div className="space-y-4">
        {/* Heading */}
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {internshipTitle}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Here's what we found that might give you pause.
            </p>
          </div>
        </div>

        {/* Concerns */}
        {concerns.length > 0 && (
          <ul className="space-y-2">
            {concerns.map((concern, idx) => (
              <li key={idx} className="bg-gray-50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                      severityBadgeStyles[concern.severity] || severityBadgeStyles.medium
                    }`}
                  >
                    {concern.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{concern.issue}</span>
                </div>
                {concern.suggestion && (
                  <p className="text-xs text-gray-500 italic pl-1">{concern.suggestion}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Overall risk */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Overall risk:</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              riskBadgeStyles[overallRisk] || riskBadgeStyles.medium
            }`}
          >
            {overallRisk.charAt(0).toUpperCase() + overallRisk.slice(1)}
          </span>
        </div>

        {/* Recommendation */}
        {recommendation && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            {recommendation}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WhyNotApplyModal;
