import React, { useEffect, useState } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';

const Overview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInternships: 0,
    pendingApplications: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Using the endpoint seen in AdminDashboard.jsx
        const data = await api.get('/dashboard/admin-summary');
        setStats({
          totalUsers: data.totalStudents || 0, // Mapping fields based on typical response
          activeInternships: data.totalInternships || 0,
          pendingApplications: data.activeApplications || 0 // or pendingReviews
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {loading ? '...' : stats.totalUsers}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Active Internships</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {loading ? '...' : stats.activeInternships}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700">Pending Applications</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {loading ? '...' : stats.pendingApplications}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Overview;
