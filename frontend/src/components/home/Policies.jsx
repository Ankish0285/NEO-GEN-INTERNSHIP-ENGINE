import React from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionReveal from '../ui/MotionReveal';

const PolicyBlock = ({ id, block }) => {
  const paragraphs = (block.body || '').split(/\n\n+/).filter(Boolean);
  return (
    <section className="policy-section neo-section" id={id} style={{ opacity: 1 }}>
      <div className="neo-container">
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <MotionReveal y={30} delay={0} duration={0.6}>
            <h2 className="neo-h2" style={{ fontSize: '2rem', fontWeight: 'bold' }}>{block.title}</h2>
          </MotionReveal>
          <MotionReveal y={25} delay={0.1} duration={0.55}>
            <p className="neo-lead">{block.subtitle}</p>
          </MotionReveal>
        </div>
        <MotionReveal y={20} delay={0.2} duration={0.55} className="neo-policy-body" style={{ lineHeight: 1.7 }}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </MotionReveal>
      </div>
    </section>
  );
};

const Policies = () => {
  const { settings } = useSiteSettings();
  const { policies } = settings;

  return (
    <>
      <PolicyBlock id="privacy-policy" block={policies.privacy} />
      <PolicyBlock id="terms-of-service" block={policies.terms} />
      <PolicyBlock id="cookie-policy" block={policies.cookies} />
    </>
  );
};

export default Policies;
