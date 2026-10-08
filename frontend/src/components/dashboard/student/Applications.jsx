import React, { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, Calendar, Building, Briefcase, FileText, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Skeleton } from '../../ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../ui/EmptyState';
import ApplicationService from '../../../services/applicationService';
import { resolveResumeUrl } from '../../../utils/resolveResumeUrl';
import { canWithdrawApplicationStatus } from '../../../utils/applicationStatus';
import ApplicationStrengthBar from '../../career/ApplicationStrengthBar';
import TruthGuardAlert from '../../career/TruthGuardAlert';
import { getOpportunityCost, getApplicationStrength } from '../../../services/careerService';
import { generateApplication } from '../../../services/aiService';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

// Map numeric rank (1, 2, 3…) to Priority A/B/C tier labels and styles
const PRIORITY_TIERS = {
  1: { label: 'Priority A', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  2: { label: 'Priority B', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
  3: { label: 'Priority C', className: 'bg-slate-100 text-slate-600 border border-slate-200' },
};

const getPriorityTier = (rank) => {
  const n = Number(rank);
  return PRIORITY_TIERS[n] || { label: `Priority ${rank}`, className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' };
};

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

const Applications = () => {
  const navigate = useNavigate();
  const { applications, loading, refreshDashboard } = useStudentDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [opportunityRanks, setOpportunityRanks] = useState({});
  // strengthData: { [appId]: { loading: bool, strength: number|null, breakdown: object } }
  const [strengthData, setStrengthData] = useState({});
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [aiIssues, setAiIssues] = useState([]);
  const [currentInternshipId, setCurrentInternshipId] = useState(null);

  useEffect(() => {
    getOpportunityCost()
      .then((res) => {
        const list = res?.data?.applications || res?.applications || res?.data || [];
        const map = {};
        if (Array.isArray(list)) {
          list.forEach((item) => {
            const key = item.applicationId || item._id || item.id;
            if (key) map[key] = { rank: item.opportunityCostRank || item.rank };
          });
        }
        setOpportunityRanks(map);
      })
      .catch(() => {}); // non-critical
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Selected'];

  const handleGenerateWithAI = async (internshipId) => {
    setCurrentInternshipId(internshipId);
    setAiContent('');
    setAiIssues([]);
    setAiModalOpen(true);
    setAiGenerating(true);
    try {
      const res = await generateApplication(internshipId);
      const data = res?.data || res || {};
      setAiContent(data.coverLetter || data.content || data.application || '');
      setAiIssues(data.issues || data.truthGuardIssues || []);
    } catch (err) {
      setAiContent('');
      setAiIssues([]);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCalculateStrength = async (appId) => {
    if (!appId) return;
    setStrengthData((prev) => ({ ...prev, [appId]: { loading: true, strength: undefined, breakdown: {} } }));
    try {
      const res = await getApplicationStrength(appId);
      const data = res?.data || res || {};
      setStrengthData((prev) => ({
        ...prev,
        [appId]: {
          loading: false,
          strength: data.strength ?? data.strengthScore ?? data.score ?? 0,
          breakdown: data.breakdown ?? data.strengthBreakdown ?? {},
        },
      }));
    } catch {
      setStrengthData((prev) => ({ ...prev, [appId]: { loading: false, strength: null, breakdown: {} } }));
    }
  };

  const getStageIndex = (status) => {
    if (!status) return 0;
    const s = status.toLowerCase();
    if (s === 'applied' || s === 'viewed') return 0;
    if (s === 'shortlisted' || s === 'under review') return 1;
    if (s === 'interview') return 2;
    if (s === 'selected' || s === 'accepted') return 3;
    if (s === 'rejected') return -1;
    return 0;
  };

  const getResumeUrl = (app) => {
    const resumeUrl = app.resume || app.resumePath || (app.details && app.details.resumePath);
    if (!resumeUrl) return null;
    return resolveResumeUrl(resumeUrl);
  };

  const filteredApplications = applications?.filter((app) => {
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
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <>
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

        {/* Opportunity Ranking Legend */}
        <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Opportunity Ranking:</span>
          <span className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Priority A</span>
            <span>= highest value</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">Priority B</span>
            <span>= moderate value</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">Priority C</span>
            <span>= lower value</span>
          </span>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-navy/5">
              <thead className="bg-slate-100/90">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Company &amp; Role
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
                      const tierInfo = opportunityRanks[appKey]?.rank
                        ? getPriorityTier(opportunityRanks[appKey].rank)
                        : null;
                      const strengthEntry = strengthData[appKey];

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
                                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                                    {app.role || app.internship?.title || 'Internship Role'}
                                    {tierInfo && (
                                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-bold', tierInfo.className)}>
                                        {tierInfo.label}
                                      </span>
                                    )}
                                  </div>
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

                                  {/* Stage progress bar */}
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

                                  {/* Application Strength — shows pre-computed value or Calculate button */}
                                  <div className="mt-6 border-t border-slate-100 pt-5">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                                        Application Strength
                                      </h4>
                                      {/* Only show button if no pre-computed value and not already fetched */}
                                      {app.applicationStrength === undefined && app.strengthScore === undefined && !strengthEntry && (
                                        <button
                                          type="button"
                                          onClick={() => handleCalculateStrength(appKey)}
                                          className="text-xs px-3 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 font-semibold hover:bg-orange-100 transition-colors"
                                        >
                                          Calculate Strength
                                        </button>
                                      )}
                                    </div>

                                    {/* Pre-computed strength on application document */}
                                    {(app.applicationStrength !== undefined || app.strengthScore !== undefined) && (
                                      <ApplicationStrengthBar
                                        strength={app.applicationStrength ?? app.strengthScore ?? 0}
                                        breakdown={app.strengthBreakdown ?? {}}
                                      />
                                    )}

                                    {/* Fetched via API */}
                                    {strengthEntry?.loading && (
                                      <div className="space-y-2">
                                        <Skeleton className="h-3 w-full rounded" />
                                        <Skeleton className="h-3 w-3/4 rounded" />
                                      </div>
                                    )}
                                    {strengthEntry && !strengthEntry.loading && strengthEntry.strength !== null && (
                                      <ApplicationStrengthBar
                                        strength={strengthEntry.strength}
                                        breakdown={strengthEntry.breakdown}
                                      />
                                    )}
                                    {strengthEntry && !strengthEntry.loading && strengthEntry.strength === null && (
                                      <p className="text-xs text-rose-400">Could not calculate strength. Try again later.</p>
                                    )}

                                    {/* Fallback when nothing available yet */}
                                    {app.applicationStrength === undefined && app.strengthScore === undefined && !strengthEntry && (
                                      <p className="text-xs text-slate-400">
                                        Click &ldquo;Calculate Strength&rdquo; to analyse this application.
                                      </p>
                                    )}
                                  </div>

                                  {/* Action buttons */}
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
                                      <button
                                        type="button"
                                        className="inline-flex items-center gap-2 rounded-lg border-2 border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-800 shadow-sm transition-colors hover:bg-orange-100"
                                        onClick={() => handleGenerateWithAI(app.internship?._id || app.internship)}
                                      >
                                        <Sparkles size={16} className="text-orange-500" />
                                        Generate with AI
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
                        message={searchTerm ? `No results for "${searchTerm}"` : 'Start applying to internships to see them here.'}
                        actionLabel={!searchTerm ? 'Browse Internships' : null}
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
                Showing <span className="font-bold text-slate-900">1</span> to{' '}
                <span className="font-bold text-slate-900">{filteredApplications.length}</span> of{' '}
                <span className="font-bold text-slate-900">{applications?.length || 0}</span> results
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

      {/* AI Generate Cover Letter Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-500" />
                  AI-Generated Cover Letter
                </h3>
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {aiGenerating ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-5/6 rounded" />
                    <Skeleton className="h-4 w-4/6 rounded" />
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <p className="text-sm text-slate-500 text-center pt-2">Generating your cover letter…</p>
                  </div>
                ) : (
                  <>
                    {aiIssues.length > 0 && <TruthGuardAlert issues={aiIssues} onEdit={() => {}} />}
                    <textarea
                      className="w-full h-72 border border-slate-200 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/40 resize-y"
                      value={aiContent}
                      onChange={(e) => setAiContent(e.target.value)}
                      placeholder="Generated cover letter will appear here. You can edit before using."
                    />
                    {!aiContent && (
                      <p className="text-sm text-slate-400 text-center">No content was generated. Please try again.</p>
                    )}
                  </>
                )}
              </div>
              {!aiGenerating && (
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                  {aiContent && (
                    <button
                      onClick={() => navigator.clipboard.writeText(aiContent)}
                      className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Applications;
