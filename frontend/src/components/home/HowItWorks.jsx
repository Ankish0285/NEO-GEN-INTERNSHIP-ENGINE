import React from 'react';
import { Search, FileText, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionReveal from '../ui/MotionReveal';

const STEP_ICONS = [Search, FileText, Briefcase];
const STEP_COLORS = ['#FF9933', '#138808', '#FF9933'];

const HowItWorks = () => {
  const { settings } = useSiteSettings();
  const { howItWorks } = settings;
  const steps = howItWorks.steps?.length ? howItWorks.steps : [];

  return (
    <section className="neo-section" id="how-it-works" style={{ opacity: 1 }}>
      <div className="neo-container">
        <div className="neo-section-header">
          <MotionReveal y={30} delay={0} duration={0.6}>
            <h2 className="neo-h2">{howItWorks.title}</h2>
          </MotionReveal>
          <MotionReveal y={25} delay={0.1} duration={0.55}>
            <p className="neo-lead">{howItWorks.subtitle}</p>
          </MotionReveal>
        </div>

        <div className="neo-feature-grid">
          {steps.map((step, index) => {
            const Icon = STEP_ICONS[index % STEP_ICONS.length];
            const color = STEP_COLORS[index % STEP_COLORS.length];
            return (
              <motion.div
                key={index}
                className="neo-feature-card neo-glass text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8 }}
              >
                <div
                  className="neo-feature-card__icon mx-auto"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="neo-lead text-base">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
