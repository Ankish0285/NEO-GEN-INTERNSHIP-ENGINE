import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import { getAdminAIInsights } from '../../../services/aiService';
import { Brain } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#FF8042', '#FFBB28', '#138808', '#8884d8'];

const EmptyChart = ({ message }) => (
  <div className="h-80 flex items-center justify-center text-gray-500 text-sm text-center px-4">
    {message}
  </div>
);

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get('/admin/analytics');
        setStats(data.data || data);
        try {
          const ai = await getAdminAIInsights();
          setAiInsights(ai.insights);
        } catch {
          setAiInsights(null);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const applicationTrends = stats?.applicationTrends || [];
  const statusDistribution = stats?.statusDistribution || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Application Trends (last 6 months)</h3>
          {loading ? (
            <EmptyChart message="Loading…" />
          ) : applicationTrends.length === 0 ? (
            <EmptyChart message="No applications recorded yet." />
          ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#8884d8" name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Application Status Distribution</h3>
          {loading ? (
            <EmptyChart message="Loading…" />
          ) : statusDistribution.length === 0 ? (
            <EmptyChart message="No application status data yet." />
          ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>
      </div>

      {aiInsights && (
        <Card className="p-6" title="AI Platform Insights" subtitle="Hiring trends and skill demand from NeoGen AI">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Brain className="text-[#FF9933]" size={22} />
            <span className="text-sm text-[#4B5563]">Avg ATS: {aiInsights.averageAtsScore ?? 0}%</span>
            <span className="text-sm text-[#4B5563]">Avg readiness: {aiInsights.averageReadinessScore ?? 0}%</span>
            <span className="text-sm text-[#4B5563]">AI rec events: {aiInsights.aiRecommendationEvents ?? 0}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[#111827] mb-2">Top Student Skills</h4>
              <ul className="space-y-1 text-sm text-[#4B5563]">
                {(aiInsights.topDemandedSkills || []).slice(0, 8).map((s) => (
                  <li key={s.skill}>{s.skill} — {s.count} profiles</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#111827] mb-2">Most Demanded Technologies</h4>
              <ul className="space-y-1 text-sm text-[#4B5563]">
                {(aiInsights.topDemandedTechnologies || []).slice(0, 8).map((t) => (
                  <li key={t.tech}>{t.tech} — {t.count} listings</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#111827] mb-2">Recruiter & Performance</h4>
              <p className="text-sm text-[#4B5563]">Active internships: {aiInsights.hiringTrend?.activeInternships ?? 0}</p>
              <p className="text-sm text-[#4B5563]">Acceptance rate: {aiInsights.hiringTrend?.acceptanceRate ?? 0}%</p>
              <p className="text-sm text-[#4B5563]">Avg employability: {aiInsights.studentPerformance?.avgEmployability ?? 0}%</p>
              <p className="text-sm text-[#4B5563]">Improving profiles: {aiInsights.studentPerformance?.improvingProfiles ?? 0}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Users</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '—' : (stats?.totalUsers ?? 0)}</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Internships</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '—' : (stats?.totalInternships ?? 0)}</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Applications</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '—' : (stats?.totalApplications ?? 0)}</p>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
