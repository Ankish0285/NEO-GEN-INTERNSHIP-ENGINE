/**
 * InternshipDetailPage  —  /internships/:slug
 *
 * SEO:
 *  - Unique <title>, meta description, canonical URL per internship
 *  - Open Graph + Twitter Card populated from real internship data
 *  - Schema.org JobPosting JSON-LD injected into <head>
 *
 * Routing:
 *  The page receives the URL slug (title-org-location) from React Router.
 *  It fetches the full internship list, matches by slug, then renders the
 *  detail view. Fallback: if no match by slug, falls back to :id match for
 *  backward-compat with any old /internships/:id links.
 *
 * Application flow:
 *  Delegates to the existing AIApplicationModal so the apply pipeline is
 *  completely untouched.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, DollarSign, Calendar, Briefcase, Building2,
  ArrowLeft, ArrowRight, ExternalLink, Users, Tag, CheckCircle,
  Loader2, AlertCircle, Share2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIApplicationModal from '../components/home/AIApplicationModal';
import InternshipQualityBadge from '../components/career/InternshipQualityBadge';
import WhyNotApplyModal from '../components/career/WhyNotApplyModal';
import { api } from '../services/api';
import { getInternshipQuality, getWhyNotApply } from '../services/careerService';
import { useAuth } from '../context/AuthContext';
import { useSEO, SITE_URL } from '../seo/useSEO';
import { internshipSlug } from '../seo/slugify';
import { buildJobPostingLD, injectJsonLd, removeJsonLd } from '../seo/structuredData';
import { internshipMatchesCategory, CATEGORIES } from '../seo/categories';

const SITE_NAME = 'NEOGEN INTERNSHIP ENGINE';
const LD_ID     = 'ld-jobposting';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return null; }
};

const TagPill = ({ label }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 bg-orange-50 text-orange-700">
    {label}
  </span>
);

const InfoRow = ({ icon: Icon, label, value, color = '#6b7280' }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <Icon size={18} style={{ color, marginTop: 2, flexShrink: 0 }} />
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
};

/* ── Main component ──────────────────────────────────────────────────────── */
const InternshipDetailPage = () => {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { isAuthenticated } = useAuth();

  const [internship,     setInternship]     = useState(null);
  const [related,        setRelated]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [notFound,       setNotFound]       = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applied,        setApplied]        = useState(false);
  const [copied,         setCopied]         = useState(false);
  const [qualityData,    setQualityData]    = useState(null);
  const [showWhyNot,     setShowWhyNot]     = useState(false);
  const [whyNotData,     setWhyNotData]     = useState(null);
  const [whyNotLoading,  setWhyNotLoading]  = useState(false);

  /* Derived SEO values */
  const canonical  = internship ? `${SITE_URL}/internships/${internshipSlug(internship)}` : `${SITE_URL}/find-internship`;
  const pageTitle  = internship ? `${internship.title} Internship | ${internship.organization || ''}` : 'Internship';
  const pageDesc   = internship
    ? `Apply for ${internship.title} internship at ${internship.organization || 'a leading organisation'} in ${internship.location || 'India'}. ` +
      `Duration: ${internship.duration || 'flexible'}. Stipend: ${internship.stipend || 'as per norms'}. Apply on NEOGEN INTERNSHIP ENGINE.`
    : 'Internship detail page on NEOGEN INTERNSHIP ENGINE.';

  /* Apply SEO to <head> */
  useSEO({
    title:     pageTitle,
    description: pageDesc,
    canonical,
    ogType:   'object',
  });

  /* Inject / clean up JobPosting JSON-LD */
  useEffect(() => {
    if (internship) {
      const ld = buildJobPostingLD(internship, canonical);
      if (ld) injectJsonLd(LD_ID, ld);
    }
    return () => removeJsonLd(LD_ID);
  }, [internship, canonical]);

  /* Fetch internship by slug (or id fallback) */
  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const all = await api.get('/internships');
      if (!Array.isArray(all)) { setNotFound(true); return; }

      /* Primary: slug match */
      let found = all.find(i => internshipSlug(i) === slug);

      /* Fallback: MongoDB _id match (for legacy /internships/:id URLs) */
      if (!found) {
        found = all.find(i => String(i._id || i.id) === slug);
      }

      if (!found) { setNotFound(true); return; }

      setInternship(found);

      /* Related: same skills or category, exclude current */
      const relatedPool = all
        .filter(i => String(i._id || i.id) !== String(found._id || found.id))
        .filter(i => {
          const sharedSkill = (i.skills || []).some(s =>
            (found.skills || []).includes(s)
          );
          const sameLocation = i.location === found.location;
          return sharedSkill || sameLocation;
        })
        .slice(0, 3);
      setRelated(relatedPool);
    } catch (err) {
      console.error('[InternshipDetailPage] fetch error', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!internship?._id) return;
    getInternshipQuality(internship._id)
      .then(res => setQualityData(res.data))
      .catch(() => {}); // quality score is non-critical; fail silently
  }, [internship?._id]);

  const handleShare = () => {
    if (navigator.share && internship) {
      navigator.share({
        title: `${internship.title} at ${internship.organization}`,
        text:  pageDesc,
        url:   canonical,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(canonical).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleWhyNotApply = async () => {
    if (!isAuthenticated) return;
    setWhyNotLoading(true);
    try {
      const res = await getWhyNotApply(internship._id);
      setWhyNotData(res?.data || res);
      setShowWhyNot(true);
    } catch (e) {
      console.warn('[InternshipDetailPage] whyNotApply error:', e);
    } finally {
      setWhyNotLoading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
          <Loader2 size={36} className="text-orange-500 animate-spin" />
        </div>
        <Footer />
      </>
    );
  }

  /* ── Not found ── */
  if (notFound || !internship) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
          <AlertCircle size={48} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-gray-800">Internship Not Found</h1>
          <p className="text-gray-500 text-sm">This listing may have been removed or the link is incorrect.</p>
          <Link to="/find-internship"
            className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg,#FF9933,#e68a2e)' }}>
            <ArrowLeft size={16} /> Browse All Internships
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  const deadlineStr = fmt(internship.deadline);
  const startStr    = fmt(internship.startDate);
  const postedStr   = fmt(internship.createdAt);
  const tags        = [...new Set([...(internship.skills || []), ...(internship.requiredSkills || [])])].slice(0, 8);
  const relatedCategories = CATEGORIES.filter(cat => internshipMatchesCategory(internship, cat)).slice(0, 3);

  return (
    <>
      <Navbar />

      <main style={{ paddingTop: 80, minHeight: '100vh', background: '#f8fafc' }}>
        {/* ── Breadcrumb ────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '10px 0' }}>
          <div className="neo-container">
            <ol style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#9ca3af', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><Link to="/" style={{ color: '#FF9933', fontWeight: 600 }}>Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/find-internship" style={{ color: '#FF9933', fontWeight: 600 }}>Internships</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: '#374151', fontWeight: 600 }} aria-current="page">{internship.title}</li>
            </ol>
          </div>
        </nav>

        <div className="neo-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 28, alignItems: 'start' }}
               className="internship-detail-grid">

            {/* ── LEFT: Main content ──────────────────────────────── */}
            <div>
              {/* Header card */}
              <motion.article
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22,1,0.36,1] }}
                style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
              >
                {/* Org badge + share */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', borderRadius: 50, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
                    {internship.organization || internship.department}
                  </span>
                  <button onClick={handleShare} title="Share this internship"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600 }}>
                    <Share2 size={15} /> {copied ? 'Copied!' : 'Share'}
                  </button>
                </div>

                {/* Title — H1 for SEO */}
                <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827', lineHeight: 1.25, marginBottom: 6 }}>
                  {internship.title}
                </h1>
                <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 20 }}>
                  {internship.organization} &nbsp;·&nbsp; {internship.location}
                </p>

                {/* Quality Badge */}
                {qualityData && (
                  <div style={{ marginBottom: 16 }}>
                    <InternshipQualityBadge
                      qualityScore={qualityData.qualityScore}
                      riskLevel={qualityData.riskLevel}
                      roiEstimate={qualityData.roiEstimate}
                    />
                  </div>
                )}

                {/* Quick stats */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 0', borderTop: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', marginBottom: 20 }}>
                  {[
                    { icon: MapPin,    label: internship.location },
                    { icon: Clock,     label: internship.duration },
                    { icon: DollarSign,label: internship.stipend },
                    { icon: Briefcase, label: internship.type || 'Internship' },
                    internship.workMode && { icon: Building2, label: internship.workMode },
                  ].filter(Boolean).map(({ icon: Icon, label }, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151' }}>
                      <Icon size={15} style={{ color: '#FF9933', flexShrink: 0 }} />
                      <span>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                {tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {tags.map(t => <TagPill key={t} label={t} />)}
                  </div>
                )}

                {/* CTA */}
                {!applied ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) { navigate('/login'); return; }
                        setShowApplyModal(true);
                      }}
                      style={{
                        background: 'linear-gradient(135deg,#FF9933,#e68a2e)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        padding: '13px 32px', fontSize: 15, fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      Apply Now <ArrowRight size={16} />
                    </button>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={handleWhyNotApply}
                        disabled={whyNotLoading}
                        style={{
                          background: '#fff', color: '#6b7280', border: '1.5px solid #e5e7eb',
                          borderRadius: 10, padding: '12px 20px', fontSize: 14, fontWeight: 600,
                          cursor: whyNotLoading ? 'not-allowed' : 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          opacity: whyNotLoading ? 0.7 : 1,
                        }}
                      >
                        {whyNotLoading ? 'Analyzing...' : 'Why Not Apply?'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15 }}>
                    <CheckCircle size={18} /> Application Submitted
                  </div>
                )}

                {internship.applyLink && (
                  <a href={internship.applyLink} target="_blank" rel="noopener noreferrer"
                    style={{ marginLeft: 12, color: '#FF9933', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    External link <ExternalLink size={13} />
                  </a>
                )}
              </motion.article>

              {/* Description */}
              {internship.description && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>About the Internship</h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{internship.description}</p>
                </motion.section>
              )}

              {/* Responsibilities */}
              {internship.responsibilities && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Responsibilities</h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{internship.responsibilities}</p>
                </motion.section>
              )}

              {/* Requirements */}
              {internship.requirements && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Requirements</h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{internship.requirements}</p>
                </motion.section>
              )}

              {/* Eligibility */}
              {internship.eligibility && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22, duration: 0.4 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Who Can Apply</h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{internship.eligibility}</p>
                  {internship.branchRequirements?.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {internship.branchRequirements.map(b => (
                        <span key={b} style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 50, padding: '3px 12px', fontSize: 12, fontWeight: 600 }}>{b}</span>
                      ))}
                    </div>
                  )}
                </motion.section>
              )}

              {/* Benefits */}
              {internship.benefits && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '24px 32px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20 }}
                >
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Benefits &amp; Perks</h2>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{internship.benefits}</p>
                </motion.section>
              )}

              {/* Related categories (internal links for SEO) */}
              {relatedCategories.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
                  style={{ background: '#fff7ed', borderRadius: 16, padding: '20px 28px', border: '1px solid #fed7aa' }}
                >
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#c2410c', marginBottom: 10 }}>
                    <Tag size={14} style={{ display: 'inline', marginRight: 5 }} />
                    Browse similar internship categories
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {relatedCategories.map(cat => (
                      <Link key={cat.slug} to={`/internships/${cat.slug}`}
                        style={{ background: '#fff', color: '#FF9933', border: '1px solid #fdba74', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                        {cat.label} →
                      </Link>
                    ))}
                  </div>
                </motion.section>
              )}
            </div>

            {/* ── RIGHT: Sidebar ───────────────────────────────────── */}
            <aside>
              {/* Details card */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1, duration: 0.45 }}
                style={{ background: '#fff', borderRadius: 16, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', marginBottom: 20, position: 'sticky', top: 100 }}
              >
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', marginBottom: 4 }}>Internship Details</h2>
                <div style={{ borderBottom: '2px solid #FF9933', width: 40, marginBottom: 16 }} />

                <InfoRow icon={MapPin}     label="Location"      value={internship.location}   color="#FF9933" />
                <InfoRow icon={Clock}      label="Duration"      value={internship.duration}   color="#FF9933" />
                <InfoRow icon={DollarSign} label="Stipend"       value={internship.stipend}    color="#138808" />
                <InfoRow icon={Briefcase}  label="Type"          value={internship.type}       color="#6366f1" />
                <InfoRow icon={Building2}  label="Work Mode"     value={internship.workMode}   color="#0891b2" />
                <InfoRow icon={Users}      label="Openings"      value={internship.openings ? `${internship.openings} openings` : null} color="#6b7280" />
                <InfoRow icon={Calendar}   label="Apply Before"  value={deadlineStr}           color="#ef4444" />
                <InfoRow icon={Calendar}   label="Start Date"    value={startStr}              color="#6b7280" />
                <InfoRow icon={Calendar}   label="Posted On"     value={postedStr}             color="#9ca3af" />

                <button
                  onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowApplyModal(true); }}
                  style={{
                    width: '100%', marginTop: 20, background: 'linear-gradient(135deg,#FF9933,#e68a2e)',
                    color: '#fff', border: 'none', borderRadius: 10, padding: '12px',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {applied ? '✓ Applied' : 'Apply Now'}
                </button>
              </motion.div>

              {/* Related listings */}
              {related.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.45 }}
                  style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}
                >
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#111827', marginBottom: 14 }}>Similar Internships</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {related.map(rel => (
                      <Link key={rel._id} to={`/internships/${internshipSlug(rel)}`}
                        style={{ display: 'block', background: '#f9fafb', borderRadius: 10, padding: '12px', textDecoration: 'none', border: '1px solid #f3f4f6' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{rel.title}</p>
                        <p style={{ fontSize: 12, color: '#6b7280' }}>{rel.organization} · {rel.location}</p>
                      </Link>
                    ))}
                  </div>
                  <Link to="/find-internship"
                    style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 14, color: '#FF9933', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                    View all internships <ArrowRight size={14} />
                  </Link>
                </motion.div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <Footer />

      {/* ── Apply modal (existing pipeline, untouched) ── */}
      {showApplyModal && (
        <AIApplicationModal
          internship={internship}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            setApplied(true);
          }}
        />
      )}

      {/* ── Why Not Apply Modal ── */}
      <WhyNotApplyModal
        isOpen={showWhyNot}
        onClose={() => setShowWhyNot(false)}
        internshipTitle={internship?.title}
        concerns={whyNotData?.concerns || []}
        overallRisk={whyNotData?.overallRisk || 'medium'}
        recommendation={whyNotData?.recommendation}
      />

      {/* Responsive sidebar collapse */}
      <style>{`
        @media (max-width: 768px) {
          .internship-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default InternshipDetailPage;
