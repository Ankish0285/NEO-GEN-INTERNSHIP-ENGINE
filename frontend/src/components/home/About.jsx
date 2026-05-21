import React from 'react';
import { Target, BarChart3, Bot, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionSection from '../ui/MotionSection';

const FEATURE_ICONS = [Target, BarChart3, Bot, Globe2];
const FEATURE_COLORS = ['#FF9933', '#138808', '#FF9933', '#138808'];

const About = () => {
  const { settings } = useSiteSettings();
  const { branding, about } = settings;
  const features = about.features?.length ? about.features : [];

  return (
    <MotionSection className="neo-section bg-white/60" id="about-section">
      <div className="neo-container">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="neo-h2 mb-6">
              About{' '}
              <span className="neo-brand-saffron">{about.titleHighlight1}</span>{' '}
              <span className="neo-brand-green">{about.titleHighlight2}</span>
            </h2>
            <p className="neo-lead mb-8">{about.intro}</p>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">{about.missionTitle}</h3>
                <p className="neo-lead">{about.missionText}</p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#111827] mb-2">{about.partnershipsTitle}</h3>
                <p className="neo-lead">{about.partnershipsText}</p>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
              const color = FEATURE_COLORS[index % FEATURE_COLORS.length];
              return (
                <motion.div
                  key={index}
                  className="neo-feature-card neo-glass"
                  whileHover={{ y: -6 }}
                >
                  <div
                    className="neo-feature-card__icon"
                    style={{ background: `${color}18`, color }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827] mb-2">{feature.title}</h3>
                  <p className="neo-lead text-sm">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </MotionSection>
  );
};

export default About;
