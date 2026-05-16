import React, { useState, useEffect } from 'react';
import Card from '../../ui/Card';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Mock data - in real app, fetch from backend
  const viewsData = [
    { name: 'Mon', views: 12 },
    { name: 'Tue', views: 19 },
    { name: 'Wed', views: 15 },
    { name: 'Thu', views: 22 },
    { name: 'Fri', views: 30 },
    { name: 'Sat', views: 10 },
    { name: 'Sun', views: 8 },
  ];

  const applicationsData = [
    { name: 'Mon', applications: 2 },
    { name: 'Tue', applications: 5 },
    { name: 'Wed', applications: 3 },
    { name: 'Thu', applications: 8 },
    { name: 'Fri', applications: 12 },
    { name: 'Sat', applications: 4 },
    { name: 'Sun', applications: 1 },
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Partner Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Internship Views (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={viewsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" fill="#82ca9d" name="Views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Applications Received (Last 7 Days)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={applicationsData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="applications" fill="#8884d8" name="Applications" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Views</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">1,234</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last week</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Total Applications</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">56</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% from last week</p>
        </Card>
        <Card className="p-6">
            <h4 className="text-sm font-medium text-gray-500">Avg. Response Time</h4>
            <p className="text-2xl font-bold text-gray-900 mt-2">2 Days</p>
            <p className="text-xs text-gray-500 mt-1">Keep it under 3 days</p>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
