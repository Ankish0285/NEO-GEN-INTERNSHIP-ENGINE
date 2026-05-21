import React, { useMemo } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Skeleton } from '../../ui/Skeleton';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart2, PieChart as PieChartIcon, Activity } from 'lucide-react';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const EmptyChart = ({ message }) => (
  <div className="h-80 flex items-center justify-center text-sub text-sm text-center px-6">
    {message}
  </div>
);

const Analytics = () => {
  const { loading, applications, atsScoreData, profileData, dashboardData } = useStudentDashboard();

  const applicationData = useMemo(() => {
    const buckets = {};
    (applications || []).forEach((app) => {
      const d = new Date(app.createdAt);
      if (Number.isNaN(d.getTime())) return;
      const key = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      if (!buckets[key]) buckets[key] = { month: key, applied: 0, shortlisted: 0 };
      buckets[key].applied += 1;
      if (['Shortlisted', 'Interview', 'Accepted'].includes(app.status)) {
        buckets[key].shortlisted += 1;
      }
    });
    return Object.values(buckets);
  }, [applications]);

  const atsScoreChart = useMemo(() => {
    const score = atsScoreData?.score ?? dashboardData?.atsScore ?? 0;
    if (!score) return [];
    return [{ version: 'Latest', score }];
  }, [atsScoreData, dashboardData]);

  const skillDemandData = useMemo(() => {
    const skills = profileData?.skills || [];
    const matched = new Set((atsScoreData?.matchedKeywords || []).map((s) => s.toLowerCase()));
    if (!skills.length && !matched.size) return [];
    return skills.slice(0, 8).map((skill) => ({
      skill: skill.length > 14 ? `${skill.slice(0, 12)}…` : skill,
      demand: matched.has(skill.toLowerCase()) ? 80 : 50,
      yourLevel: matched.has(skill.toLowerCase()) ? 75 : 40,
    }));
  }, [profileData, atsScoreData]);

  if (loading) {
    return (
        <div className="space-y-8">
            <div>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96 rounded-xl" />
                <Skeleton className="h-96 rounded-xl" />
                <Skeleton className="lg:col-span-2 h-96 rounded-xl" />
            </div>
        </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 shadow-xl">
          <p className="font-semibold text-navy mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-sub capitalize">{entry.name}:</span>
              <span className="font-bold text-navy">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div className="space-y-8" initial="hidden" animate="visible" variants={containerVariants}>
      <div>
        <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
            <Activity className="text-saffron drop-shadow-sm" />
            Analytics & Insights
        </h1>
        <p className="text-sub mt-1">Charts from your real applications and resume analysis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="glass-card p-6 overflow-hidden group">
          <div className="flex justify-between items-center mb-6 border-b border-navy/5 pb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <TrendingUp className="text-saffron" size={20} />
                  Application Performance
              </h3>
          </div>
          {applicationData.length === 0 ? (
            <EmptyChart message="No applications yet. Apply to internships to see trends here." />
          ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={applicationData}>
                <defs>
                  <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000080" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#000080" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorShortlisted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#138808" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#138808" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000080" strokeOpacity={0.05} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', color: '#000080' }} />
                <Area type="monotone" dataKey="applied" stroke="#000080" strokeWidth={3} fillOpacity={1} fill="url(#colorApplied)" name="Applied" />
                <Area type="monotone" dataKey="shortlisted" stroke="#138808" strokeWidth={3} fillOpacity={1} fill="url(#colorShortlisted)" name="Shortlisted" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 overflow-hidden group">
          <div className="flex justify-between items-center mb-6 border-b border-navy/5 pb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <BarChart2 className="text-navy" size={20} />
                  ATS Score
              </h3>
          </div>
          {atsScoreChart.length === 0 ? (
            <EmptyChart message="Upload and analyze your resume on the ATS page to see your score here." />
          ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={atsScoreChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000080" strokeOpacity={0.05} />
                <XAxis dataKey="version" axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#FF9933" strokeWidth={4} dot={{r: 6, fill: '#FF9933'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          )}
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card p-6 lg:col-span-2 overflow-hidden group">
          <div className="flex justify-between items-center mb-6 border-b border-navy/5 pb-4">
              <h3 className="text-lg font-bold text-navy flex items-center gap-2">
                  <PieChartIcon className="text-saffron-hover" size={20} />
                  Your Skills vs ATS Match
              </h3>
          </div>
          {skillDemandData.length === 0 ? (
            <EmptyChart message="Add skills to your profile and run ATS analysis to compare skill coverage." />
          ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillDemandData} barSize={32} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000080" strokeOpacity={0.05} />
                <XAxis dataKey="skill" axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#000080', opacity: 0.7, fontSize: 12}} />
                <Tooltip cursor={{fill: '#000080', opacity: 0.05}} content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Bar dataKey="demand" fill="#000080" name="In resume (ATS)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="yourLevel" fill="#FF9933" name="Profile listed" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;
