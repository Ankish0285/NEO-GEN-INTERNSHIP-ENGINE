import React, { useState } from 'react';
import Button from '../ui/Button';

const WhatIfSimulator = ({
  onSimulate,
  skills = [],
}) => {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasSkillsList = skills && skills.length > 0;

  const handleSimulate = async () => {
    if (!selectedSkill.trim() || !onSimulate) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await onSimulate(selectedSkill.trim());
      setResult(data);
    } catch (err) {
      setError('Simulation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const diff = result ? result.after - result.before : null;

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-end">
        {hasSkillsList ? (
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Select a skill to add</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              disabled={!onSimulate}
            >
              <option value="">-- choose a skill --</option>
              {skills.map((skill, idx) => (
                <option key={idx} value={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1 block">Enter a skill to add</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
              placeholder="e.g. React, Python…"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              disabled={!onSimulate}
            />
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          onClick={handleSimulate}
          disabled={!onSimulate || !selectedSkill.trim()}
          isLoading={isLoading}
        >
          Simulate
        </Button>
      </div>

      {!onSimulate && (
        <p className="text-xs text-gray-400 italic">Simulation is not available right now.</p>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {result && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-1">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Before:</span> {result.before} opportunities
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-medium">After:</span> {result.after} opportunities
          </p>
          {diff !== null && (
            <p className={`text-sm font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {diff >= 0 ? `+${diff}` : diff} more
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Estimates based on current platform data
      </p>
    </div>
  );
};

export default WhatIfSimulator;
