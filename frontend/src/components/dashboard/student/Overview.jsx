import React, { useMemo } from 'react';
import {
  Briefcase, FileText, UserCheck, CheckCircle, TrendingUp, ArrowRight,
  Clock, Award, Zap, MapPin, ChevronRight, Target, Sparkles,
  BookOpen, CircleDollarSign, Building2, Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '../../ui/Skeleton';
import { useNavigate } from 'react-router-dom';
import { useStudentDashboard } from '../../../context/StudentDashboardContext';

// ─── Animation presets ────────────────────────────────────────────────────────
const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });
};

const statusStyle = {
  Applied:     'bg-blue-50    text-blue-700   border-blue-100',
  Shortlisted: 'bg-indigo-50  text-indigo-700 border-indigo-100',
  Interview:   'bg-amber-50   text-amber-700  border-amber-100',
  Selected:    'bg-emerald-50 text-emerald-700 border-emerald-100',
  Rejected:    'bg-red-50     text-red-600    border-red-100',
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, accentColor, barValue, loading }) => (
  <motion.div variants={fade}
    className="relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden p-5 flex flex-col gap-3"
  >
    {/* Faint background decoration */}
    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-5"
      style={{ background: accentColor }} />

    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</span>
        {loading
          ? <Skeleton className="h-9 w-20 mt-1" />
          : <span className="text-3xl font-black text-gray-900 leading-none">{value}</span>}
      </div>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accentColor}18` }}>
        <Icon size={22} style={{ color: accentColor }} />
      </div>
    </div>

    {loading ? <Skeleton className="h-3 w-28" /> : (
      <>
        {barValue != null && (
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: accentColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, barValue)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
        <span className="text-xs text-gray-500 font-medium">{sub}</span>
      </>
    )}
  </motion.div>
);

// ─── ApplicationRow ───────────────────────────────────────────────────────────
const ApplicationRow = ({ app, onNavigate }) => {
  const initial = (app.internship?.organization || 'Co').substring(0, 2).toUpperCase();
  const s = app.status || 'Applied';
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-orange-50/40 px-1 -mx-1 rounded-xl transition-colors duration-150 cursor-pointer group"
      onClick={() => onNavigate('applications')}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-emerald-100 flex items-center justify-center text-gray-700 font-black text-sm flex-shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{app.internship?.title || 'Internship'}</p>
        <p className="text-xs text-gray-400 truncate">{app.internship?.organization || 'Organization'} · {formatTimeAgo(app.createdAt)}</p>
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex-shrink-0 ${statusStyle[s] || statusStyle.Applied}`}>
        {s}
      </span>
      <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors flex-shrink-0" />
    </div>
  );
};

// ─── RecommendationCard ───────────────────────────────────────────────────────
const RecommendationCard = ({ job, onNavigate }) => (
  <motion.div variants={fade}
    whileHover={{ y: -3 }}
    onClick={() => onNavigate('find-internship')}
    className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-orange-100 transition-all duration-200"
  >
    <div className="flex items-start justify-between mb-3">
      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
        <Building2 size={18} className="text-orange-500" />
      </div>
      {job.matchScore != null && (
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
          {Math.round(job.matchScore)}% match
        </span>
      )}
    </div>
    <h4 className="text-sm font-bold text-gray-900 line-clamp-1 mb-0.5">{job.title}</h4>
    <p className="text-xs text-gray-500 mb-2 line-clamp-1">{job.company || job.organization}</p>
    <div className="flex flex-wrap gap-2 text-xs text-gray-400">
      {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
      {job.stipend && <span className="flex items-center gap-1"><CircleDollarSign size={11} />{job.stipend}</span>}
    </div>
  </motion.div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, heading, sub, action, onAction }) => (
  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
    <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
      <Icon size={26} className="text-orange-400" />
    </div>
    <p className="font-semibold text-gray-700 mb-1">{heading}</p>
    <p className="text-sm text-gray-400 mb-4 max-w-xs">{sub}</p>
    {action && (
      <button onClick={onAction}
        className="text-sm font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
        {action} <ArrowRight size={14} />
      </button>
    )}
  </div>
);

// ─── ProfileStrengthCard ──────────────────────────────────────────────────────
const ProfileStrengthCard = ({ pct, profileData, onNavigate }) => {
  const r  = 48;
  const circ = 2 * Math.PI * r; // 301.6
  const offset = circ * (1 - pct / 100);

  const status = pct >= 90 ? 'Excellent' : pct >= 70 ? 'Good' : pct >= 50 ? 'Fair' : 'Needs work';
  const statusColor = pct >= 90 ? 'text-emerald-600' : pct >= 70 ? 'text-orange-500' : 'text-amber-500';

  // Missing items derived from real profileData
  const missing = useMemo(() => {
    const items = [];
    if (!profileData?.phone)          items.push('Phone number');
    if (!profileData?.university)     items.push('University');
    if (!profileData?.course)         items.push('Course / degree');
    if (!(profileData?.skills?.length)) items.push('Skills');
    return items.slice(0, 3);
  }, [profileData]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Profile Strength</h3>
        <button onClick={() => onNavigate('profile')}
          className="text-xs text-orange-500 font-semibold hover:text-orange-600 transition-colors">
          Complete →
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width="112" height="112" viewBox="0 0 112 112">
            <circle cx="56" cy="56" r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
            <motion.circle
              cx="56" cy="56" r={r}
              fill="none"
              stroke={pct >= 70 ? '#138808' : '#FF9933'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{ transformOrigin: '56px 56px', transform: 'rotate(-90deg)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">{pct}%</span>
            <span className={`text-[10px] font-bold ${statusColor}`}>{status}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {missing.length > 0 ? (
            <>
              <p className="text-xs text-gray-500 mb-2 font-medium">Still missing:</p>
              <ul className="space-y-1.5">
                {missing.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col gap-1">
              <CheckCircle size={20} className="text-emerald-500" />
              <p className="text-sm font-bold text-gray-800">Profile complete!</p>
              <p className="text-xs text-gray-400">Great visibility to recruiters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── ProTipCard ───────────────────────────────────────────────────────────────
const ProTipCard = ({ profileData, atsScore, onNavigate }) => {
  const tip = useMemo(() => {
    if (!atsScore || atsScore === 0)
      return { text: 'Upload your resume to get an instant ATS score and keyword analysis.', cta: 'Upload Resume', path: 'ats-resume' };
    if (atsScore < 60)
      return { text: 'Your ATS score needs improvement. Add relevant keywords from job descriptions.', cta: 'Improve ATS', path: 'ats-resume' };
    if (!profileData?.university)
      return { text: 'Add your university to increase profile visibility with government recruiters.', cta: 'Add Details', path: 'profile' };
    return { text: 'Use AI Intelligence to discover internships matched to your exact skills and experience level.', cta: 'Open AI Hub', path: 'ai-intelligence' };
  }, [atsScore, profileData]);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
      <div className="p-5 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-orange-500/10" />
        <div className="absolute -right-2 -top-2 w-16 h-16 rounded-full bg-emerald-500/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Zap size={14} className="text-orange-400" />
            </div>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Pro Tip</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{tip.text}</p>
          <button
            onClick={() => onNavigate(tip.path)}
            className="text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {tip.cta} <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────
const Overview = () => {
  const { dashboardData, profileData, applications, loading, atsScoreData } = useStudentDashboard();
  const navigate = useNavigate();

  const onNavigate = (path) => {
    if (path === 'find-internship') navigate('/find-internship');
    else navigate(`/dashboard/${path}`);
  };

  const recentApps = [...(applications || [])]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const recommendations = dashboardData?.recommendedInternships || [];
  const pct   = profileData?.profileCompletionPercentage || 0;
  const ats   = dashboardData?.atsScore || atsScoreData?.score || 0;
  const total = dashboardData?.totalApplications || 0;
  const pending = dashboardData?.pendingReviews ?? 0;
  const interviews = applications?.filter(a =>
    ['Shortlisted','Interview','Selected'].includes(a.status)
  ).length ?? 0;

  return (
    <motion.div
      variants={stagger} initial="hidden" animate="visible"
      className="space-y-6 max-w-[1240px] mx-auto pb-10"
    >

      {/* ── Welcome hero ─────────────────────────────────────────────────── */}
      <motion.div variants={fade}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 min-w-0">
          {profileData?.profilePicture ? (
            <img src={profileData.profilePicture} alt="avatar"
              className="w-12 h-12 rounded-xl object-cover border-2 border-orange-100 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-emerald-100 flex items-center justify-center text-orange-600 font-black text-lg flex-shrink-0">
              {(profileData?.name || 'S').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-black text-gray-900 truncate">
              Welcome back, {profileData?.name?.split(' ')[0] || 'Student'} 👋
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {pct < 100
                ? `Profile ${pct}% complete · Add more details to unlock better matches`
                : 'Your profile is complete · Keep applying to unlock opportunities'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => onNavigate('ats-resume')}
            className="text-sm font-semibold text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600 px-4 py-2 rounded-xl transition-colors">
            ATS Resume
          </button>
          <button onClick={() => onNavigate('profile')}
            className="text-sm font-bold text-white px-4 py-2 rounded-xl transition-colors"
            style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}>
            Update Profile
          </button>
        </div>
      </motion.div>

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Applications"
          value={loading ? '—' : total}
          sub={`${pending} pending review`}
          icon={Briefcase}
          accentColor="#138808"
          loading={loading}
        />
        <StatCard
          title="ATS Score"
          value={loading ? '—' : (ats > 0 ? `${Math.round(ats)}` : '—')}
          sub={ats >= 80 ? 'Excellent · Top 20%' : ats >= 60 ? 'Good · Keep improving' : ats > 0 ? 'Needs improvement' : 'Upload resume to score'}
          icon={FileText}
          accentColor="#FF9933"
          barValue={ats}
          loading={loading}
        />
        <StatCard
          title="Profile"
          value={loading ? '—' : `${pct}%`}
          sub={pct === 100 ? 'Complete ✓' : `${100 - pct}% remaining`}
          icon={UserCheck}
          accentColor="#3b82f6"
          barValue={pct}
          loading={loading}
        />
        <StatCard
          title="Shortlisted"
          value={loading ? '—' : interviews}
          sub={interviews > 0 ? 'Active applications' : 'No interviews yet'}
          icon={CheckCircle}
          accentColor="#0d9488"
          loading={loading}
        />
      </div>

      {/* ── Main content grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: Applications + Recommendations ─────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Application Activity */}
          <motion.div variants={fade}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Application Activity</h3>
                <p className="text-xs text-gray-400 mt-0.5">Your recent applications and status</p>
              </div>
              <button onClick={() => onNavigate('applications')}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={13} />
              </button>
            </div>
            <div className="px-4 py-1">
              {loading ? (
                <div className="space-y-3 py-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
                </div>
              ) : recentApps.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  heading="No applications yet"
                  sub="Explore internships matched to your profile and start applying."
                  action="Browse Internships"
                  onAction={() => onNavigate('find-internship')}
                />
              ) : (
                recentApps.map(app => (
                  <ApplicationRow key={app._id} app={app} onNavigate={onNavigate} />
                ))
              )}
            </div>
          </motion.div>

          {/* Recommended for You */}
          <motion.div variants={fade}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles size={14} className="text-orange-400" />
                  Recommended for You
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">AI-matched to your skills and profile</p>
              </div>
              <button onClick={() => onNavigate('recommendations')}
                className="text-xs font-semibold text-orange-500 hover:text-orange-600 flex items-center gap-1 transition-colors">
                See all <ArrowRight size={13} />
              </button>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1,2].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
                </div>
              ) : recommendations.length === 0 ? (
                <EmptyState
                  icon={Target}
                  heading="No recommendations yet"
                  sub="Complete your profile and upload a resume to unlock AI-matched internships."
                  action="Complete Profile"
                  onAction={() => onNavigate('profile')}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {recommendations.slice(0, 4).map((job, i) => (
                    <RecommendationCard key={job.id || job._id || i} job={job} onNavigate={onNavigate} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* ── Right: Profile strength + Pro Tip + Quick links ──────────── */}
        <motion.div variants={fade} className="space-y-5">

          <ProfileStrengthCard pct={pct} profileData={profileData} onNavigate={onNavigate} />

          <ProTipCard profileData={profileData} atsScore={ats} onNavigate={onNavigate} />

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</p>
            <div className="space-y-1">
              {[
                { label: 'Upload / Refresh Resume', icon: FileText,  path: 'ats-resume',       color: '#FF9933' },
                { label: 'AI Intelligence Hub',     icon: Sparkles,   path: 'ai-intelligence', color: '#8b5cf6' },
                { label: 'Browse Internships',      icon: BookOpen,   path: 'find-internship', color: '#138808' },
                { label: 'View Applications',       icon: Calendar,   path: 'applications',    color: '#3b82f6' },
              ].map(({ label, icon: I, path, color }) => (
                <button key={path}
                  onClick={() => onNavigate(path)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <I size={14} style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{label}</span>
                  <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Overview;
