import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import { getPartnerIntelligence } from '../../../services/careerService';
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
  const [intel, setIntel] = useState(null);
  const [intelLoading, setIntelLoading] = useState(true);

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

  useEffect(() => {
    getPartnerIntelligence()
      .then((res) => setIntel(res?.data?.data ?? res?.data ?? null))
      .catch((err) => {
        console.error('Partner intelligence error:', err);
        setIntel(null);
      })
      .finally(() => setIntelLoading(false));
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

      {/* Intelligence Section */}
      <h2 className="text-xl font-bold text-gray-800 pt-2">Intelligence</h2>
      <p className="text-gray-500 text-sm -mt-4">
        Detailed funnel, completion, certificate, and feedback data for your programme.
      </p>

      {intelLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Card key={n} className="p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
                <div className="h-3 bg-gray-100 rounded w-3/5" />
              </div>
            </Card>
          ))}
        </div>
      ) : !intel ? (
        <Card className="p-6">
          <p className="text-gray-500 text-sm">Intelligence data unavailable.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Application Funnel */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Application Funnel</h3>
            <p className="text-xs text-gray-400 mb-3">
              Total internships: <span className="font-semibold text-gray-600">{intel.totalInternships ?? 0}</span>
            </p>
            {Array.isArray(intel.applicationFunnel) && intel.applicationFunnel.length > 0 ? (
              <div className="space-y-1">
                {intel.applicationFunnel.map((item, idx) => (
                  <div key={item._id ?? idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id ?? 'Unknown'}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.count ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No application data yet.</p>
            )}
          </Card>

          {/* Completion Stats */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Completion Status</h3>
            {Array.isArray(intel.completionStats) && intel.completionStats.length > 0 ? (
              <div className="space-y-1">
                {intel.completionStats.map((item, idx) => (
                  <div key={item._id ?? idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id ?? 'Unknown'}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.count ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No completion data yet.</p>
            )}
          </Card>

          {/* Certificate Stats */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Certificate Stats</h3>
            {Array.isArray(intel.certificateStats) && intel.certificateStats.length > 0 ? (
              <div className="space-y-1">
                {intel.certificateStats.map((item, idx) => (
                  <div key={item._id ?? idx} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-600 capitalize">{item._id ?? 'Unknown'}</span>
                    <span className="text-sm font-semibold text-gray-800">{item.count ?? 0}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No certificate data yet.</p>
            )}
          </Card>

          {/* Feedback Averages */}
          <Card className="p-6">
            <h3 className="text-base font-semibold text-gray-700 mb-3">Feedback Averages</h3>
            {intel.feedbackSummary ? (
              <div className="space-y-1">
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Technical Skills</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {intel.feedbackSummary.avgTechnical != null
                      ? intel.feedbackSummary.avgTechnical.toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Communication</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {intel.feedbackSummary.avgCommunication != null
                      ? intel.feedbackSummary.avgCommunication.toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Overall Rating</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {intel.feedbackSummary.avgOverall != null
                      ? intel.feedbackSummary.avgOverall.toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600">Total Responses</span>
                  <span className="text-sm font-semibold text-gray-800">{intel.feedbackSummary.count ?? 0}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No feedback data yet.</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default Analytics;
