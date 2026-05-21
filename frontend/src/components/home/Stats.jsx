import React, { useEffect, useState } from 'react';
import { Briefcase, Users, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import MotionSection from '../ui/MotionSection';
import AnimatedCounter from '../ui/AnimatedCounter';
import { api } from '../../services/api';

const formatCount = (n) => (Number(n) || 0).toLocaleString('en-IN');

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/public-stats')
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const items = [
    {
      icon: Briefcase,
      color: '#FF9933',
      label: 'Active Opportunities',
      display: loading ? '—' : formatCount(stats?.activeOpportunities ?? 0),
    },
    {
      icon: Users,
      color: '#138808',
      label: 'Students Registered',
      display: loading ? '—' : formatCount(stats?.studentsRegistered ?? 0),
    },
    {
      icon: MapPin,
      color: '#FF9933',
      label: 'Locations Listed',
      display: loading ? '—' : formatCount(stats?.districtsCovered ?? 0),
    },
    {
      icon: CheckCircle,
      color: '#138808',
      label: 'Placement Success Rate',
      display: loading ? '—' : `${stats?.successRate ?? 0}%`,
    },
  ];

  return (
    <MotionSection className="neo-section" id="stats-section">
      <div className="neo-container">
        <div className="neo-stats-grid">
          {items.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                className="neo-stat-card neo-glass"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
              >
                <div
                  className="neo-feature-card__icon mx-auto"
                  style={{ background: `${stat.color}18`, color: stat.color }}
                >
                  <Icon size={28} />
                </div>
                <div className="neo-stat-card__value">
                  <AnimatedCounter value={stat.display} />
                </div>
                <div className="neo-stat-card__label">{stat.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
};

export default Stats;
