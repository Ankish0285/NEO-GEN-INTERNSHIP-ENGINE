import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';
import { DEFAULT_HERO_IMAGE } from '../../utils/defaultSiteSettings';

const Hero = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { branding, hero } = settings;
  const bg =
    resolveStoryImageUrl(hero.backgroundImage) || hero.backgroundImage || DEFAULT_HERO_IMAGE;
  const overlay = hero.overlayOpacity ?? 0.7;

  return (
    <section
      className="hero"
      style={{
        background: `linear-gradient(rgba(0, 0, 0, ${overlay}), rgba(0, 0, 0, ${overlay})), url("${bg}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        padding: '120px 0',
        textAlign: 'left',
      }}
    >
      <div className="container">
        <div className="hero-content" style={{ maxWidth: '600px', margin: '0' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '20px', color: 'white' }}>
            {hero.titleBefore}{' '}
            <span style={{ color: branding.primaryColor }}>{hero.titleHighlight1}</span>{' '}
            <span style={{ color: branding.secondaryColor }}>{hero.titleHighlight2}</span>
          </h1>
          <p className="hero-subtitle" style={{ color: '#e5e7eb', fontSize: '1.25rem', marginBottom: '40px' }}>
            {hero.subtitle}
          </p>
          <div className="hero-actions" style={{ justifyContent: 'flex-start', gap: '20px' }}>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: branding.primaryColor,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => {
                const element = document.getElementById('internships-section');
                if (element) element.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {hero.primaryButtonText}
            </button>
            <button
              type="button"
              className="btn"
              style={{
                backgroundColor: branding.secondaryColor,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                fontSize: '1rem',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/partner/login')}
            >
              {hero.secondaryButtonText}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
