import React from 'react';
import { Search, FileText, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionSection from '../ui/MotionSection';

const STEP_ICONS = [Search, FileText, Briefcase];
const STEP_COLORS = ['#FF9933', '#138808', '#FF9933'];

const HowItWorks = () => {
  const { settings } = useSiteSettings();
  const { howItWorks } = settings;
  const steps = howItWorks.steps?.length ? howItWorks.steps : [];

  return (
    <MotionSection className="neo-section" id="how-it-works">
      <div className="neo-container">
        <div className="neo-section-header">
          <h2 className="neo-h2">{howItWorks.title}</h2>
          <p className="neo-lead">{howItWorks.subtitle}</p>
        </div>

        <div className="neo-feature-grid">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index % STEP_ICONS.length];
            const color = STEP_COLORS[index % STEP_COLORS.length];
            return (
              <motion.div
                key={index}
                className="neo-feature-card neo-glass text-center"
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div
                  className="neo-feature-card__icon mx-auto"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">{step.title}</h3>
                <p className="neo-lead text-base">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MotionSection>
  );
};

export default HowItWorks;
