import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Target, TrendingUp, AlertTriangle, Sparkles, RefreshCw, Zap,
  GraduationCap, Route, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';
import {
  getAIIntelligence, getAIProfile, analyzeResumeAI, getAIRecommendations,
} from '../../services/aiService';
import { useStudentDashboard } from '../../context/StudentDashboardContext';
import AIChatAssistant from './AIChatAssistant';

const TABS = [
  { id: 'best', label: 'Best Match' },
  { id: 'highest', label: 'Highest Match' },
  { id: 'easiest', label: 'Easiest Selection' },
  { id: 'skill', label: 'Skill-Based' },
];

const AIIntelligenceHub = () => {
  const { atsScoreData, refreshDashboard, refreshAtsScore } = useStudentDashboard();
  const [profile, setProfile] = useState(null);
  const [intel, setIntel] = useState(null);
  const [groups, setGroups] = useState({});
  const [recTab, setRecTab] = useState('best');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const profRes = await getAIProfile();
      setProfile(profRes.profile);
      try {
        const intRes = await getAIIntelligence();
        setIntel(intRes.data);
        setGroups(intRes.data?.groups || {});
      } catch {
        const recRes = await getAIRecommendations(8);
        setGroups(recRes.groups || {});
        setIntel({ recommendations: recRes.recommendations });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener('ai:refresh', onRefresh);
    return () => window.removeEventListener('ai:refresh', onRefresh);
  }, [load]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      await analyzeResumeAI();
      toast.success('AI analysis complete');
      await refreshAtsScore?.();
      await load();
      refreshDashboard?.();
    } catch (e) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const ats = intel?.ats || profile?.rawAnalysis?.ats || {};
  const sectionDetail = ats.section_wise_scores || {};
  const radarData = Object.keys(sectionDetail).length
    ? Object.entries(sectionDetail).map(([k, v]) => ({
        subject: v.label || k,
        value: v.score || 0,
      }))
    : [
        { subject: 'Technical', value: ats.breakdown?.technical || 0 },
        { subject: 'Experience', value: ats.breakdown?.experience || 0 },
        { subject: 'Education', value: ats.breakdown?.education || 0 },
        { subject: 'Format', value: ats.breakdown?.formatting || 0 },
      ];

  const barSections = Object.entries(sectionDetail).map(([k, v]) => ({
    name: (v.label || k).slice(0, 12),
    score: v.score || 0,
  }));

  const atsScore = profile?.latestAtsScore || ats.ats_score || atsScoreData?.score || 0;
  const employability = profile?.employabilityScore || intel?.profile?.employability_score || 0;
  const readiness = profile?.internshipReadinessScore || intel?.profile?.internship_readiness_score || 0;

  const tabRecs = {
    best: groups.bestMatch,
    highest: groups.highestMatch,
    easiest: groups.easiestSelection,
    skill: groups.skillBased,
  }[recTab] || intel?.recommendations || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="neo-skeleton h-32 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="neo-skeleton h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="neo-h2 flex items-center gap-2">
            <Brain className="text-[#FF9933]" />
            AI Intelligence Hub
          </h1>
          <p className="neo-lead mt-1">
            Real-time ATS, career prediction, selection probability, and semantic matching.
          </p>
        </div>
        <button
          type="button"
          className="neo-btn neo-btn-primary"
          onClick={runAnalysis}
          disabled={analyzing}
        >
          <RefreshCw size={18} className={analyzing ? 'animate-spin' : ''} />
          {analyzing ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'ATS Score', value: `${Math.round(atsScore)}%`, icon: Target, color: '#FF9933' },
          { label: 'Employability', value: `${Math.round(employability)}%`, icon: TrendingUp, color: '#138808' },
          { label: 'Readiness', value: `${Math.round(readiness)}%`, icon: GraduationCap, color: '#138808' },
          { label: 'AI Confidence', value: `${profile?.aiConfidenceScore || ats.ai_confidence_score || 75}%`, icon: Zap, color: '#FF9933' },
          {
            label: 'Career Domain',
            value: profile?.careerDomain?.label || intel?.profile?.career_domain?.label || 'Analyzing...',
            icon: Sparkles,
            color: '#138808',
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="neo-dash-stat neo-glass p-5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <stat.icon size={22} style={{ color: stat.color }} />
            <p className="text-sm text-[#4B5563] mt-2">{stat.label}</p>
            <p className="text-xl font-extrabold text-[#111827] mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {profile?.profileSummary && (
        <motion.div
          className="neo-glass p-5 border-l-4 border-[#FF9933]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-sm text-[#4B5563]">{profile.profileSummary}</p>
        </motion.div>
      )}

      {(ats.why_score_is_low?.length > 0) && (
        <div className="neo-glass p-5">
          <h3 className="font-bold text-[#111827] flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-[#FF9933]" />
            Why your ATS score may be low
          </h3>
          <ul className="text-sm text-[#4B5563] space-y-1">
            {ats.why_score_is_low.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neo-glass p-6">
          <h3 className="font-bold text-[#111827] mb-4">Advanced Section Scores</h3>
          {barSections.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barSections}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {barSections.map((_, i) => (
                    <Cell key={i} fill={i % 2 ? '#138808' : '#FF9933'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar dataKey="value" stroke="#FF9933" fill="#FF9933" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="neo-glass p-6">
          <h3 className="font-bold text-[#111827] mb-4 flex items-center gap-2">
            <Route size={18} className="text-[#138808]" />
            Career Roadmap
          </h3>
          <p className="text-sm text-[#4B5563] mb-3">
            Future tech: {(profile?.futureTechnologies || intel?.profile?.future_technologies || []).join(', ') || '—'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-[#138808] mb-2">Strengths</p>
              <ul className="space-y-1 text-sm text-[#4B5563]">
                {(profile?.strengths || []).map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-[#FF9933] mb-2">Gaps</p>
              <ul className="space-y-1 text-sm text-[#4B5563]">
                {(profile?.weaknesses || []).map((w, i) => (
                  <li key={i}>• {w}</li>
                ))}
              </ul>
            </div>
          </div>
          {profile?.learningRoadmap?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/5">
              <p className="text-xs font-semibold uppercase text-[#111827] mb-2">Learning Roadmap</p>
              {profile.learningRoadmap.slice(0, 5).map((item, i) => (
                <p key={i} className="text-sm text-[#4B5563] mb-1">
                  <span className="font-medium text-[#FF9933]">{item.skill}</span> — {item.course}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="neo-glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-[#111827] flex items-center gap-2">
            <BarChart3 size={18} className="text-[#FF9933]" />
            AI Internship Recommendations
          </h3>
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setRecTab(t.id)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                  recTab === t.id
                    ? 'bg-[#FF9933] text-white'
                    : 'bg-white/60 text-[#4B5563] border border-black/5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {tabRecs.length === 0 ? (
          <p className="neo-lead">Upload your resume to unlock personalized internship matches.</p>
        ) : (
          <div className="space-y-4">
            {tabRecs.map((job, i) => (
              <motion.div
                key={job.id || i}
                className="p-4 rounded-2xl border border-black/5 bg-white/50"
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-bold text-[#111827]">{job.title}</h4>
                    <p className="text-sm text-[#4B5563]">{job.company} · {job.location}</p>
                    <p className="text-xs text-[#6B7280] mt-2 line-clamp-2">{job.aiExplanation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-extrabold text-[#FF9933]">
                      {job.matchScore ?? job.match_percentage}%
                    </span>
                    <p className="text-[10px] text-[#4B5563]">match</p>
                    {(job.selectionProbability ?? job.selection_probability) != null && (
                      <p className="text-[10px] text-[#138808] mt-1">
                        {job.selectionProbability ?? job.selection_probability}% selection
                      </p>
                    )}
                    {job.aiCompatibilityScore != null && (
                      <p className="text-[10px] text-[#6B7280]">
                        AI compat {job.aiCompatibilityScore}%
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AIChatAssistant />
    </div>
  );
};

export default AIIntelligenceHub;
