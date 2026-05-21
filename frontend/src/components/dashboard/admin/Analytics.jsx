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

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data for charts if API data is limited
  const applicationData = [
    { name: 'Jan', applications: 40 },
    { name: 'Feb', applications: 30 },
    { name: 'Mar', applications: 20 },
    { name: 'Apr', applications: 27 },
    { name: 'May', applications: 18 },
    { name: 'Jun', applications: 23 },
    { name: 'Jul', applications: 34 },
  ];

  const statusData = [
    { name: 'Accepted', value: 400 },
    { name: 'Rejected', value: 300 },
    { name: 'Pending', value: 300 },
  ];

  const COLORS = ['#0088FE', '#FF8042', '#FFBB28'];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get('/admin/analytics');
        setStats(data.data);
        try {
          const ai = await getAdminAIInsights();
          setAiInsights(ai.insights);
        } catch {
          setAiInsights(null);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">System Analytics</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Application Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={applicationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Application Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {aiInsights && (
        <Card className="p-6" title="AI Platform Insights" subtitle="Hiring trends and skill demand from NeoGen AI">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-[#FF9933]" size={22} />
            <span className="text-sm text-[#4B5563]">Average student ATS: {aiInsights.averageAtsScore}%</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-[#111827] mb-2">Top Demanded Skills</h4>
              <ul className="space-y-1 text-sm text-[#4B5563]">
                {(aiInsights.topDemandedSkills || []).slice(0, 8).map((s) => (
                  <li key={s.skill}>{s.skill} — {s.count} profiles</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#111827] mb-2">Hiring Trend</h4>
              <p className="text-sm text-[#4B5563]">Active internships: {aiInsights.hiringTrend?.activeInternships}</p>
              <p className="text-sm text-[#4B5563]">Acceptance rate: {aiInsights.hiringTrend?.acceptanceRate}%</p>
              <p className="text-sm text-[#4B5563] mt-2">AI profiles analyzed: {aiInsights.totalAIProfiles}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Users</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalUsers || 0}</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Internships</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalInternships || 0}</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Applications</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{stats?.totalApplications || 0}</p>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
