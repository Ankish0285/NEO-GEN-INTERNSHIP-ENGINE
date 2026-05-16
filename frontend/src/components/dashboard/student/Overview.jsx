import React from 'react';
import { Briefcase, FileText, UserCheck, CheckCircle, TrendingUp, ArrowRight, Clock, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '../../ui/Card';
import { Skeleton } from '../../ui/Skeleton';

const StatCard = ({ title, value, label, icon: Icon, color, bgClass, trend, loading }) => (
  <Card noPadding className={`border-l-4 border-l-transparent hover:border-l-saffron transition-all duration-300 ${bgClass || ''}`}>
    <div className="p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
         <Icon size={120} />
      </div>
      {loading ? (
        <div className="space-y-3 relative z-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-4 w-full" />
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-navy/70 uppercase tracking-wide">{title}</p>
              <h3 className="text-4xl font-bold text-navy mt-2">{value}</h3>
            </div>
            <div className={`p-3 rounded-2xl ${color} shadow-sm bg-gradient-to-br from-white/60 to-${color.replace('text-', '')}/10 backdrop-blur-md border border-white/40`}>
              <Icon size={26} />
            </div>
          </div>
          <div className="mt-5 flex items-center text-sm">
            {trend ? (
              <span className="text-green-primary font-semibold flex items-center bg-green-light px-2.5 py-1 rounded-full shadow-sm">
                <TrendingUp size={14} className="mr-1" />
                {trend}
              </span>
            ) : (
              <span className="text-navy/60 font-medium">
                  {label}
              </span>
            )}
            <span className="text-navy/50 ml-3 text-xs">{trend ? 'vs last month' : ''}</span>
          </div>
        </div>
      )}
    </div>
  </Card>
);

const ActivityItem = ({ title, company, time, status }) => (
  <div className="flex items-center justify-between py-4 border-b border-navy/5 last:border-0 hover:bg-gradient-to-r hover:from-saffron/5 hover:to-transparent px-4 -mx-4 transition-all duration-300 rounded-lg">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron/10 to-green-primary/10 shadow-sm flex items-center justify-center text-navy font-bold text-lg border border-white/40">
        {company.substring(0, 2).toUpperCase()}
      </div>
      <div>
        <h4 className="text-base font-semibold text-navy">{title}</h4>
        <p className="text-sm text-sub">{company} • {time}</p>
      </div>
    </div>
    <span className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
      status === 'Applied' ? 'bg-blue-light text-navy border border-blue-200' :
      status === 'Interview' ? 'bg-saffron-light text-saffron-hover border border-saffron-200' :
      status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-100' :
      'bg-green-light text-green-primary border border-green-200'
    }`}>
      {status}
    </span>
  </div>
);

import { useNavigate } from 'react-router-dom';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const Overview = () => {
  const { dashboardData, profileData, loading } = useStudentDashboard();
  const navigate = useNavigate();

  const onNavigate = (path) => {
    if (path === 'find-internship') {
        navigate('/find-internship');
    } else {
        navigate(`/dashboard/${path}`);
    }
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-[1200px] mx-auto pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">
            Welcome back, {profileData?.name?.split(' ')[0] || 'Student'}! 👋
          </h1>
          <p className="text-sub mt-2 text-lg">Here's what's happening with your job search today.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={() => onNavigate('profile')} 
                className="btn-primary flex items-center"
            >
                Update Profile
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
            <StatCard 
            title="Applications" 
            value={dashboardData?.totalApplications || 0}
            label="Total sent"
            icon={Briefcase}
            color="text-green-primary"
            bgClass="bg-green-light/40"
            trend="+12%"
            loading={loading}
            />
        </motion.div>
        <motion.div variants={itemVariants}>
            <StatCard 
            title="ATS Score" 
            value={dashboardData?.atsScore || 0}
            label="Resume strength"
            icon={FileText}
            color="text-saffron-hover"
            bgClass="bg-saffron-light/50"
            trend={dashboardData?.atsScore > 70 ? "Good" : "Needs Work"}
            loading={loading}
            />
        </motion.div>
        <motion.div variants={itemVariants}>
            <StatCard 
            title="Profile" 
            value={`${profileData?.profileCompletionPercentage || 0}%`}
            label="Completion rate"
            icon={UserCheck}
            color="text-blue-600"
            bgClass="bg-blue-light/50"
            trend={profileData?.profileCompletionPercentage < 100 ? "Incomplete" : "Complete"}
            loading={loading}
            />
        </motion.div>
        <motion.div variants={itemVariants}>
            <StatCard 
            title="Interviews" 
            value={dashboardData?.interviews || 0}
            label="Scheduled"
            icon={CheckCircle}
            color="text-teal-600"
            bgClass="bg-mint-light/50"
            trend="Active"
            loading={loading}
            />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Application Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
            <Card 
                title="Application Activity" 
                subtitle="Your recent job applications and their status"
                action={
                        <button 
                        onClick={() => onNavigate('applications')}
                        className="text-sm text-saffron-hover font-semibold hover:text-saffron flex items-center transition-colors"
                    >
                        View All <ArrowRight size={16} className="ml-1" />
                    </button>
                }
            >
                <div className="flex flex-col">
                    {[1, 2, 3].map((i) => (
                        <ActivityItem 
                            key={i}
                            title={`Frontend Developer Intern #${i}`}
                            company="Tech Corp Inc."
                            time={`${i} day${i > 1 ? 's' : ''} ago`}
                            status={i === 1 ? 'Interview' : 'Applied'}
                        />
                    ))}
                </div>
            </Card>

            <Card title="Recommended for You" subtitle="Based on your skills and profile">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="border border-saffron/10 bg-gradient-to-br from-saffron/5 to-green-primary/5 rounded-xl p-5 hover:bg-white/60 transition-all duration-300 shadow-sm cursor-pointer hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-white/80 rounded-xl flex items-center justify-center text-2xl shadow-sm border border-navy/5">
                                    🚀
                                </div>
                                <span className="bg-green-light text-green-primary text-xs px-3 py-1 rounded-full font-bold shadow-sm">New</span>
                            </div>
                            <h4 className="font-semibold text-navy text-lg transition-colors">React Developer</h4>
                            <p className="text-sm text-sub mb-4 mt-1">Startup Inc. • Remote</p>
                            <div className="flex items-center gap-3 text-sm text-navy/60 font-medium">
                                <span className="flex items-center"><Clock size={16} className="mr-1.5 text-saffron"/> 2d ago</span>
                                <span className="flex items-center"><Award size={16} className="mr-1.5 text-green-primary"/> ₹40k/mo</span>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </motion.div>

        {/* Right Sidebar - Pro Tips & Progress */}
        <motion.div variants={itemVariants} className="space-y-6">
            <Card className="bg-gradient-to-br from-navy to-navy-light text-white border-white/20 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] pointer-events-none">
                    <Award size={100} />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-gradient-to-br from-saffron/20 to-white/10 rounded-2xl backdrop-blur-md shadow-sm border border-white/10">
                        <Award size={28} className="text-saffron" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl tracking-wide">Pro Tip!</h3>
                        <p className="text-blue-100 text-sm mt-2 leading-relaxed">
                            Completing your profile and adding verified skills increases your visibility to recruiters by 40%.
                        </p>
                        <button 
                            onClick={() => onNavigate('profile')}
                            className="mt-5 bg-saffron text-white text-sm font-bold py-2.5 px-5 rounded-xl hover:bg-saffron-hover transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            Complete Profile
                        </button>
                    </div>
                </div>
            </Card>

            <Card title="Profile Strength">
                <div className="flex flex-col items-center py-4">
                    <div className="relative w-32 h-32 mb-4">
                        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-md">
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#e6e6f2"
                                strokeWidth="12"
                                fill="none"
                            />
                            <circle
                                cx="64"
                                cy="64"
                                r="56"
                                stroke="#138808"
                                strokeWidth="12"
                                fill="none"
                                strokeDasharray={351.86}
                                strokeDashoffset={351.86 * (1 - (profileData?.profileCompletionPercentage || 0) / 100)}
                                className="transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className="text-3xl font-bold text-navy">{profileData?.profileCompletionPercentage || 0}%</span>
                        </div>
                    </div>
                    <p className="text-center text-sm font-medium text-sub mb-2 mt-2">
                        Your profile is doing great! Add a few more details to reach <span className="text-saffron-hover font-bold">100%</span>.
                    </p>
                </div>
            </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
