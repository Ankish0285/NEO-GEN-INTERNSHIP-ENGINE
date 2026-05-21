import React from 'react';
import { Briefcase, Users, MapPin, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import MotionSection from '../ui/MotionSection';
import AnimatedCounter from '../ui/AnimatedCounter';

const STATS = [
  { icon: Briefcase, color: '#FF9933', value: '100000', suffix: '+', label: 'Active Opportunities', display: '1,00,000+' },
  { icon: Users, color: '#138808', value: '50000', suffix: '+', label: 'Students Placed', display: '50,000+' },
  { icon: MapPin, color: '#FF9933', value: '730', suffix: '', label: 'Districts Covered', display: '730' },
  { icon: CheckCircle, color: '#138808', value: '95', suffix: '%', label: 'Success Rate', display: '95%' },
];

const Stats = () => (
  <MotionSection className="neo-section" id="stats-section">
    <div className="neo-container">
      <div className="neo-stats-grid">
        {STATS.map((stat, index) => {
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

export default Stats;
