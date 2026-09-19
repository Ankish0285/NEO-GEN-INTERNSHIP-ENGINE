/**
 * ResumeBuilder — /resume-builder/:templateId
 *
 * Flow:
 *  1. Mount → call GET /api/resume-templates/access/:templateId (backend auth check)
 *  2. If 403 SUBSCRIPTION_REQUIRED → show UpgradeModal, block the page
 *  3. If allowed → load profile data from GET /api/profile/me
 *  4. Populate editable resume form fields from profile
 *  5. Live preview renders the chosen template component with form data
 *  6. "Download PDF" → POST /api/resume-templates/validate-use (second gate)
 *     then window.print() which triggers @media print styles
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Loader2, Plus, Trash2, Crown, Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { getTemplateById, SORTED_TEMPLATES } from '../data/resumeTemplates';
import { TEMPLATE_MAP } from '../components/resumeTemplates/index';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import UpgradeModal from '../components/ui/UpgradeModal';
import Navbar from '../components/Navbar';

/* ─── tiny helpers ─────────────────────────────────────────────────────────── */
const field = (label, value, onChange, multiline = false) => (
  <div style={{ marginBottom: '10px' }}>
    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
    </label>
    {multiline
      ? <textarea rows={3} value={value || ''} onChange={onChange}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }} />
      : <input type="text" value={value || ''} onChange={onChange}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
    }
  </div>
);

/* ─── print styles injected once ───────────────────────────────────────────── */
const PRINT_STYLE_ID = 'resume-print-style';
function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      body > *:not(#resume-print-portal) { display: none !important; }
      #resume-print-portal {
        display: block !important; position: fixed; inset: 0;
        z-index: 99999; background: #fff;
        overflow: visible;
      }
      #resume-print-root { box-shadow: none !important; }
      @page { size: A4; margin: 0; }
    }
  `;
  document.head.appendChild(style);
}

/* ─── Main component ────────────────────────────────────────────────────────── */
const ResumeBuilderInner = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const templateMeta = getTemplateById(templateId);
  const TemplateComponent = TEMPLATE_MAP[templateId];

  /* access check */
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessDenied,  setAccessDenied]  = useState(false);
  const [showUpgrade,   setShowUpgrade]   = useState(false);

  /* profile + form data */
  const [resumeData, setResumeData] = useState({
    name: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '',
    photo: '',     // circular profile photo
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basics');
  const [printing, setPrinting] = useState(false);

  /* portal ref for printing */
  const portalRef = useRef(null);

  /* ── 1. Backend access check ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!templateMeta || !TemplateComponent) return;
    (async () => {
      try {
        await api.get(`/resume-templates/access/${templateId}`);
      } catch (err) {
        if (err?.status === 403 || err?.response?.status === 403) {
          setAccessDenied(true);
          setShowUpgrade(true);
        } else if (err?.status === 401 || err?.response?.status === 401) {
          navigate('/login');
          return;
        }
      } finally {
        setAccessLoading(false);
      }
    })();
  }, [templateId, templateMeta, TemplateComponent, navigate]);

  /* ── 2. Load profile data ────────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const profile = await api.get('/profile/me');
        setResumeData(prev => ({
          ...prev,
          name:     profile.name     || '',
          email:    profile.email    || '',
          phone:    profile.phone    || '',
          location: profile.university || '',
          linkedin: '',
          github:   '',
          portfolio:'',
          summary:  '',
          skills:   Array.isArray(profile.skills) ? profile.skills : [],
          experience: Array.isArray(profile.experience) ? profile.experience : [],
          education:  [],
          projects:   Array.isArray(profile.projects) ? profile.projects.map(p => ({
            title: p.title || '', description: p.description || '', link: p.link || '',
          })) : [],
        }));
      } catch { /* non-fatal — user can fill manually */ }
      finally { setProfileLoading(false); }
    })();
  }, []);

  /* ── 3. Print / PDF ─────────────────────────────────────────────────────── */
  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);
    try {
      /* Second gate — backend validates before we allow print */
      await api.post('/resume-templates/validate-use', { templateId });
    } catch (err) {
      setPrinting(false);
      if (err?.status === 403 || err?.response?.status === 403) {
        setAccessDenied(true);
        setShowUpgrade(true);
      } else {
        toast.error('Unable to generate resume. Please try again.');
      }
      return;
    }

    ensurePrintStyles();

    /* Render template into the print portal */
    const portal = document.getElementById('resume-print-portal');
    if (portal) {
      portal.style.display = 'block';
    }

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        if (portal) portal.style.display = 'none';
        setPrinting(false);
      }, 500);
    }, 120);
  };

  /* ─── helpers to update arrays ─────────────────────────────────────────── */
  const addItem = (key, blank) =>
    setResumeData(d => ({ ...d, [key]: [...d[key], blank] }));

  const updateItem = (key, idx, patch) =>
    setResumeData(d => ({
      ...d,
      [key]: d[key].map((it, i) => i === idx ? { ...it, ...patch } : it),
    }));

  const removeItem = (key, idx) =>
    setResumeData(d => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));

  const set = (k) => (e) => setResumeData(d => ({ ...d, [k]: e.target.value }));

  /* ─── guard: unknown template ─────────────────────────────────────────── */
  if (!templateMeta || !TemplateComponent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>Template not found.</p>
          <button onClick={() => navigate('/resources/resume-templates')}
            style={{ color: '#FF9933', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
            ← Back to Templates
          </button>
        </div>
      </div>
    );
  }

  /* ─── access loading spinner ─────────────────────────────────────────── */
  if (accessLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#FF9933', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const TABS = ['basics', 'experience', 'education', 'skills', 'projects', 'extras'];
  const tabLabel = { basics: 'Basics', experience: 'Experience', education: 'Education', skills: 'Skills', projects: 'Projects', extras: 'Extras' };

  return (
    <>
      {/* ── Hidden print portal (off-screen until print triggered) ─────── */}
      <div id="resume-print-portal" style={{ display: 'none' }}>
        <TemplateComponent data={resumeData} />
      </div>

      {/* ── Upgrade modal ─────────────────────────────────────────────── */}
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => {
          setShowUpgrade(false);
          if (accessDenied) navigate('/resources/resume-templates');
        }}
        onSubscribed={() => {
          setShowUpgrade(false);
          setAccessDenied(false);
          window.location.reload();
        }}
        featureLabel={`${templateMeta.name} template`}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <Navbar />

      {/* ── Main layout ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', minHeight: 'calc(100vh - 64px)', marginTop: '64px',
        background: '#f8fafc', fontFamily: 'Inter, Arial, sans-serif',
      }}>

        {/* ── LEFT: Editor panel ────────────────────────────────────────── */}
        <div style={{
          width: '360px', flexShrink: 0, background: '#fff',
          borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
          overflowY: 'auto', height: 'calc(100vh - 64px)', position: 'sticky', top: '64px',
        }}>
          {/* Editor header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => navigate('/resources/resume-templates')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: '600', padding: 0 }}>
              <ArrowLeft size={16} /> Templates
            </button>
            <span style={{ color: '#e5e7eb' }}>|</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111' }}>{templateMeta.name}</span>
            {templateMeta.access === 'PREMIUM' && (
              <span style={{ background: '#FF9933', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', marginLeft: 'auto' }}>
                <Crown size={9} style={{ display: 'inline', marginRight: '3px', marginBottom: '1px' }} />PREMIUM
              </span>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', overflowX: 'auto' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{
                  padding: '9px 12px', fontSize: '12px', fontWeight: '600', border: 'none',
                  background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                  color: activeTab === t ? '#FF9933' : '#6b7280',
                  borderBottom: activeTab === t ? '2px solid #FF9933' : '2px solid transparent',
                }}>{tabLabel[t]}</button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: '16px 18px', flex: 1 }}>
            {profileLoading && <p style={{ color: '#9ca3af', fontSize: '12px' }}>Loading profile…</p>}

            {activeTab === 'basics' && (
              <>
                {/* ── Photo upload ── */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
                      background: resumeData.photo ? 'transparent' : '#f3f4f6',
                      border: '2px solid #e5e7eb', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {resumeData.photo
                        ? <img src={resumeData.photo} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '22px', color: '#9ca3af' }}>👤</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'inline-block', padding: '6px 14px', borderRadius: '8px',
                        border: '1.5px solid #e5e7eb', background: '#f9fafb',
                        fontSize: '12px', fontWeight: '600', color: '#374151',
                        cursor: 'pointer', marginBottom: '4px',
                      }}>
                        {resumeData.photo ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) { alert('Photo must be under 2 MB'); return; }
                            const reader = new FileReader();
                            reader.onload = ev => setResumeData(d => ({ ...d, photo: ev.target.result }));
                            reader.readAsDataURL(file);
                          }} />
                      </label>
                      {resumeData.photo && (
                        <button onClick={() => setResumeData(d => ({ ...d, photo: '' }))}
                          style={{ display: 'block', fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                          Remove photo
                        </button>
                      )}
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '3px 0 0' }}>JPG/PNG, max 2 MB</p>
                    </div>
                  </div>
                </div>
                {field('Full Name',    resumeData.name,      set('name'))}
                {field('Email',        resumeData.email,     set('email'))}
                {field('Phone',        resumeData.phone,     set('phone'))}
                {field('Location',     resumeData.location,  set('location'))}
                {field('LinkedIn URL', resumeData.linkedin,  set('linkedin'))}
                {field('GitHub URL',   resumeData.github,    set('github'))}
                {field('Portfolio',    resumeData.portfolio, set('portfolio'))}
                {field('Summary',      resumeData.summary,   set('summary'), true)}
              </>
            )}

            {activeTab === 'experience' && (
              <>
                {resumeData.experience.map((exp, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', marginBottom: '10px', position: 'relative' }}>
                    <button onClick={() => removeItem('experience', i)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                    {field('Job Title',   exp.title,       e => updateItem('experience', i, { title: e.target.value }))}
                    {field('Company',     exp.company,     e => updateItem('experience', i, { company: e.target.value }))}
                    {field('Duration',    exp.duration,    e => updateItem('experience', i, { duration: e.target.value }))}
                    {field('Description',exp.description, e => updateItem('experience', i, { description: e.target.value }), true)}
                  </div>
                ))}
                <button onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9933', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Plus size={14} /> Add Experience
                </button>
              </>
            )}

            {activeTab === 'education' && (
              <>
                {resumeData.education.map((edu, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', marginBottom: '10px', position: 'relative' }}>
                    <button onClick={() => removeItem('education', i)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                    {field('Degree / Course', edu.degree,      e => updateItem('education', i, { degree: e.target.value }))}
                    {field('Institution',     edu.institution, e => updateItem('education', i, { institution: e.target.value }))}
                    {field('Year / Period',   edu.year,        e => updateItem('education', i, { year: e.target.value }))}
                    {field('Description',     edu.description, e => updateItem('education', i, { description: e.target.value }), true)}
                  </div>
                ))}
                <button onClick={() => addItem('education', { degree: '', institution: '', year: '', description: '' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9933', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Plus size={14} /> Add Education
                </button>
              </>
            )}

            {activeTab === 'skills' && (
              <>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
                  One skill per line, or comma-separated.
                </p>
                <textarea
                  rows={8}
                  value={resumeData.skills.join('\n')}
                  onChange={e => setResumeData(d => ({
                    ...d,
                    skills: e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
                  }))}
                  placeholder="React&#10;Node.js&#10;Python&#10;SQL"
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
              </>
            )}

            {activeTab === 'projects' && (
              <>
                {resumeData.projects.map((p, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px', marginBottom: '10px', position: 'relative' }}>
                    <button onClick={() => removeItem('projects', i)}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                    {field('Project Title', p.title,       e => updateItem('projects', i, { title: e.target.value }))}
                    {field('Link (optional)', p.link,      e => updateItem('projects', i, { link: e.target.value }))}
                    {field('Description',  p.description, e => updateItem('projects', i, { description: e.target.value }), true)}
                  </div>
                ))}
                <button onClick={() => addItem('projects', { title: '', link: '', description: '' })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9933', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Plus size={14} /> Add Project
                </button>
              </>
            )}

            {activeTab === 'extras' && (
              <>
                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Certifications</p>
                {resumeData.certifications.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input value={typeof c === 'string' ? c : c.name || ''}
                      onChange={e => {
                        const arr = [...resumeData.certifications];
                        arr[i] = e.target.value;
                        setResumeData(d => ({ ...d, certifications: arr }));
                      }}
                      style={{ flex: 1, padding: '6px 9px', border: '1px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none' }}
                      placeholder="e.g. AWS Certified Developer" />
                    <button onClick={() => removeItem('certifications', i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addItem('certifications', '')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9933', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px' }}>
                  <Plus size={14} /> Add Certification
                </button>

                <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>Achievements</p>
                {resumeData.achievements.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input value={typeof a === 'string' ? a : a.title || ''}
                      onChange={e => {
                        const arr = [...resumeData.achievements];
                        arr[i] = e.target.value;
                        setResumeData(d => ({ ...d, achievements: arr }));
                      }}
                      style={{ flex: 1, padding: '6px 9px', border: '1px solid #e5e7eb', borderRadius: '7px', fontSize: '13px', outline: 'none' }}
                      placeholder="e.g. National hackathon winner" />
                    <button onClick={() => removeItem('achievements', i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addItem('achievements', '')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#FF9933', fontWeight: '600', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Plus size={14} /> Add Achievement
                </button>
              </>
            )}
          </div>

          {/* Download button */}
          <div style={{ padding: '14px 18px', borderTop: '1px solid #f3f4f6' }}>
            {accessDenied ? (
              <button
                onClick={() => setShowUpgrade(true)}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                  background: '#f3f4f6', color: '#6b7280', fontWeight: '700', fontSize: '14px',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                <Lock size={15} /> Upgrade to Download
              </button>
            ) : (
              <button
                onClick={handlePrint}
                disabled={printing}
                style={{
                  width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                  background: printing ? '#fdba74' : 'linear-gradient(135deg,#FF9933,#e68a2e)',
                  color: '#fff', fontWeight: '700', fontSize: '14px',
                  cursor: printing ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                {printing
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Preparing…</>
                  : <><Download size={15} /> Download PDF</>}
              </button>
            )}
            <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>
              Opens your browser's print dialog → Save as PDF
            </p>
          </div>
        </div>

        {/* ── RIGHT: Live preview ────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '820px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Live Preview
              </p>
              <p style={{ fontSize: '11px', color: '#9ca3af' }}>A4 · PDF-ready</p>
            </div>

            {/* Preview card — shadows simulate paper */}
            <div style={{
              background: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 10px 40px -5px rgba(0,0,0,.12)',
              borderRadius: '4px',
              overflow: accessDenied ? 'hidden' : 'visible',
              position: 'relative',
            }}>
              {accessDenied && (
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', zIndex: 10,
                }}>
                  <Lock size={36} style={{ color: '#FF9933', marginBottom: '12px' }} />
                  <p style={{ fontWeight: '700', fontSize: '16px', color: '#111', marginBottom: '6px' }}>Premium Template</p>
                  <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px', textAlign: 'center', maxWidth: '280px' }}>
                    Upgrade your plan to use the {templateMeta.name} template.
                  </p>
                  <button onClick={() => setShowUpgrade(true)}
                    style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#FF9933,#e68a2e)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
                    <Crown size={14} style={{ display: 'inline', marginRight: '6px' }} /> View Plans
                  </button>
                </div>
              )}
              <TemplateComponent data={resumeData} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* Wrap with SubscriptionProvider so UpgradeModal can use useSubscription */
const ResumeBuilder = () => (
  <SubscriptionProvider>
    <ResumeBuilderInner />
  </SubscriptionProvider>
);

export default ResumeBuilder;
