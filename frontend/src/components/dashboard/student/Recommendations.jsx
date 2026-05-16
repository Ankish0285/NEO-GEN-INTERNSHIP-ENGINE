import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, DollarSign, Briefcase, Star, ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '../../ui/Skeleton';
import { motion } from 'framer-motion';

const InternshipCard = ({ job, loading, index }) => {
  const navigate = useNavigate();
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex gap-4 w-full">
            <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
            <div className="w-full space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-6">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-navy/5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="glass-card p-6 group cursor-default"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-linear-to-br from-saffron/10 to-green-primary/10 rounded-xl flex items-center justify-center text-2xl border border-navy/5 shadow-sm group-hover:scale-110 transition-transform">
            {job.logo || '🏢'}
          </div>
          <div>
            <h3 className="font-bold text-navy line-clamp-1">{job.title}</h3>
            <p className="text-sub text-sm line-clamp-1">{job.company}</p>
          </div>
        </div>
        {job.matchScore && (
          <span className="bg-green-light text-green-hover text-xs font-bold px-2.5 py-1 rounded-full flex items-center border border-green-primary/20 shadow-sm">
            <Star size={12} className="mr-1 fill-current" />
            {job.matchScore}% Match
          </span>
        )}
      </div>
  
      <div className="flex flex-wrap gap-2 mb-6 text-sm text-navy/70">
        <span className="flex items-center bg-white/50 px-2.5 py-1 rounded-lg border border-navy/5 shadow-sm">
          <MapPin size={14} className="mr-1.5 text-saffron" /> {job.location}
        </span>
        <span className="flex items-center bg-white/50 px-2.5 py-1 rounded-lg border border-navy/5 shadow-sm">
          <Clock size={14} className="mr-1.5 text-saffron" /> {job.duration}
        </span>
        <span className="flex items-center bg-white/50 px-2.5 py-1 rounded-lg border border-navy/5 shadow-sm">
          <DollarSign size={14} className="mr-1.5 text-saffron" /> {job.stipend}
        </span>
        <span className="flex items-center bg-white/50 px-2.5 py-1 rounded-lg border border-navy/5 shadow-sm">
          <Briefcase size={14} className="mr-1.5 text-saffron" /> {job.type}
        </span>
      </div>
  
      <div className="flex items-center justify-between pt-4 border-t border-navy/5">
        <span className="text-xs text-sub font-medium">Posted {job.postedAt}</span>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          className="btn-primary py-1.5 px-4 text-sm"
          onClick={() => navigate('/internships')}
        >
          Apply Now <ArrowRight size={16} className="ml-2 inline group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
};

import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const Recommendations = () => {
  const { dashboardData, loading } = useStudentDashboard();
  const navigate = useNavigate();
  const recommendations = dashboardData?.recommendedInternships || [];
  
  const onNavigate = (path) => {
     if (path === 'profile') {
         navigate('/dashboard/profile');
     } else {
         navigate(path);
     }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
              <Sparkles className="text-saffron fill-saffron" />
              Recommended for You
            </h1>
            <p className="text-sub mt-1">AI-curated internships based on your profile and skills.</p>
        </div>
        <select className="border border-navy/10 rounded-xl text-sm px-4 py-2.5 bg-white/50 focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron shadow-sm cursor-pointer hover:bg-white transition-colors text-navy font-medium">
            <option>Sort by Match Score</option>
            <option>Newest First</option>
            <option>Highest Stipend</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <InternshipCard key={i} loading={true} />
          ))}
        </div>
      ) : recommendations && recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((job, idx) => (
            <InternshipCard key={idx} job={job} index={idx} />
          ))}
        </div>
      ) : (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-linear-to-br from-saffron/5 to-white/40 rounded-2xl border border-saffron/10 shadow-sm"
        >
             <div className="w-20 h-20 bg-linear-to-br from-saffron/10 to-transparent rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                 <Briefcase size={40} className="text-saffron/50" />
             </div>
             <h3 className="text-xl font-bold text-navy">No recommendations yet</h3>
             <p className="text-sub mt-2 mb-8 max-w-md mx-auto">
                We need more information about your skills and preferences to find the best matches.
             </p>
             <button 
                onClick={() => onNavigate && onNavigate('profile')}
                className="btn-primary"
             >
                 Update Profile
             </button>
        </motion.div>
      )}
    </div>
  );
};

export default Recommendations;
