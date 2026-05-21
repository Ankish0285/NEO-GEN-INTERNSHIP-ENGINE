import React, { useEffect, useState } from 'react';
import { Users, Briefcase, FileText } from 'lucide-react';
import { api } from '../../../services/api';

const Overview = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInternships: 0,
    pendingApplications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get('/dashboard/admin-summary');
        setStats({
          totalUsers: data.totalStudents || 0,
          activeInternships: data.totalInternships || 0,
          pendingApplications: data.totalApplications || 0,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      label: 'Total Students',
      value: stats.totalUsers,
      icon: Users,
      tone: 'saffron',
    },
    {
      label: 'Active Internships',
      value: stats.activeInternships,
      icon: Briefcase,
      tone: 'green',
    },
    {
      label: 'Total Applications',
      value: stats.pendingApplications,
      icon: FileText,
      tone: 'navy',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="neo-page-header mb-6">
        <h1>Super Admin Overview</h1>
        <p>Platform-wide statistics and management at a glance.</p>
      </div>

      <div className="neo-dash-stat-grid">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`neo-dash-stat neo-glass admin-stat-card admin-stat-card--${tone}`}>
            <div className="admin-stat-card__icon">
              <Icon size={24} />
            </div>
            <p className="admin-stat-card__label">{label}</p>
            <p className="admin-stat-card__value">{loading ? '—' : value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Overview;
