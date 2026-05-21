import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/partner-summary')
      .then(setSummary)
      .catch((err) => {
        console.error('Partner analytics error:', err);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: 'Active Internships',
      value: summary?.activeInternships ?? 0,
      hint: `${summary?.totalInternships ?? 0} total posted`,
    },
    {
      label: 'Total Applications',
      value: summary?.totalApplications ?? 0,
      hint: `${summary?.pendingApplications ?? 0} pending review`,
    },
    {
      label: 'Pending Reviews',
      value: summary?.pendingApplications ?? 0,
      hint: 'Awaiting your decision',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Partner Analytics</h1>
      <p className="text-gray-600 text-sm">
        Live counts from your internships and applications. Detailed daily charts will appear as more data is collected.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, hint }) => (
          <Card key={label} className="p-6">
            <h4 className="text-sm font-medium text-gray-500">{label}</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Application trends</h3>
        <p className="text-sm text-gray-500">
          {loading
            ? 'Loading…'
            : (summary?.totalApplications ?? 0) === 0
              ? 'No applications received yet. Post an internship to start tracking.'
              : `You have received ${summary.totalApplications} application(s) across your listings.`}
        </p>
      </Card>
    </div>
  );
};

export default Analytics;
