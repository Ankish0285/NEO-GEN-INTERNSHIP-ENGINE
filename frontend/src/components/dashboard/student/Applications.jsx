import React, { useState } from 'react';
import { Search, Filter, MoreHorizontal, Calendar, Building, Briefcase, ArrowRight, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '../../ui/Skeleton';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../ui/EmptyState';
import ApplicationService from '../../../services/applicationService';
import { resolveResumeUrl } from '../../../utils/resolveResumeUrl';
import { canWithdrawApplicationStatus } from '../../../utils/applicationStatus';

const StatusBadge = ({ status }) => {
  const s = (status || 'Applied').toLowerCase().replace(/\s+/g, ' ');
  const styles = {
    applied: 'bg-blue-50 text-blue-900 border-blue-200',
    viewed: 'bg-slate-100 text-slate-800 border-slate-300',
    'under review': 'bg-amber-50 text-amber-900 border-amber-200',
    shortlisted: 'bg-indigo-50 text-indigo-900 border-indigo-200',
    interview: 'bg-violet-50 text-violet-900 border-violet-200',
    accepted: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    selected: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const className = styles[s] || styles.applied;

  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold border', className)}>
      {status || 'Applied'}
    </span>
  );
};

import { useStudentDashboard } from '../../../context/StudentDashboardContext';

const Applications = () => {
  const navigate = useNavigate();
  const { applications, loading, refreshDashboard } = useStudentDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Selected'];

  const getStageIndex = (status) => {
    if(!status) return 0;
    const s = status.toLowerCase();
    if(s === 'applied' || s === 'viewed') return 0;
    if(s === 'shortlisted' || s === 'under review') return 1;
    if(s === 'interview') return 2;
    if(s === 'selected' || s === 'accepted') return 3;
    if(s === 'rejected') return -1;
    return 0;
  };

  const getResumeUrl = (app) => {
    const resumeUrl = app.resume || app.resumePath || (app.details && app.details.resumePath);
    if (!resumeUrl) return null;
    return resolveResumeUrl(resumeUrl);
  };

  // Filter applications based on search term
  const filteredApplications = applications?.filter(app => {
    const term = searchTerm.toLowerCase();
    return (
      app.company?.toLowerCase().includes(term) ||
      app.role?.toLowerCase().includes(term) ||
      app.internship?.title?.toLowerCase().includes(term) ||
      app.internship?.company?.toLowerCase().includes(term)
    );
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
              <Briefcase className="text-saffron" />
              My Applications
            </h1>
            <p className="text-sub mt-1">Track the status of your internship applications.</p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search applications..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/50 border border-navy/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron/20 focus:border-saffron shadow-sm transition-all"
                />
            </div>
            <button className="p-2 bg-white/50 border border-navy/10 rounded-xl hover:bg-saffron/10 hover:text-saffron text-navy/60 shadow-sm transition-colors">
                <Filter size={20} />
            </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-navy/5">
            <thead className="bg-slate-100/90">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Company & Role
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Date Applied
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white/90">
              {loading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  <Skeleton className="h-10 w-10 rounded-lg mr-4" />
                                  <div className="space-y-2">
                                      <Skeleton className="h-4 w-32" />
                                      <Skeleton className="h-3 w-24" />
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-4 w-24" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <Skeleton className="h-6 w-20 rounded-full" />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                              <Skeleton className="h-8 w-8 rounded-full ml-auto" />
                          </td>
                      </tr>
                  ))
              ) : filteredApplications && filteredApplications.length > 0 ? (
                <AnimatePresence>
                  {filteredApplications.map((app, index) => {
                    const appKey = app._id || app.id;
                    return (
                    <React.Fragment key={appKey}>
                    <motion.tr 
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-gradient-to-br from-orange-50 to-emerald-50 text-xl shadow-sm">
                              {app.companyLogo || <Building size={20} className="text-orange-600" />}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900">{app.role || app.internship?.title || 'Internship Role'}</div>
                            <div className="text-sm text-slate-600">{app.company || app.internship?.company || 'Company Name'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm font-medium text-slate-700">
                          <Calendar size={16} className="mr-2 text-orange-600" />
                          {new Date(app.createdAt || app.appliedDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                           onClick={() => setExpandedId(expandedId === appKey ? null : appKey)}
                           className="text-slate-500 hover:text-orange-600 transition-colors p-2 hover:bg-orange-50 rounded-lg"
                           aria-label="Toggle application details"
                        >
                          <MoreHorizontal size={20} />
                        </button>
                      </td>
                    </motion.tr>
                    {expandedId === appKey && (
                        <tr className="bg-slate-50">
                          <td colSpan="4" className="px-6 py-6 border-b border-slate-200">
                             <div className="w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                                <h4 className="text-sm font-bold text-slate-800 mb-5 tracking-wide uppercase border-b border-slate-100 pb-2">
                                  Application Tracker
                                </h4>
                                <div className="flex items-center justify-between relative px-1">
                                   <div className="absolute left-0 top-1/2 w-full h-0.5 bg-slate-300 -z-0 -translate-y-1/2 rounded-full" aria-hidden />
                                   
                                   {STAGES.map((stage, idx) => {
                                      const currentIndex = getStageIndex(app.status);
                                      const isCompleted = currentIndex >= idx && currentIndex !== -1;
                                      const isRejected = currentIndex === -1;
                                      const isCurrent = currentIndex === idx && !isRejected;
                                      
                                      return (
                                        <div key={idx} className="relative z-10 flex min-w-[4.5rem] flex-col items-center px-2 sm:px-3">
                                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm ${
                                            isRejected ? 'border-rose-500 bg-rose-100 text-rose-700' :
                                            isCompleted ? 'border-orange-500 bg-orange-500 text-white' :
                                            isCurrent ? 'border-orange-400 bg-orange-50 text-orange-900' :
                                            'border-slate-400 bg-white text-slate-700'
                                          }`}>
                                              {isCompleted ? '✓' : idx + 1}
                                          </div>
                                          <span className={`mt-2 max-w-[5.5rem] text-center text-xs font-semibold leading-tight ${
                                            isRejected ? 'text-rose-800' :
                                            isCompleted || isCurrent ? 'text-slate-900' : 'text-slate-700'
                                          }`}>
                                            {isRejected && idx === 3 ? 'Rejected' : stage}
                                          </span>
                                        </div>
                                      );
                                   })}
                                </div>
                                <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                   <div className="flex flex-wrap gap-3">
                                      {getResumeUrl(app) && (
                                         <a 
                                            href={getResumeUrl(app)} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 rounded-lg border-2 border-orange-500 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-900 shadow-sm transition-colors hover:bg-orange-100"
                                         >
                                            <FileText size={16} className="text-orange-600" />
                                            View Resume
                                         </a>
                                      )}
                                      <button 
                                         type="button"
                                         className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-400 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50"
                                         onClick={() => navigate(`/internships/${app.internship?._id || app.internship}`)}
                                      >
                                         <Building size={16} className="text-slate-600" />
                                         View Internship
                                      </button>
                                   </div>
                                   
                                   {canWithdrawApplicationStatus(app.status) && (
                                      <button 
                                         type="button"
                                         onClick={() => {
                                            if (window.confirm('Are you sure you want to withdraw this application?')) {
                                               ApplicationService.withdrawApplication(appKey)
                                                  .then(() => {
                                                     alert('Application withdrawn successfully');
                                                     setExpandedId(null);
                                                     refreshDashboard?.();
                                                  })
                                                  .catch((err) => alert(err?.message || err?.data?.message || 'Failed to withdraw'));
                                            }
                                         }}
                                         className="inline-flex items-center gap-2 rounded-lg border-2 border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 shadow-sm transition-colors hover:bg-rose-100"
                                      >
                                         Withdraw Application
                                      </button>
                                   )}
                                </div>
                             </div>
                          </td>
                       </tr>
                    )}
                    </React.Fragment>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <tr>
                    <td colSpan="4" className="px-6 py-12">
                        <EmptyState 
                            title="No applications found"
                            message={searchTerm ? `No results for "${searchTerm}"` : "Start applying to internships to see them here."}
                            actionLabel={!searchTerm ? "Browse Internships" : null}
                            onAction={!searchTerm ? () => navigate('/find-internships') : null}
                        />
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
         {filteredApplications && filteredApplications.length > 0 && (
             <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-6">
                <div className="text-sm font-medium text-slate-700">
                    Showing <span className="font-bold text-slate-900">1</span> to <span className="font-bold text-slate-900">{filteredApplications.length}</span> of <span className="font-bold text-slate-900">{applications?.length || 0}</span> results
                </div>
                <div className="flex flex-1 justify-end gap-2">
                    <button type="button" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        Previous
                    </button>
                    <button type="button" className="inline-flex items-center rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                        Next
                    </button>
                </div>
             </div>
        )}
      </div>
    </motion.div>
  );
};

export default Applications;
