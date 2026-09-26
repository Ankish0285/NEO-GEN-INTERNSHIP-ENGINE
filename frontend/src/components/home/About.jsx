import React from 'react';
import { Target, BarChart3, Bot, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionReveal from '../ui/MotionReveal';

const FEATURE_ICONS = [Target, BarChart3, Bot, Globe2];
const FEATURE_COLORS = ['#FF9933', '#138808', '#FF9933', '#138808'];

const About = () => {
  const { settings } = useSiteSettings();
  const { branding, about } = settings;
  const features = about.features?.length ? about.features : [];

  return (
    <section
      id="about-section"
      className="neo-section neo-about-section"
      style={{
        opacity: 1,
      }}
    >
      <div className="neo-container">
        <div className="neo-about-copy">
          <MotionReveal y={30} delay={0} duration={0.6}>
            <h2 className="neo-h2 mb-6">
              About{' '}
              <span className="neo-brand-saffron">{about.titleHighlight1}</span>{' '}
              <span className="neo-brand-green">{about.titleHighlight2}</span>
            </h2>
          </MotionReveal>

          <MotionReveal y={25} delay={0.1} duration={0.55}>
            <p className="neo-lead mb-8">{about.intro}</p>
          </MotionReveal>

          <div className="neo-about-details">
            <div>
              <MotionReveal y={25} delay={0.15} duration={0.55}>
                <h3 className="text-xl font-bold neo-about-subtitle mb-2">
                  {about.missionTitle}
                </h3>
              </MotionReveal>
              <MotionReveal y={20} delay={0.22} duration={0.5}>
                <p className="neo-lead">{about.missionText}</p>
              </MotionReveal>
            </div>
            <div>
              <MotionReveal y={25} delay={0.3} duration={0.55}>
                <h3 className="text-xl font-bold neo-about-subtitle mb-2">
                  {about.partnershipsTitle}
                </h3>
              </MotionReveal>
              <MotionReveal y={20} delay={0.37} duration={0.5}>
                <p className="neo-lead">{about.partnershipsText}</p>
              </MotionReveal>
            </div>
          </div>
        </div>

        <div className="neo-about-features">
          {features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index % FEATURE_ICONS.length];
            const color = FEATURE_COLORS[index % FEATURE_COLORS.length];
            const baseDelay = 0.45;
            return (
              <motion.div
                key={index}
                className="neo-feature-card neo-glass neo-about-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{
                  delay: baseDelay + index * 0.1,
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
              >
                <div
                  className="neo-feature-card__icon"
                  style={{ background: `${color}18`, color }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-bold neo-about-card-title mb-2">
                  {feature.title}
                </h3>
                <p className="neo-lead text-sm">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;
