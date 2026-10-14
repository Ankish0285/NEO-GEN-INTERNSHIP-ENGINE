import React, { useState, useEffect } from 'react';
import { Gauge } from 'lucide-react';
import { getReadiness } from '../../../services/careerService';
import { unwrapData, formatScorePercent } from '../../../utils/apiData';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';
import ConfidenceBar from '../../career/ConfidenceBar';
import { Skeleton } from '../../ui/Skeleton';

const scoreColor = (score) => {
  if (score == null) return 'text-gray-400';
  if (score >= 70) return 'text-[#138808]';
  if (score >= 40) return 'text-[#e68a2e]';
  return 'text-red-500';
};

const InternshipReadiness = () => {
  const { metrics, refreshMetrics } = useStudentDashboard();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReadiness = async () => {
    try {
      const raw = await getReadiness();
      setReadiness(unwrapData(raw));
    } catch (err) {
      console.warn('[InternshipReadiness] fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
    const onRefresh = () => {
      refreshMetrics?.();
      fetchReadiness();
    };
    window.addEventListener('ai:refresh', onRefresh);
    return () => window.removeEventListener('ai:refresh', onRefresh);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const overall =
    metrics?.internshipReadinessScore ??
    readiness?.internshipReadinessScore ??
    readiness?.overallScore ??
    null;
  const resumeScore = metrics?.atsScore ?? readiness?.resumeScore ?? null;
  const employability = metrics?.employabilityScore ?? readiness?.employabilityScore ?? null;
  const evidenceScore = readiness?.evidenceScore ?? null;
  const applicationScore = readiness?.applicationScore ?? null;
  const interviewScore = readiness?.interviewScore ?? null;

  const dataStatus = metrics?.dataStatus ?? readiness?.dataStatus;
  const hasAnalysis = overall != null || (dataStatus === 'available' || dataStatus === 'complete');

  return (
    <div className="space-y-6">
      <h1 className="neo-h2 flex items-center gap-2">
        <Gauge className="text-[#FF9933]" />
        Internship Readiness
      </h1>

      {loading && !metrics ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      ) : !hasAnalysis ? (
        <div className="neo-glass p-8 text-center">
          <p className="text-sm text-gray-500">
            {dataStatus === 'pending'
              ? 'Resume is still being processed. Readiness scores will appear after AI analysis completes.'
              : 'Run AI Analysis first to see your readiness scores.'}
          </p>
        </div>
      ) : (
        <>
          <div className="neo-glass p-8 text-center">
            <p className="text-sm text-gray-500 mb-2 uppercase tracking-wide font-semibold">
              Overall Readiness
            </p>
            <p className={`text-5xl font-black ${scoreColor(overall)}`}>
              {formatScorePercent(overall)}
            </p>
            <p className="text-xs text-gray-400 mt-3">
              From your latest persisted AI analysis — not an estimate
            </p>
          </div>

          <div className="neo-glass p-6 space-y-5">
            <ConfidenceBar label="Resume ATS" score={resumeScore ?? 0} showPercent={resumeScore != null} />
            {resumeScore == null && <p className="text-xs text-gray-400 -mt-3">Resume ATS: not analyzed</p>}
            <ConfidenceBar label="Employability" score={employability ?? 0} showPercent={employability != null} />
            {employability == null && <p className="text-xs text-gray-400 -mt-3">Employability: not analyzed</p>}
            {evidenceScore != null && (
              <ConfidenceBar label="Evidence Strength" score={evidenceScore} showPercent />
            )}
            {applicationScore != null && (
              <ConfidenceBar label="Application Quality" score={applicationScore} showPercent />
            )}
            {interviewScore != null ? (
              <ConfidenceBar label="Interview Readiness" score={interviewScore} showPercent />
            ) : (
              <p className="text-sm text-gray-400">Interview readiness: not analyzed</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InternshipReadiness;
