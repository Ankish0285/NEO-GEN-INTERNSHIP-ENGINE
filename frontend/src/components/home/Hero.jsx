import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../../utils/resolveStoryImageUrl';
import { DEFAULT_HERO_IMAGE } from '../../utils/defaultSiteSettings';

const Hero = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const canPostInternship = user?.role === 'admin' || user?.role === 'partner';
  const { branding, hero } = settings;
  const bg =
    resolveStoryImageUrl(hero.backgroundImage) || hero.backgroundImage || DEFAULT_HERO_IMAGE;
  const overlay = hero.overlayOpacity ?? 0.72;

  return (
    <section className="neo-hero" id="hero-section">
      <div
        className="neo-hero__bg"
        style={{ backgroundImage: `url("${bg}")` }}
        aria-hidden="true"
      />
      <div
        className="neo-hero__overlay"
        style={{
          background: `linear-gradient(135deg, rgba(17,24,39,${overlay}), rgba(17,24,39,${overlay * 0.65}))`,
        }}
        aria-hidden="true"
      />
      <div className="neo-hero__glow neo-hero__glow--saffron" aria-hidden="true" />
      <div className="neo-hero__glow neo-hero__glow--green" aria-hidden="true" />

      <div className="neo-container">
        <motion.div
          className="neo-hero__content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.95)',
            }}
          >
            <Sparkles size={16} style={{ color: branding.primaryColor || '#FF9933' }} />
            India&apos;s internship platform
          </motion.span>

          <h1 className="neo-hero__title">
            {hero.titleBefore}{' '}
            <span style={{ color: branding.primaryColor || '#FF9933' }}>{hero.titleHighlight1}</span>{' '}
            <span style={{ color: branding.secondaryColor || '#138808' }}>{hero.titleHighlight2}</span>
          </h1>
          <p className="neo-hero__subtitle">{hero.subtitle}</p>

          <div className="neo-hero__actions">
            <button
              type="button"
              className="neo-btn neo-btn-primary"
              onClick={() => {
                const el = document.getElementById('internships-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              {hero.primaryButtonText}
              <ArrowRight size={18} />
            </button>
            {canPostInternship && (
              <button
                type="button"
                className="neo-btn neo-btn-success"
                onClick={() =>
                  navigate(
                    user.role === 'admin'
                      ? '/admin/dashboard/internships'
                      : '/partner/dashboard/post-internship'
                  )
                }
              >
                {hero.secondaryButtonText}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
