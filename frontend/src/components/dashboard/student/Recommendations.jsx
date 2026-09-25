import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Briefcase, Star, ArrowRight, Sparkles, Brain, Lock, Crown } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { motion } from 'framer-motion';
import { getAIRecommendations } from '../../../services/aiService';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';
import { useSubscription } from '../../../context/SubscriptionContext';
import UpgradeModal from '../../ui/UpgradeModal';

const InternshipCard = ({ job, loading, index }) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="neo-glass p-6">
        <Skeleton className="h-5 w-3/4 mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const safeJob = job && typeof job === 'object' ? job : {};
  const eligibilityValue = safeJob.eligibilityStatus || safeJob.eligibility_status;
  const eligibilityStatus = typeof eligibilityValue === 'string' ? eligibilityValue : '';
  const scoreBreakdown = safeJob.scoreBreakdown || safeJob.score_breakdown;
  const matchedValue = safeJob.matchedSkills || safeJob.matched_skills;
  const missingValue = safeJob.missingSkills || safeJob.missing_skills;
  const matchedSkills = Array.isArray(matchedValue) ? matchedValue : [];
  const missingSkills = Array.isArray(missingValue) ? missingValue : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -6 }}
      className="neo-glass p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-[#111827] line-clamp-1">{safeJob.title || 'Internship opportunity'}</h3>
          <p className="text-[#4B5563] text-sm">{safeJob.company || safeJob.organization || 'Organization not provided'}</p>
        </div>
        {(safeJob.matchScore ?? safeJob.match_percentage) != null && (
          <span className="bg-[#e8f5e6] text-[#138808] text-xs font-bold px-2.5 py-1 rounded-full flex items-center border border-[#138808]/20">
            <Star size={12} className="mr-1 fill-current" />
            {safeJob.matchScore ?? safeJob.match_percentage}% Match
          </span>
        )}
      </div>

      {eligibilityStatus && (
        <span className={`inline-flex mb-3 px-2 py-1 rounded-full text-xs font-bold ${
          eligibilityStatus === 'eligible'
            ? 'bg-emerald-50 text-emerald-700'
            : eligibilityStatus === 'unknown'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700'
        }`}>
          {eligibilityStatus.replace('_', ' ')}
        </span>
      )}

      {(safeJob.aiExplanation || safeJob.ai_explanation) && (
        <p className="text-xs text-[#6B7280] mb-4 line-clamp-2">{safeJob.aiExplanation || safeJob.ai_explanation}</p>
      )}

      {scoreBreakdown && (
        <div className="grid grid-cols-3 gap-2 mb-4 text-[11px] text-[#4B5563]">
          <span>Skills {scoreBreakdown.skill_match}/40</span>
          <span>Projects {scoreBreakdown.project_match}/25</span>
          <span>ATS {scoreBreakdown.ats_quality}/10</span>
        </div>
      )}

      {(matchedSkills.length > 0 || missingSkills.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {matchedSkills.slice(0, 4).map((skill) => (
            <span key={`matched-${skill}`} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px]">{skill}</span>
          ))}
          {missingSkills.slice(0, 3).map((skill) => (
            <span key={`missing-${skill}`} className="px-2 py-1 rounded-md bg-red-50 text-red-700 text-[11px]">Missing: {skill}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4 text-sm text-[#4B5563]">
        {safeJob.location && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <MapPin size={14} className="mr-1 text-[#FF9933]" /> {safeJob.location}
          </span>
        )}
        {safeJob.duration && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <Clock size={14} className="mr-1 text-[#FF9933]" /> {safeJob.duration}
          </span>
        )}
        {safeJob.stipend && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <DollarSign size={14} className="mr-1 text-[#FF9933]" /> {safeJob.stipend}
          </span>
        )}
      </div>

      {(safeJob.selectionProbability ?? safeJob.selection_probability) != null && (
        <p className="text-xs text-[#138808] mb-3">
          Selection probability: <strong>{safeJob.selectionProbability ?? safeJob.selection_probability}%</strong>
        </p>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-black/5">
        <span className="text-xs text-[#9CA3AF]">{safeJob.postedAt || 'AI matched'}</span>
        <button type="button" className="neo-btn neo-btn-primary min-h-10! text-sm" onClick={() => navigate('/find-internship')}>
          View <ArrowRight size={16} className="inline ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

const Recommendations = () => {
  const { dashboardData } = useStudentDashboard();
  const {
    isSubscribed, isBlocked, freeUsed, freeLimit,
    subscription, openUpgrade, closeUpgrade, showUpgrade, refresh: refreshSub,
  } = useSubscription();

  const [recommendations, setRecommendations] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [aiOnline, setAiOnline] = useState(false);
  const [error,    setError]    = useState(null);
  // true when the backend explicitly returned 403 SUBSCRIPTION_REQUIRED
  const [subBlocked, setSubBlocked] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    setSubBlocked(false);
    try {
      const res = await getAIRecommendations(12);
      const recs = Array.isArray(res?.recommendations) ? res.recommendations : [];
      setRecommendations(recs.filter((item) => item && typeof item === 'object'));
      setAiOnline(true);
    } catch (err) {
      // 403 = subscription gate triggered by backend
      if (err?.status === 403 || err?.response?.status === 403) {
        setSubBlocked(true);
        setRecommendations([]);
        setAiOnline(false);
      } else {
        console.warn('[Recommendations] AI fetch failed, using fallback:', err?.message);
        const fallback = Array.isArray(dashboardData?.recommendedInternships)
          ? dashboardData.recommendedInternships
          : [];
        setRecommendations(fallback.filter((item) => item && typeof item === 'object'));
        setAiOnline(false);
        if (fallback.length === 0) {
          setError(err?.message || 'Could not load recommendations');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Run only once on mount — DO NOT put dashboardData in the dep array.
  // dashboardData is a new object on every context render, which caused an
  // infinite loop: load() → re-render → new dashboardData ref → load() again.
  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener('ai:refresh', onRefresh);
    return () => window.removeEventListener('ai:refresh', onRefresh);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Shared upgrade modal */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={closeUpgrade}
        onSubscribed={() => { refreshSub(); load(); }}
        featureLabel="AI Recommendations"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="neo-h2 flex items-center gap-2">
            <Sparkles className="text-[#FF9933]" />
            AI Recommendations
          </h1>
          <p className="neo-lead mt-1 flex items-center gap-2">
            <Brain size={14} />
            {aiOnline ? 'Powered by NeoGen AI matching engine' : 'Using profile-based matching (start AI service for full intelligence)'}
          </p>
        </div>
      </div>

      {/* ── Subscription status bar ── */}
      {!loading && (
        isSubscribed && subscription ? (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <Crown size={16} className="text-emerald-600 shrink-0" />
            <p className="text-sm font-bold text-emerald-800 flex-1">{subscription.planName || 'Premium'} — Active</p>
            {subscription.expiresAt && (
              <p className="text-xs text-emerald-600">
                Until {new Date(subscription.expiresAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
              </p>
            )}
          </div>
        ) : !subBlocked ? (
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isBlocked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
            <span className={`text-xs font-semibold ${isBlocked ? 'text-red-600' : 'text-gray-600'}`}>
              Free AI Analyses: <strong>{freeUsed} / {freeLimit}</strong>
            </span>
            {isBlocked && (
              <button onClick={openUpgrade}
                className="ml-auto text-xs px-3 py-1 bg-[#FF9933] text-white rounded-full font-semibold hover:bg-[#e68a2e]">
                Upgrade
              </button>
            )}
          </div>
        ) : null
      )}

      {/* ── Subscription-blocked banner ── */}
      {subBlocked && !isSubscribed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border-2 border-[#FF9933]/30 bg-[#fff8f0] p-8 text-center"
        >
          <Lock size={36} className="mx-auto text-[#FF9933]/60 mb-3" />
          <h3 className="text-lg font-black text-gray-900 mb-1">Premium AI Recommendations</h3>
          <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
            You have used all {freeLimit} free AI analyses. Upgrade to unlock personalized AI recommendations with match scores, selection probability, and career insights.
          </p>
          <button
            type="button"
            onClick={openUpgrade}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}
          >
            <Crown size={15} className="inline mr-2 mb-0.5" />
            View Premium Plans
          </button>
        </motion.div>
      )}

      {!subBlocked && (
        <>
          {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <InternshipCard key={i} loading />
          ))}
        </div>
      ) : error && recommendations.length === 0 ? (
        <motion.div className="neo-cta neo-glass text-center py-12">
          <Briefcase size={40} className="mx-auto text-red-400/60 mb-4" />
          <h3 className="text-xl font-bold text-[#111827]">Could not load recommendations</h3>
          <p className="neo-lead mt-2 max-w-md mx-auto text-red-500">
            {error}
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-4 neo-btn neo-btn-primary min-h-10! text-sm"
          >
            Retry
          </button>
        </motion.div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((job, idx) => (
            <InternshipCard key={job.id || idx} job={job} index={idx} />
          ))}
        </div>
      ) : (
        <motion.div className="neo-cta neo-glass text-center py-12">
          <Briefcase size={40} className="mx-auto text-[#FF9933]/50 mb-4" />
          <h3 className="text-xl font-bold text-[#111827]">No recommendations yet</h3>
          <p className="neo-lead mt-2 max-w-md mx-auto">
            Upload your resume in ATS Resume or open AI Intelligence to generate matches.
          </p>
        </motion.div>
      )}
        </>
      )}
    </div>
  );
};

export default Recommendations;
