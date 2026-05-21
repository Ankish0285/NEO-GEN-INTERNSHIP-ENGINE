import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Briefcase, Star, ArrowRight, Sparkles, Brain } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { motion } from 'framer-motion';
import { getAIRecommendations } from '../../../services/aiService';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

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
          <h3 className="font-bold text-[#111827] line-clamp-1">{job.title}</h3>
          <p className="text-[#4B5563] text-sm">{job.company}</p>
        </div>
        {job.matchScore != null && (
          <span className="bg-[#e8f5e6] text-[#138808] text-xs font-bold px-2.5 py-1 rounded-full flex items-center border border-[#138808]/20">
            <Star size={12} className="mr-1 fill-current" />
            {job.matchScore}% Match
          </span>
        )}
      </div>

      {job.aiExplanation && (
        <p className="text-xs text-[#6B7280] mb-4 line-clamp-2">{job.aiExplanation}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4 text-sm text-[#4B5563]">
        {job.location && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <MapPin size={14} className="mr-1 text-[#FF9933]" /> {job.location}
          </span>
        )}
        {job.duration && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <Clock size={14} className="mr-1 text-[#FF9933]" /> {job.duration}
          </span>
        )}
        {job.stipend && (
          <span className="flex items-center bg-white/60 px-2 py-1 rounded-lg border border-black/5">
            <DollarSign size={14} className="mr-1 text-[#FF9933]" /> {job.stipend}
          </span>
        )}
      </div>

      {job.selectionProbability != null && (
        <p className="text-xs text-[#138808] mb-3">
          Selection probability: <strong>{job.selectionProbability}%</strong>
        </p>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-black/5">
        <span className="text-xs text-[#9CA3AF]">{job.postedAt || 'AI matched'}</span>
        <button type="button" className="neo-btn neo-btn-primary !min-h-[40px] text-sm" onClick={() => navigate('/find-internship')}>
          View <ArrowRight size={16} className="inline ml-1" />
        </button>
      </div>
    </motion.div>
  );
};

const Recommendations = () => {
  const { dashboardData } = useStudentDashboard();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiOnline, setAiOnline] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAIRecommendations(12);
      setRecommendations(res.recommendations || []);
      setAiOnline(true);
    } catch {
      setRecommendations(dashboardData?.recommendedInternships || []);
      setAiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener('ai:refresh', onRefresh);
    return () => window.removeEventListener('ai:refresh', onRefresh);
  }, [dashboardData]);

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <InternshipCard key={i} loading />
          ))}
        </div>
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
    </div>
  );
};

export default Recommendations;
