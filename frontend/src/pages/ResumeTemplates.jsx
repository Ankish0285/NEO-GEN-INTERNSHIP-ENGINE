/**
 * ResumeTemplates — /resources/resume-templates
 *
 * Gallery page: loads template list from /api/resume-templates (live backend config)
 * so admin FREE/PREMIUM toggles are reflected immediately without a redeploy.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, Eye, Pencil, CheckCircle, Sparkles, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getTemplateById } from '../data/resumeTemplates';   // metadata only (name, description, tags, colors)
import { THUMBNAIL_MAP, TEMPLATE_MAP } from '../components/resumeTemplates/index';
import { SubscriptionProvider, useSubscription } from '../context/SubscriptionContext';
import UpgradeModal from '../components/ui/UpgradeModal';
import { api } from '../services/api';

// ─── Inline preview overlay ────────────────────────────────────────────────
const DEMO_DATA = {
  name: 'Priya Sharma',
  email: 'priya.sharma@email.com',
  phone: '+91 98765 43210',
  location: 'Bangalore, India',
  linkedin: 'linkedin.com/in/priyasharma',
  photo: 'https://ui-avatars.com/api/?name=Priya+Sharma&size=128&background=FF9933&color=fff&rounded=true',
  summary: 'Final-year Computer Science student with hands-on experience in full-stack development and machine learning. Passionate about building impactful products.',
  skills: ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Machine Learning'],
  experience: [
    { title: 'Software Engineering Intern', company: 'TechCorp India', duration: 'Jun 2024 – Aug 2024', description: 'Built RESTful APIs serving 50k+ requests/day. Reduced page load time by 35% through code optimisation.' },
  ],
  education: [
    { degree: 'B.Tech Computer Science', institution: 'IIT Bangalore', year: '2021 – 2025' },
  ],
  projects: [
    { title: 'AI Resume Analyser', link: 'github.com/priya/ai-resume', description: 'NLP tool that scores resumes against job descriptions using TF-IDF and BERT embeddings.' },
  ],
  certifications: ['Google Associate Cloud Engineer', 'Meta Front-End Developer'],
  achievements: ['1st place — National Smart India Hackathon 2023', 'Google Summer of Code 2024 contributor'],
};

const PreviewOverlay = ({ template, onClose }) => {
  const TemplateComponent = TEMPLATE_MAP[template.templateId];
  if (!TemplateComponent) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center', overflowY: 'auto', padding: '32px 16px',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '860px', position: 'relative' }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '12px',
        }}>
          <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>
            {template.name} — Preview (sample data)
          </span>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '8px', padding: '6px 10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600' }}>
            <X size={15} /> Close
          </button>
        </div>
        <div style={{ background: '#fff', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <TemplateComponent data={DEMO_DATA} />
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Template card ──────────────────────────────────────────────────────────
const TemplateCard = ({ template, isSubscribed, onUse, onPreview }) => {
  const isFree    = template.access === 'FREE';
  const canUse    = isFree || isSubscribed;
  const Thumb     = THUMBNAIL_MAP[template.templateId];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.22 }}
      style={{
        background: '#fff', borderRadius: '16px',
        border: `1.5px solid ${canUse ? '#e5e7eb' : '#fde68a'}`,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.2s',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', padding: '14px 14px 0', cursor: 'pointer' }}
        onClick={() => onPreview(template)}>
        {Thumb && <Thumb template={template} />}
        {/* Hover overlay */}
        <div style={{
          position: 'absolute', inset: '14px 14px 0',
          background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: '8px',
        }}
          className="card-thumb-overlay"
        >
          <div style={{
            background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: '8px',
            padding: '6px 14px', fontSize: '12px', fontWeight: '700',
            display: 'flex', alignItems: 'center', gap: '5px', opacity: 0,
            transition: 'opacity 0.18s',
          }} className="preview-label">
            <Eye size={14} /> Preview
          </div>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Name row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111', margin: 0 }}>
            {template.name}
          </h3>
          {isFree ? (
            <span style={{
              background: '#f0fdf4', color: '#138808', border: '1px solid #bbf7d0',
              fontSize: '10px', fontWeight: '800', padding: '2px 8px',
              borderRadius: '20px', flexShrink: 0,
            }}>FREE</span>
          ) : (
            <span style={{
              background: isSubscribed ? '#fffbeb' : '#fff7ed',
              color: isSubscribed ? '#b45309' : '#FF9933',
              border: `1px solid ${isSubscribed ? '#fde68a' : '#fdba74'}`,
              fontSize: '10px', fontWeight: '800', padding: '2px 8px',
              borderRadius: '20px', flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Crown size={9} /> PREMIUM
            </span>
          )}
        </div>

        <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5', flex: 1 }}>
          {template.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {template.tags.map(tag => (
            <span key={tag} style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              color: '#6b7280', fontSize: '10px', fontWeight: '600',
              padding: '2px 7px', borderRadius: '4px',
            }}>{tag}</span>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => onPreview(template)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: '1.5px solid #e5e7eb', background: '#fff',
              color: '#374151', fontSize: '12px', fontWeight: '600',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px',
            }}>
            <Eye size={13} /> Preview
          </button>
          <button
            onClick={() => onUse(template)}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
              background: canUse
                ? 'linear-gradient(135deg,#FF9933,#e68a2e)'
                : '#f9fafb',
              color: canUse ? '#fff' : '#9ca3af',
              fontSize: '12px', fontWeight: '700',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px',
              border: canUse ? 'none' : '1.5px solid #e5e7eb',
            }}>
            {canUse
              ? <><Pencil size={13} /> Use Template</>
              : <><Lock size={13} /> Premium Only</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Gallery inner (needs subscription context) ────────────────────────────
const GalleryInner = () => {
  const navigate = useNavigate();
  const { isSubscribed, openUpgrade, closeUpgrade, showUpgrade, refresh } = useSubscription();

  const [liveTemplates, setLiveTemplates] = useState([]);  // from backend (has live access config)
  const [fetchLoading,  setFetchLoading]  = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Fetch live access config from backend — reflects admin toggles immediately
  const loadTemplates = useCallback(async () => {
    setFetchLoading(true);
    try {
      const r = await api.get('/resume-templates');
      // Merge backend access with local metadata (name, description, tags, colors)
      const merged = (r.templates || []).map(backendT => {
        const meta = getTemplateById(backendT.templateId) || {};
        return { ...meta, ...backendT };   // backend access wins over local default
      });
      setLiveTemplates(merged);
    } catch {
      // Fallback to local config if backend unavailable
      const { SORTED_TEMPLATES } = await import('../data/resumeTemplates');
      setLiveTemplates(SORTED_TEMPLATES);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const freeCount    = liveTemplates.filter(t => t.access === 'FREE').length;
  const premiumCount = liveTemplates.filter(t => t.access === 'PREMIUM').length;

  const handleUse = useCallback((template) => {
    if (template.access === 'FREE' || isSubscribed) {
      navigate(`/resume-builder/${template.templateId}`);
    } else {
      openUpgrade();
    }
  }, [isSubscribed, navigate, openUpgrade]);

  const handlePreview = useCallback((template) => {
    setPreviewTemplate(template);
  }, []);

  return (
    <>
      <style>{`
        .template-card:hover .card-thumb-overlay { background: rgba(0,0,0,0.18) !important; }
        .template-card:hover .preview-label { opacity: 1 !important; }
      `}</style>

      <AnimatePresence>
        {previewTemplate && (
          <PreviewOverlay
            template={previewTemplate}
            onClose={() => setPreviewTemplate(null)}
          />
        )}
      </AnimatePresence>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={closeUpgrade}
        onSubscribed={refresh}
        featureLabel="Premium resume templates"
      />

      <div className="resume-templates-page">
        <Navbar />
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '100px 20px 60px',
          fontFamily: 'Inter, Arial, sans-serif',
        }}>

          {/* ── Page header ── */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles size={18} style={{ color: '#FF9933' }} />
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                ATS-Friendly Templates
              </span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '800', color: '#111', margin: '0 0 10px', lineHeight: '1.2' }}>
              Resume Templates
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#6b7280', margin: '0 0 20px', maxWidth: '540px' }}>
              Create a professional, ATS-friendly resume in minutes — pre-filled with your profile data and photo.
            </p>

            {/* Free / Premium banner */}
            {!fetchLoading && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '16px',
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: '12px', padding: '10px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={14} style={{ color: '#138808' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#138808' }}>{freeCount} Free</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>templates available</span>
                </div>
                <div style={{ width: '1px', height: '18px', background: '#e5e7eb' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Crown size={14} style={{ color: '#FF9933' }} />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#FF9933' }}>{premiumCount} Premium</span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {isSubscribed ? '✓ unlocked' : '— upgrade to unlock'}
                  </span>
                </div>
                {!isSubscribed && (
                  <button onClick={openUpgrade}
                    style={{ padding: '5px 14px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#FF9933,#e68a2e)', color: '#fff', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}>
                    Upgrade
                  </button>
                )}
                <button onClick={loadTemplates}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px' }}
                  title="Refresh template list">
                  <RefreshCw size={13} />
                </button>
              </div>
            )}
          </div>

          {/* Subscribed banner */}
          {isSubscribed && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px', padding: '12px 18px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Crown size={18} style={{ color: '#138808', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#15803d' }}>Premium Active — all templates unlocked</span>
            </motion.div>
          )}

          {/* ── Template grid ── */}
          {fetchLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background: '#f3f4f6', borderRadius: '16px', aspectRatio: '3/4', animation: 'pulse 1.5s infinite' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '22px' }}>
              {liveTemplates.map(template => (
                <div key={template.templateId} className="template-card">
                  <TemplateCard
                    template={template}
                    isSubscribed={isSubscribed}
                    onUse={handleUse}
                    onPreview={handlePreview}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Bottom CTA for free users */}
          {!isSubscribed && !fetchLoading && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ marginTop: '48px', background: 'linear-gradient(135deg,#fff8f0,#fff)', border: '1.5px solid #fde68a', borderRadius: '20px', padding: '32px', textAlign: 'center' }}>
              <Crown size={32} style={{ color: '#FF9933', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#111', margin: '0 0 8px' }}>
                Unlock All {premiumCount} Premium Templates
              </h3>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '18px', maxWidth: '400px', margin: '0 auto 18px' }}>
                Get unlimited access to all premium templates, AI resume analysis, career intelligence, and more.
              </p>
              <button onClick={openUpgrade}
                style={{ padding: '11px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#FF9933,#e68a2e)', color: '#fff', fontWeight: '800', fontSize: '14px', cursor: 'pointer' }}>
                View Premium Plans
              </button>
            </motion.div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
};

// Wrap with SubscriptionProvider so useSubscription works on this public page
const ResumeTemplates = () => (
  <SubscriptionProvider>
    <GalleryInner />
  </SubscriptionProvider>
);

export default ResumeTemplates;
