import { useState, useEffect } from 'react';
import { TrendingUp, Award, CheckCircle2, Users, BarChart2 } from 'lucide-react';
import { getCareerInsights } from '../../../services/careerService';
import { api } from '../../../services/api';
import { Skeleton } from '../../ui/Skeleton';
import EmptyState from '../../ui/EmptyState';
import Card from '../../ui/Card';

const STAT_CARDS = [
  {
    key: 'totalCertificates',
    label: 'Total Certificates Issued',
    icon: Award,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    key: 'activeCertificates',
    label: 'Active Certificates',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    key: 'totalCompletions',
    label: 'Total Completions',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    key: 'avgSkillConfidence',
    label: 'Avg Skill Confidence',
    icon: TrendingUp,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    isPercent: true,
  },
];

const CareerIntelligenceInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const data = await getCareerInsights();
        setInsights(data?.data ?? data ?? null);
      } catch (err) {
        console.error('Failed to fetch career insights:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!insights) {
    return (
      <EmptyState
        title="No Insights Available"
        message="Career intelligence data will appear once internships are completed."
      />
    );
  }

  const topSkillGaps = insights.topSkillGaps ?? [];
  const maxGapCount = topSkillGaps.length > 0
    ? Math.max(...topSkillGaps.map((g) => g.count ?? 1))
    : 1;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color, bg, isPercent }) => (
          <div key={key} className="neo-glass p-5 rounded-xl flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
              <Icon size={18} className={color} />
            </div>
            <p className="text-2xl font-bold text-white">
              {insights[key] != null
                ? isPercent
                  ? `${Math.round(Number(insights[key]))}%`
                  : Number(insights[key]).toLocaleString()
                : '—'}
            </p>
            <p className="text-white/60 text-xs leading-snug">{label}</p>
          </div>
        ))}
      </div>

      {/* Top skill gaps */}
      <div className="neo-glass p-5 rounded-xl">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={18} className="text-amber-400" />
          <h3 className="text-white font-semibold">Top 10 Skill Gaps</h3>
        </div>

        {topSkillGaps.length === 0 ? (
          <p className="text-white/50 text-sm">No skill gap data available yet.</p>
        ) : (
          <div className="space-y-3">
            {topSkillGaps.slice(0, 10).map((gap, idx) => {
              const pct = Math.round(((gap.count ?? 0) / maxGapCount) * 100);
              return (
                <div key={gap.skill ?? idx} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 text-sm">{gap.skill ?? `Skill ${idx + 1}`}</span>
                    <span className="text-white/50 text-xs">{gap.count ?? 0} students</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy note */}
      <p className="text-white/40 text-xs text-center">
        Only aggregated data shown — no individual student private data
      </p>
    </div>
  );
};

export default CareerIntelligenceInsights;
