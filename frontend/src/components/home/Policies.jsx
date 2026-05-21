import React from 'react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const PolicyBlock = ({ id, block }) => {
  const paragraphs = (block.body || '').split(/\n\n+/).filter(Boolean);
  return (
    <section className="policy-section" id={id} style={{ padding: '60px 0', backgroundColor: id === 'terms-of-service' ? '#f9fafb' : '#fff' }}>
      <div className="container">
        <div className="section-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{block.title}</h2>
          <p style={{ color: '#6b7280' }}>{block.subtitle}</p>
        </div>
        <div style={{ color: '#4b5563', lineHeight: 1.7 }}>
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
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
