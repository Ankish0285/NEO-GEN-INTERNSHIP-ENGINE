import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { getSkillEvidence } from '../../../services/careerService';
import { Skeleton } from '../../ui/Skeleton';
import Card from '../../ui/Card';
import Modal from '../../ui/Modal';
import ConfidenceBar from '../../career/ConfidenceBar';
import EmptyState from '../../ui/EmptyState';

const CAREER_PATHS = [
  { name: 'Frontend Developer', key: 'frontend', requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'HTML', 'Next.js'] },
  { name: 'Backend Developer', key: 'backend', requiredSkills: ['Node.js', 'Python', 'MongoDB', 'SQL', 'REST APIs', 'Docker'] },
  { name: 'Data Science', key: 'data-science', requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'Statistics', 'TensorFlow'] },
  { name: 'DevOps Engineer', key: 'devops', requiredSkills: ['Docker', 'AWS', 'Linux', 'CI/CD', 'Kubernetes', 'Terraform'] },
];

const CareerPathSimulator = () => {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPath, setSelectedPath] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const res = await getSkillEvidence();
        const raw = res?.data || res;
        const evidenceDocs = Array.isArray(raw) ? raw : [];

        const computed = CAREER_PATHS.map((path) => {
          const matched = evidenceDocs.filter((ev) =>
            path.requiredSkills.some(
              (s) => s.toLowerCase() === (ev.skillName || '').toLowerCase()
            )
          );
          const coveragePercent = Math.round(matched.length / path.requiredSkills.length * 100);
          const coveredSkills = matched.map((e) => e.skillName);
          const missingSkills = path.requiredSkills.filter(
            (s) => !coveredSkills.some((c) => c.toLowerCase() === s.toLowerCase())
          );
          const skillCoverage = path.requiredSkills.map((s) => {
            const ev = evidenceDocs.find(
              (e) => (e.skillName || '').toLowerCase() === s.toLowerCase()
            );
            return ev?.confidenceScore ?? 0;
          });
          const nextSteps = missingSkills.slice(0, 3).map(
            (s) => `Build evidence for ${s} via projects or adaptive learning`
          );
          return {
            ...path,
            coveragePercent,
            coveredSkills,
            missingSkills,
            skillCoverage,
            nextSteps,
          };
        });

        setPaths(computed);
      } catch (err) {
        console.warn('[CareerPathSimulator] fetch error:', err?.message);
        // Fallback: show paths with 0 coverage
        setPaths(CAREER_PATHS.map((path) => ({
          ...path,
          coveragePercent: 0,
          coveredSkills: [],
          missingSkills: path.requiredSkills,
          skillCoverage: path.requiredSkills.map(() => 0),
          nextSteps: path.requiredSkills.slice(0, 3).map(
            (s) => `Build evidence for ${s} via projects or adaptive learning`
          ),
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchPaths();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectPath = (path) => {
    setSelectedPath(path);
    setShowDetail(true);
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedPath(null);
  };

  const gapCount = (path) => {
    const required = Array.isArray(path.requiredSkills) ? path.requiredSkills : [];
    const covered = Array.isArray(path.coveredSkills) ? path.coveredSkills : [];
    return Math.max(0, required.length - covered.length);
  };

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <TrendingUp className="text-[#FF9933]" />
        Career Path Simulator
      </h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <EmptyState
          title="No Career Paths Available"
          message="Complete your profile to explore personalized career path simulations."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path, idx) => {
            const coverage = Math.max(0, Math.min(100, path.coveragePercent ?? 0));
            const gaps = gapCount(path);
            return (
              <button
                key={path._id || idx}
                type="button"
                className="neo-glass p-5 text-left hover:ring-2 hover:ring-[#FF9933]/40 transition-all rounded-xl w-full"
                onClick={() => handleSelectPath(path)}
              >
                <h3 className="font-bold text-[#111827] mb-2">{path.name || 'Career Path'}</h3>
                <div className="mb-3">
                  <ConfidenceBar label="Current Coverage" score={coverage} showPercent size="sm" />
                </div>
                {gaps > 0 && (
                  <span className="inline-block bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {gaps} skill gap{gaps !== 1 ? 's' : ''}
                  </span>
                )}
                {Array.isArray(path.requiredSkills) && path.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {path.requiredSkills.slice(0, 4).map((skill, i) => (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                    {path.requiredSkills.length > 4 && (
                      <span className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        +{path.requiredSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showDetail}
        onClose={handleCloseDetail}
        title={selectedPath?.name || 'Career Path Detail'}
      >
        {selectedPath && (
          <div className="space-y-5">
            {Array.isArray(selectedPath.requiredSkills) &&
              selectedPath.requiredSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Required Skills Coverage
                  </h4>
                  <div className="space-y-2">
                    {selectedPath.requiredSkills.map((skill, i) => {
                      const skillCoverage =
                        Array.isArray(selectedPath.skillCoverage) &&
                        selectedPath.skillCoverage[i] != null
                          ? selectedPath.skillCoverage[i]
                          : Array.isArray(selectedPath.coveredSkills) &&
                            selectedPath.coveredSkills.includes(skill)
                          ? 100
                          : 0;
                      return (
                        <ConfidenceBar
                          key={i}
                          label={skill}
                          score={skillCoverage}
                          showPercent
                          size="sm"
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            {Array.isArray(selectedPath.missingSkills) &&
              selectedPath.missingSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Missing Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPath.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {Array.isArray(selectedPath.nextSteps) && selectedPath.nextSteps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Recommended Next Steps
                </h4>
                <ol className="space-y-1.5">
                  {selectedPath.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#FF9933]/15 text-[#FF9933] text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CareerPathSimulator;
