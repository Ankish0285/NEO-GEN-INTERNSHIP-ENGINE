/**
 * InternshipCategoryPage  —  /internships/:categorySlug
 *
 * Renders a keyword-filtered internship listing for one category
 * (e.g. /internships/engineering, /internships/remote).
 *
 * SEO per category:
 *  - Unique <title>, meta description, and canonical URL
 *  - Open Graph populated with real category data
 *  - No thin content — every page shows actual live internships plus
 *    a human-readable intro paragraph written for that field
 *
 * Routing note:
 *  This component shares the path pattern /internships/:slug with
 *  InternshipDetailPage. AppRoutes resolves the ambiguity by checking
 *  whether the slug matches a known category first; if not, it falls
 *  through to the detail page. We handle it here by checking
 *  getCategoryBySlug(slug) and showing a 404-style fallback when
 *  the slug is neither a category nor a real internship.
 *
 * Application safety:
 *  Uses the same AIApplicationModal for applying — no pipeline changes.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, DollarSign, Building2, ArrowRight,
  Briefcase, Search, AlertCircle, Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AIApplicationModal from '../components/home/AIApplicationModal';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSEO, SITE_URL } from '../seo/useSEO';
import { internshipSlug } from '../seo/slugify';
import { getCategoryBySlug, CATEGORIES, internshipMatchesCategory } from '../seo/categories';

/* ── Tiny helpers ─────────────────────────────────────────────────────────── */
const fmt = (d) => {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return null; }
};

/* ── Internship card (self-contained, no router-level state leak) ─────────── */
const InternshipCard = ({ internship, onApply, applied }) => {
  const slug = internshipSlug(internship);
  const tags = (internship.skills || []).slice(0, 4);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #f3f4f6',
        boxShadow: '0 1px 3px rgba(0,0,0,.06)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '20px 22px', flex: 1 }}>
        {/* Org badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <span style={{
            background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa',
            borderRadius: 50, padding: '3px 12px', fontSize: 11, fontWeight: 700,
          }}>
            {internship.organization || internship.department}
          </span>
          {internship.workMode && (
            <span style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 50, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
              {internship.workMode}
            </span>
          )}
        </div>

        {/* Title — links to detail page */}
        <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: 8 }}>
          <Link to={`/internships/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            {internship.title}
          </Link>
        </h3>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
          {internship.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <MapPin size={13} style={{ color: '#FF9933', flexShrink: 0 }} />
              {internship.location}
            </div>
          )}
          {internship.duration && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <Clock size={13} style={{ color: '#FF9933', flexShrink: 0 }} />
              {internship.duration}
            </div>
          )}
          {internship.stipend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#6b7280' }}>
              <DollarSign size={13} style={{ color: '#138808', flexShrink: 0 }} />
              {internship.stipend}
            </div>
          )}
        </div>

        {/* Skills */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {tags.map(t => (
              <span key={t} style={{
                background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb',
                borderRadius: 6, padding: '3px 9px', fontSize: 11, fontWeight: 500,
              }}>{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Footer row */}
      <div style={{
        padding: '12px 22px', borderTop: '1px solid #f3f4f6',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#fafafa',
      }}>
        <span style={{ fontSize: 11, color: '#9ca3af' }}>
          {fmt(internship.deadline) ? `Deadline: ${fmt(internship.deadline)}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/internships/${slug}`}
            style={{
              padding: '7px 14px', background: 'none', border: '1.5px solid #e5e7eb',
              borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#374151',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
            Details
          </Link>
          <button
            onClick={() => onApply(internship)}
            disabled={applied}
            style={{
              padding: '7px 14px',
              background: applied ? '#f0fdf4' : 'linear-gradient(135deg,#FF9933,#e68a2e)',
              border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
              color: applied ? '#15803d' : '#fff', cursor: applied ? 'default' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            {applied ? '✓ Applied' : 'Apply'}
          </button>
        </div>
      </div>
    </motion.article>
  );
};

/* ── Main page ───────────────────────────────────────────────────────────── */
const InternshipCategoryPage = () => {
  const { slug: categorySlug } = useParams();
  const navigate         = useNavigate();
  const { isAuthenticated } = useAuth();

  const category = getCategoryBySlug(categorySlug);

  const [allInternships, setAllInternships] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [applyTarget,    setApplyTarget]    = useState(null);
  const [appliedIds,     setAppliedIds]     = useState(new Set());

  /* ── SEO ── */
  const canonical = `${SITE_URL}/internships/${categorySlug}`;
  const pageTitle = category ? category.label : `${categorySlug} Internships`;
  const pageDesc  = category
    ? `${category.description} Find and apply on NEOGEN INTERNSHIP ENGINE.`
    : `Find ${categorySlug} internships for students in India. Apply on NEOGEN INTERNSHIP ENGINE.`;

  useSEO({
    title:       pageTitle,
    description: pageDesc,
    canonical,
    noIndex:     !category,   // unknown slugs get noindex
  });

  /* ── Fetch internships ── */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/internships');
      setAllInternships(Array.isArray(data) ? data : []);
    } catch {
      setAllInternships([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Filter to category + search ── */
  const filtered = useMemo(() => {
    let list = category
      ? allInternships.filter(i => internshipMatchesCategory(i, category))
      : allInternships;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        (i.title        || '').toLowerCase().includes(q) ||
        (i.organization || '').toLowerCase().includes(q) ||
        (i.location     || '').toLowerCase().includes(q) ||
        (i.skills || []).some(s => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allInternships, category, search]);

  /* ── Apply handler ── */
  const handleApply = (internship) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setApplyTarget(internship);
  };

  /* ── Related categories (cross-links for SEO) ── */
  const relatedCats = CATEGORIES
    .filter(c => c.slug !== categorySlug)
    .slice(0, 6);

  /* ── Unknown category ── */
  if (!loading && !category) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 100, gap: 16 }}>
          <AlertCircle size={48} className="text-orange-400" />
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827' }}>Category Not Found</h1>
          <p style={{ color: '#6b7280', fontSize: 14 }}>We don't have a dedicated page for this category yet.</p>
          <Link to="/find-internship"
            style={{ marginTop: 8, background: 'linear-gradient(135deg,#FF9933,#e68a2e)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowRight size={15} /> Browse All Internships
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main style={{ paddingTop: 80, minHeight: '100vh', background: '#f8fafc' }}>

        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" style={{ background: '#fff', borderBottom: '1px solid #f3f4f6', padding: '10px 0' }}>
          <div className="neo-container">
            <ol style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13, color: '#9ca3af', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><Link to="/" style={{ color: '#FF9933', fontWeight: 600 }}>Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link to="/find-internship" style={{ color: '#FF9933', fontWeight: 600 }}>Internships</Link></li>
              <li aria-hidden="true">/</li>
              <li style={{ color: '#374151', fontWeight: 600 }} aria-current="page">{category?.label || categorySlug}</li>
            </ol>
          </div>
        </nav>

        {/* ── Hero header ── */}
        <div style={{ background: 'linear-gradient(135deg,#1e2a3a 0%,#2d3f56 100%)', padding: '48px 0 40px', borderBottom: '3px solid #FF9933' }}>
          <div className="neo-container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,153,51,0.18)', border: '1px solid rgba(255,153,51,0.35)', borderRadius: 50, padding: '4px 14px', marginBottom: 14 }}>
                <Briefcase size={13} style={{ color: '#FF9933' }} />
                <span style={{ color: '#FF9933', fontSize: 12, fontWeight: 700 }}>NEOGEN INTERNSHIP ENGINE</span>
              </div>

              {/* H1 */}
              <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 14 }}>
                {category?.h1 || pageTitle}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.65, maxWidth: 640, marginBottom: 24 }}>
                {category?.description}
              </p>

              {/* Search within category */}
              <div style={{ position: 'relative', maxWidth: 480 }}>
                <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  type="search"
                  placeholder={`Search ${category?.label || 'internships'}…`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  aria-label={`Search ${category?.label || 'internships'}`}
                  style={{
                    width: '100%', padding: '12px 14px 12px 44px', borderRadius: 10,
                    border: 'none', fontSize: 14, outline: 'none',
                    background: 'rgba(255,255,255,0.96)', color: '#111827',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Listings ── */}
        <div className="neo-container" style={{ paddingTop: 32, paddingBottom: 64 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>
              {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'internship' : 'internships'} found`}
            </p>
            <Link to="/find-internship"
              style={{ fontSize: 13, color: '#FF9933', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              Browse all fields <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
              <Building2 size={48} style={{ color: '#e5e7eb', marginBottom: 16 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                {search ? 'No results match your search.' : `No ${category?.label || 'internships'} are listed right now.`}
              </p>
              <p style={{ fontSize: 13, marginBottom: 20 }}>
                {search ? 'Try different keywords.' : 'Check back soon — new internships are added regularly.'}
              </p>
              <Link to="/find-internship"
                style={{ color: '#FF9933', fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Browse all internships <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {filtered.map(internship => (
                <InternshipCard
                  key={internship._id || internship.id}
                  internship={internship}
                  onApply={handleApply}
                  applied={appliedIds.has(String(internship._id || internship.id))}
                />
              ))}
            </div>
          )}

          {/* ── Cross-links to other categories (internal linking for SEO) ── */}
          {!loading && (
            <section style={{ marginTop: 56, padding: '32px', background: '#fff', borderRadius: 16, border: '1px solid #f3f4f6' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', marginBottom: 6 }}>
                Explore Other Internship Categories
              </h2>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
                NEOGEN INTERNSHIP ENGINE covers internships across every academic branch and professional field.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {relatedCats.map(cat => (
                  <Link
                    key={cat.slug}
                    to={`/internships/${cat.slug}`}
                    style={{
                      background: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb',
                      borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                      textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                      transition: 'all .15s',
                    }}
                  >
                    {cat.label} <ArrowRight size={12} />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />

      {/* ── Apply modal (existing pipeline untouched) ── */}
      {applyTarget && (
        <AIApplicationModal
          internship={applyTarget}
          onClose={() => setApplyTarget(null)}
          onSuccess={() => {
            setAppliedIds(prev => new Set([...prev, String(applyTarget._id || applyTarget.id)]));
            setApplyTarget(null);
          }}
        />
      )}
    </>
  );
};

export default InternshipCategoryPage;
