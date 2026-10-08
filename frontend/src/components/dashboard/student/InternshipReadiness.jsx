import React, { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { getReadiness } from '../../../services/careerService';
import ConfidenceBar from '../../career/ConfidenceBar';
import { Skeleton } from '../../ui/Skeleton';

const scoreColor = (score) => {
  if (score >= 70) return 'text-[#138808]';
  if (score >= 40) return 'text-[#e68a2e]';
  return 'text-red-500';
};

const InternshipReadiness = () => {
  const [readiness, setReadiness] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReadiness = async () => {
      try {
        const data = await getReadiness();
        setReadiness(data && typeof data === 'object' ? data : {});
      } catch (err) {
        console.warn('[InternshipReadiness] fetch error:', err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReadiness();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overall = Math.max(0, Math.min(100, readiness.overallScore ?? 0));
  const resumeScore = Math.max(0, Math.min(100, readiness.resumeScore ?? 0));
  const skillsScore = Math.max(0, Math.min(100, readiness.skillsScore ?? 0));
  const evidenceScore = Math.max(0, Math.min(100, readiness.evidenceScore ?? 0));
  const applicationScore = Math.max(0, Math.min(100, readiness.applicationScore ?? 0));
  const interviewScore = Math.max(0, Math.min(100, readiness.interviewScore ?? 0));

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <Gauge className="text-[#FF9933]" />
        Internship Readiness
      </h1>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="neo-glass p-8 text-center">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-semibold">
              Overall Readiness
            </p>
            <p className={`text-5xl font-black ${scoreColor(overall)}`}>{overall}%</p>
            <p className="text-xs text-gray-400 mt-3">
              This is an estimate based on your current profile data
            </p>
          </div>

          <div className="neo-glass p-6 space-y-5">
            <ConfidenceBar label="Resume Readiness" score={resumeScore} showPercent />
            <ConfidenceBar label="Skills Coverage" score={skillsScore} showPercent />
            <ConfidenceBar label="Evidence Strength" score={evidenceScore} showPercent />
            <ConfidenceBar label="Application Quality" score={applicationScore} showPercent />
            <ConfidenceBar label="Interview Readiness" score={interviewScore} showPercent />
          </div>
        </>
      )}
    </div>
  );
};

export default InternshipReadiness;
