/**
 * ResumeBuilder — /resume-builder/:templateId
 *
 * Print architecture (portal-free, race-condition-free):
 *  - The TemplateComponent is rendered ONCE in the live-preview panel,
 *    always in the DOM, never display:none.
 *  - The preview wrapper carries id="resume-preview-printable".
 *  - @media print CSS (injected once into <head>) hides every body child
 *    EXCEPT #resume-preview-printable.
 *  - window.print() is called only after fonts + images are confirmed loaded.
 *  - No hidden portals, no display toggling, no async DOM races.
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Loader2, Plus, Trash2, Crown, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';
import { getTemplateById } from '../data/resumeTemplates';
import { TEMPLATE_MAP } from '../components/resumeTemplates/index';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import UpgradeModal from '../components/ui/UpgradeModal';
import Navbar from '../components/Navbar';

/* ─────────────────────────────────────────────────────────────────────────────
   PRINT STYLES — injected once into <head>.
   Key principle: hide everything except #resume-preview-printable.
   The element is ALWAYS in the DOM and always visible — no toggling needed.
───────────────────────────────────────────────────────────────────────────── */
const PRINT_STYLE_ID = 'resume-print-style-v3';

function ensurePrintStyles() {
  if (document.getElementById(PRINT_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      /* ── colour accuracy ── */
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* ── A4 page ── */
      @page {
        size: A4 portrait;
        margin: 0;
      }

      /* ── reset html/body ── */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        width: 210mm !important;
        height: auto !important;
        overflow: visible !important;
      }

      /*
       * CRITICAL FIX:
       * We must NOT use  parent { display:none }  then  child { display:block }
       * because CSS display:none on a parent CANNOT be overridden by a child —
       * the entire subtree is removed from layout regardless of child rules.
       *
       * Instead: hide specific known UI elements by their IDs/classes,
       * and keep the resume ancestor chain fully visible at every level.
       */

      /* Hide the editor left panel */
      #resume-editor-panel {
        display: none !important;
      }

      /* Flatten the flex layout so only the preview panel shows */
      #resume-main-layout {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        min-height: unset !important;
        background: #fff !important;
      }

      /* Hide the navbar */
      nav, header, [data-print-hide="true"] {
        display: none !important;
      }

      /* Hide the preview area chrome (labels, padding wrapper) */
      #resume-preview-chrome {
        display: none !important;
      }

      /* ── The preview panel itself becomes the page ── */
      #resume-preview-panel {
        display: block !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
        background: #fff !important;
        position: static !important;
        flex: none !important;
        align-items: unset !important;
      }

      /* ── Remove 840px cap during print ── */
      #resume-preview-inner {
        max-width: none !important;
        width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      /* ── The printable wrapper ── */
      #resume-preview-printable {
        display: block !important;
        position: static !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: auto !important;
        overflow: visible !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        background: #fff !important;
      }

      /* ── The template root div ── */
      #resume-print-root {
        width: 210mm !important;
        min-height: auto !important;
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        overflow: visible !important;
        display: table !important;
        table-layout: fixed !important;
      }

      /* ── Table cells (left/right columns) ── */
      #resume-print-root > * {
        display: table-cell !important;
        overflow: visible !important;
        height: auto !important;
      }

      /* ── Images ── */
      img {
        max-width: 100% !important;
        page-break-inside: avoid !important;
      }

      /* ── Upgrade overlay must be hidden ── */
      #resume-access-overlay {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
}

/* ─────────────────────────────────────────────────────────────────────────────
   Small reusable form field
───────────────────────────────────────────────────────────────────────────── */
const F = ({ label, value, onChange, multiline = false, placeholder = '' }) => (
  <div style={{ marginBottom: '10px' }}>
    <label style={{
      display: 'block', fontSize: '10px', fontWeight: '700', color: '#6b7280',
      marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
      {label}
    </label>
    {multiline
      ? <textarea rows={3} value={value || ''} onChange={onChange} placeholder={placeholder}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', color: '#111' }} />
      : <input type="text" value={value || ''} onChange={onChange} placeholder={placeholder}
          style={{ width: '100%', padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', color: '#111' }} />
    }
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Collapsible section card used for every repeatable item in the form
───────────────────────────────────────────────────────────────────────────── */
const ItemCard = ({ title, onRemove, children }) => {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title || '(untitled)'}
        </span>
        <button onClick={e => { e.stopPropagation(); onRemove(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 6px', display: 'flex' }}>
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={13} color="#9ca3af" /> : <ChevronDown size={13} color="#9ca3af" />}
      </div>
      {open && <div style={{ padding: '4px 10px 10px' }}>{children}</div>}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Add-item button
───────────────────────────────────────────────────────────────────────────── */
const AddBtn = ({ label, onClick }) => (
  <button onClick={onClick}
    style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#FF9933', fontWeight: '700', fontSize: '12px', background: 'none', border: '1.5px dashed #FF9933', borderRadius: '6px', cursor: 'pointer', padding: '6px 12px', width: '100%', justifyContent: 'center', marginTop: '4px' }}>
    <Plus size={13} /> {label}
  </button>
);

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */
const ResumeBuilderInner = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const templateMeta = getTemplateById(templateId);
  const TemplateComponent = TEMPLATE_MAP[templateId];

  const [accessLoading, setAccessLoading] = useState(true);
  const [accessDenied,  setAccessDenied]  = useState(false);
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basics');
  const [printing, setPrinting] = useState(false);

  /* ── Full resume data state ── */
  const [resumeData, setResumeData] = useState({
    /* basics */
    name: '', title: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '',
    photo: '', summary: '',
    /* arrays */
    experience:     [],
    internships:    [],
    education:      [],
    skills:         [],   // flat array of strings
    softSkills:     [],
    projects:       [],
    certifications: [],
    achievements:   [],
    training:       [],
    positions:      [],
    languages:      [],
    volunteering:   [],
  });

  /* ── 1. Access check ── */
  useEffect(() => {
    if (!templateMeta || !TemplateComponent) return;
    (async () => {
      try {
        await api.get(`/resume-templates/access/${templateId}`);
      } catch (err) {
        const status = err?.status ?? err?.response?.status;
        if (status === 403) { setAccessDenied(true); setShowUpgrade(true); }
        else if (status === 401) { navigate('/login'); return; }
      } finally { setAccessLoading(false); }
    })();
  }, [templateId, templateMeta, TemplateComponent, navigate]);

  /* ── 2. Pre-populate from profile ── */
  useEffect(() => {
    (async () => {
      try {
        const p = await api.get('/profile/me');
        setResumeData(prev => ({
          ...prev,
          name:     p.name     || '',
          email:    p.email    || '',
          phone:    p.phone    || '',
          location: p.university || '',
          skills:   Array.isArray(p.skills) ? p.skills : [],
          experience: Array.isArray(p.experience)
            ? p.experience.map(e => ({
                title: e.title || '', company: e.company || '',
                type: '', location: '', startDate: '', endDate: '',
                current: false, description: e.description || '',
              }))
            : [],
          projects: Array.isArray(p.projects)
            ? p.projects.map(pr => ({
                name: pr.title || '', type: '', role: '',
                description: pr.description || '', techStack: '',
                github: pr.link || '', demo: '',
                startDate: '', endDate: '',
              }))
            : [],
        }));
      } catch { /* non-fatal */ }
      finally { setProfileLoading(false); }
    })();
  }, []);

  /* ── 3. Print / PDF — portal-free ── */
  const handlePrint = async () => {
    if (printing) return;
    setPrinting(true);

    /* backend gate */
    try {
      await api.post('/resume-templates/validate-use', { templateId });
    } catch (err) {
      setPrinting(false);
      const status = err?.status ?? err?.response?.status;
      if (status === 403) { setAccessDenied(true); setShowUpgrade(true); }
      else toast.error('Unable to generate resume. Please try again.');
      return;
    }

    /* inject print CSS */
    ensurePrintStyles();

    /* find the always-visible preview element */
    const printable = document.getElementById('resume-preview-printable');
    if (!printable) {
      setPrinting(false);
      toast.error('Resume preview not found. Please refresh and try again.');
      console.error('[ResumeBuilder] #resume-preview-printable not found in DOM');
      return;
    }

    /* verify it has actual content */
    const rect = printable.getBoundingClientRect();
    const text = printable.innerText?.trim() || '';
    if (rect.width === 0 || rect.height === 0 || text.length < 5) {
      setPrinting(false);
      toast.error('Resume appears empty. Please fill in your details first.');
      console.error('[ResumeBuilder] printable element is empty or zero-size', { rect, textLen: text.length });
      return;
    }

    /* set filename */
    const originalTitle = document.title;
    document.title = `${(resumeData.name || 'Resume').replace(/\s+/g, '_')}_Resume`;

    /* wait for all images inside the printable to load */
    const images = Array.from(printable.querySelectorAll('img'));
    if (images.length > 0) {
      await Promise.all(images.map(img =>
        img.complete
          ? Promise.resolve()
          : new Promise(res => { img.onload = res; img.onerror = res; })
      ));
    }

    /* wait for fonts */
    try { await document.fonts.ready; } catch { /* ignore */ }

    /* one rAF to ensure layout is painted */
    await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

    /* print */
    try {
      window.print();
    } catch (printErr) {
      console.error('[ResumeBuilder] window.print() threw:', printErr);
      toast.error('Print failed. Please try again or use Ctrl+P.');
    }

    document.title = originalTitle;
    setPrinting(false);
  };

  /* ── array helpers ── */
  const add    = (key, blank) => setResumeData(d => ({ ...d, [key]: [...d[key], blank] }));
  const update = (key, i, patch) => setResumeData(d => ({
    ...d, [key]: d[key].map((it, idx) => idx === i ? { ...it, ...patch } : it),
  }));
  const remove = (key, i) => setResumeData(d => ({ ...d, [key]: d[key].filter((_, idx) => idx !== i) }));
  const set    = k => e => setResumeData(d => ({ ...d, [k]: e.target.value }));

  /* ── guards ── */
  if (!templateMeta || !TemplateComponent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#6b7280', marginBottom: '12px' }}>Template not found.</p>
          <button onClick={() => navigate('/resources/resume-templates')}
            style={{ color: '#FF9933', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Back to Templates
          </button>
        </div>
      </div>
    );
  }
  if (accessLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={32} style={{ color: '#FF9933', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  /* ── tab config ── */
  const TABS = [
    { id: 'basics',         label: 'Basics'      },
    { id: 'experience',     label: 'Experience'  },
    { id: 'internships',    label: 'Internships' },
    { id: 'education',      label: 'Education'   },
    { id: 'skills',         label: 'Skills'      },
    { id: 'projects',       label: 'Projects'    },
    { id: 'certifications', label: 'Certs'       },
    { id: 'achievements',   label: 'Awards'      },
    { id: 'training',       label: 'Training'    },
    { id: 'positions',      label: 'Positions'   },
    { id: 'languages',      label: 'Languages'   },
    { id: 'volunteering',   label: 'Volunteering'},
  ];

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div id="resume-page-root">
      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => { setShowUpgrade(false); if (accessDenied) navigate('/resources/resume-templates'); }}
        onSubscribed={() => { setShowUpgrade(false); setAccessDenied(false); window.location.reload(); }}
        featureLabel={`${templateMeta.name} template`}
      />

      <Navbar data-print-hide="true" />

      <div id="resume-main-layout" style={{
        display: 'flex', minHeight: 'calc(100vh - 64px)', marginTop: '64px',
        background: '#f1f5f9', fontFamily: 'Inter, system-ui, sans-serif',
      }}>

        {/* ══════════════ LEFT PANEL — Editor ══════════════ */}
        <div id="resume-editor-panel" style={{
          width: '380px', flexShrink: 0, background: '#fff',
          borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 64px)', position: 'sticky', top: '64px',
        }}>

          {/* header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button onClick={() => navigate('/resources/resume-templates')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: '600', padding: 0 }}>
              <ArrowLeft size={14} /> Templates
            </button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{templateMeta.name}</span>
            {templateMeta.access === 'PREMIUM' && (
              <span style={{ background: '#FF9933', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                <Crown size={8} style={{ display: 'inline', marginRight: '2px' }} />PREMIUM
              </span>
            )}
          </div>

          {/* tabs */}
          <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                padding: '8px 11px', fontSize: '11px', fontWeight: '600', border: 'none',
                background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                color: activeTab === t.id ? '#FF9933' : '#6b7280',
                borderBottom: activeTab === t.id ? '2px solid #FF9933' : '2px solid transparent',
              }}>{t.label}</button>
            ))}
          </div>

          {/* tab content — scrollable */}
          <div style={{ padding: '14px 16px', flex: 1, overflowY: 'auto' }}>
            {profileLoading && <p style={{ color: '#9ca3af', fontSize: '12px' }}>Loading profile…</p>}

            {/* ───── BASICS ───── */}
            {activeTab === 'basics' && (
              <>
                {/* Photo */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Profile Photo
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                      background: '#f3f4f6', border: '2px solid #e5e7eb', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {resumeData.photo
                        ? <img src={resumeData.photo} alt="photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '20px', color: '#9ca3af' }}>👤</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{
                        display: 'inline-block', padding: '5px 12px', borderRadius: '6px',
                        border: '1.5px solid #e5e7eb', background: '#f9fafb',
                        fontSize: '11px', fontWeight: '600', color: '#374151', cursor: 'pointer', marginBottom: '4px',
                      }}>
                        {resumeData.photo ? 'Change Photo' : 'Upload Photo'}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2 MB'); return; }
                            const reader = new FileReader();
                            reader.onload = ev => setResumeData(d => ({ ...d, photo: ev.target.result }));
                            reader.readAsDataURL(file);
                          }} />
                      </label>
                      {resumeData.photo && (
                        <button onClick={() => setResumeData(d => ({ ...d, photo: '' }))}
                          style={{ display: 'block', fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontWeight: '600' }}>
                          Remove
                        </button>
                      )}
                      <p style={{ fontSize: '10px', color: '#9ca3af', margin: '2px 0 0' }}>JPG/PNG, max 2 MB</p>
                    </div>
                  </div>
                </div>
                <F label="Full Name *"         value={resumeData.name}      onChange={set('name')}      placeholder="e.g. Priya Sharma" />
                <F label="Professional Title"  value={resumeData.title}     onChange={set('title')}     placeholder="e.g. Software Engineer" />
                <F label="Email *"             value={resumeData.email}     onChange={set('email')}     placeholder="priya@email.com" />
                <F label="Phone"               value={resumeData.phone}     onChange={set('phone')}     placeholder="+91 98765 43210" />
                <F label="Location"            value={resumeData.location}  onChange={set('location')}  placeholder="City, State" />
                <F label="LinkedIn URL"        value={resumeData.linkedin}  onChange={set('linkedin')}  placeholder="linkedin.com/in/username" />
                <F label="GitHub URL"          value={resumeData.github}    onChange={set('github')}    placeholder="github.com/username" />
                <F label="Portfolio / Website" value={resumeData.portfolio} onChange={set('portfolio')} placeholder="yoursite.com" />
                <F label="Professional Summary" value={resumeData.summary}  onChange={set('summary')}
                  multiline placeholder="2–4 lines describing your expertise, skills, and career goals…" />
              </>
            )}

            {/* ───── EXPERIENCE ───── */}
            {activeTab === 'experience' && (
              <>
                {resumeData.experience.map((exp, i) => (
                  <ItemCard key={i} title={exp.title || exp.company} onRemove={() => remove('experience', i)}>
                    <F label="Job Title *"       value={exp.title}       onChange={e => update('experience', i, { title: e.target.value })}       placeholder="Software Engineer" />
                    <F label="Company *"         value={exp.company}     onChange={e => update('experience', i, { company: e.target.value })}     placeholder="Google" />
                    <F label="Employment Type"   value={exp.type}        onChange={e => update('experience', i, { type: e.target.value })}        placeholder="Full-time / Part-time / Contract" />
                    <F label="Location"          value={exp.location}    onChange={e => update('experience', i, { location: e.target.value })}    placeholder="Bengaluru, India" />
                    <F label="Start Date"        value={exp.startDate}   onChange={e => update('experience', i, { startDate: e.target.value })}   placeholder="Jan 2022" />
                    <F label="End Date"          value={exp.endDate}     onChange={e => update('experience', i, { endDate: e.target.value })}     placeholder="Present" />
                    <F label="Responsibilities / Achievements" value={exp.description} onChange={e => update('experience', i, { description: e.target.value })} multiline placeholder="Key contributions, achievements, technologies used…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Experience" onClick={() => add('experience', { title: '', company: '', type: '', location: '', startDate: '', endDate: '', description: '' })} />
              </>
            )}

            {/* ───── INTERNSHIPS ───── */}
            {activeTab === 'internships' && (
              <>
                {resumeData.internships.map((int, i) => (
                  <ItemCard key={i} title={int.role || int.org} onRemove={() => remove('internships', i)}>
                    <F label="Internship Role *"  value={int.role}        onChange={e => update('internships', i, { role: e.target.value })}        placeholder="Frontend Developer Intern" />
                    <F label="Organization *"     value={int.org}         onChange={e => update('internships', i, { org: e.target.value })}          placeholder="Infosys" />
                    <F label="Internship Type"    value={int.type}        onChange={e => update('internships', i, { type: e.target.value })}         placeholder="Remote / On-site / Hybrid" />
                    <F label="Location"           value={int.location}    onChange={e => update('internships', i, { location: e.target.value })}     placeholder="Mumbai, India" />
                    <F label="Start Date"         value={int.startDate}   onChange={e => update('internships', i, { startDate: e.target.value })}    placeholder="Jun 2023" />
                    <F label="End Date"           value={int.endDate}     onChange={e => update('internships', i, { endDate: e.target.value })}      placeholder="Aug 2023" />
                    <F label="Technologies"       value={int.tech}        onChange={e => update('internships', i, { tech: e.target.value })}         placeholder="React, Node.js, MongoDB" />
                    <F label="Description"        value={int.description} onChange={e => update('internships', i, { description: e.target.value })} multiline placeholder="Responsibilities, projects, outcomes…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Internship" onClick={() => add('internships', { role: '', org: '', type: '', location: '', startDate: '', endDate: '', tech: '', description: '' })} />
              </>
            )}

            {/* ───── EDUCATION ───── */}
            {activeTab === 'education' && (
              <>
                {resumeData.education.map((edu, i) => (
                  <ItemCard key={i} title={edu.degree || edu.institution} onRemove={() => remove('education', i)}>
                    <F label="Degree / Course *"     value={edu.degree}      onChange={e => update('education', i, { degree: e.target.value })}      placeholder="B.Tech Computer Science" />
                    <F label="Institution *"         value={edu.institution} onChange={e => update('education', i, { institution: e.target.value })} placeholder="IIT Delhi" />
                    <F label="Field / Specialization" value={edu.field}      onChange={e => update('education', i, { field: e.target.value })}       placeholder="Artificial Intelligence" />
                    <F label="Start Date"            value={edu.startDate}   onChange={e => update('education', i, { startDate: e.target.value })}   placeholder="2020" />
                    <F label="End Date / Expected"   value={edu.endDate}     onChange={e => update('education', i, { endDate: e.target.value })}     placeholder="2024" />
                    <F label="CGPA / GPA"            value={edu.cgpa}        onChange={e => update('education', i, { cgpa: e.target.value })}        placeholder="8.5 / 10" />
                    <F label="Percentage"            value={edu.percentage}  onChange={e => update('education', i, { percentage: e.target.value })}  placeholder="85%" />
                    <F label="Location"              value={edu.location}    onChange={e => update('education', i, { location: e.target.value })}    placeholder="New Delhi" />
                    <F label="Relevant Coursework"   value={edu.coursework}  onChange={e => update('education', i, { coursework: e.target.value })}  multiline placeholder="Data Structures, Algorithms, DBMS…" />
                    <F label="Academic Highlights"   value={edu.highlights}  onChange={e => update('education', i, { highlights: e.target.value })}  multiline placeholder="Achievements, awards, rank…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Education" onClick={() => add('education', { degree: '', institution: '', field: '', startDate: '', endDate: '', cgpa: '', percentage: '', location: '', coursework: '', highlights: '' })} />
              </>
            )}

            {/* ───── SKILLS ───── */}
            {activeTab === 'skills' && (
              <>
                <p style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px', lineHeight: '1.5' }}>
                  Enter one skill per line (or comma-separated). Add all technical skills here.
                </p>
                <textarea
                  rows={10}
                  value={resumeData.skills.join('\n')}
                  onChange={e => setResumeData(d => ({
                    ...d,
                    skills: e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
                  }))}
                  placeholder={'React\nNode.js\nPython\nMySQL\nDocker\nAWS'}
                  style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                />
                <div style={{ marginTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Soft Skills
                  </label>
                  <textarea
                    rows={4}
                    value={resumeData.softSkills.join('\n')}
                    onChange={e => setResumeData(d => ({
                      ...d,
                      softSkills: e.target.value.split(/[\n,]+/).map(s => s.trim()).filter(Boolean),
                    }))}
                    placeholder={'Leadership\nTeam collaboration\nCommunication'}
                    style={{ width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </>
            )}

            {/* ───── PROJECTS ───── */}
            {activeTab === 'projects' && (
              <>
                {resumeData.projects.map((p, i) => (
                  <ItemCard key={i} title={p.name} onRemove={() => remove('projects', i)}>
                    <F label="Project Name *"   value={p.name}        onChange={e => update('projects', i, { name: e.target.value })}        placeholder="AI Resume Parser" />
                    <F label="Role"             value={p.role}        onChange={e => update('projects', i, { role: e.target.value })}        placeholder="Lead Developer" />
                    <F label="Tech Stack"       value={p.techStack}   onChange={e => update('projects', i, { techStack: e.target.value })}   placeholder="React, FastAPI, OpenAI" />
                    <F label="Description *"    value={p.description} onChange={e => update('projects', i, { description: e.target.value })} multiline placeholder="What the project does, your contribution, results…" />
                    <F label="Start Date"       value={p.startDate}   onChange={e => update('projects', i, { startDate: e.target.value })}   placeholder="Jan 2024" />
                    <F label="End Date"         value={p.endDate}     onChange={e => update('projects', i, { endDate: e.target.value })}     placeholder="Mar 2024" />
                    <F label="GitHub URL"       value={p.github}      onChange={e => update('projects', i, { github: e.target.value })}      placeholder="github.com/user/project" />
                    <F label="Live Demo URL"    value={p.demo}        onChange={e => update('projects', i, { demo: e.target.value })}        placeholder="project.vercel.app" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Project" onClick={() => add('projects', { name: '', role: '', description: '', techStack: '', startDate: '', endDate: '', github: '', demo: '' })} />
              </>
            )}

            {/* ───── CERTIFICATIONS ───── */}
            {activeTab === 'certifications' && (
              <>
                {resumeData.certifications.map((c, i) => (
                  <ItemCard key={i} title={c.name} onRemove={() => remove('certifications', i)}>
                    <F label="Certification Name *"  value={c.name}        onChange={e => update('certifications', i, { name: e.target.value })}        placeholder="AWS Certified Solutions Architect" />
                    <F label="Issuing Organization"  value={c.issuer}      onChange={e => update('certifications', i, { issuer: e.target.value })}      placeholder="Amazon Web Services" />
                    <F label="Issue Date"            value={c.issueDate}   onChange={e => update('certifications', i, { issueDate: e.target.value })}   placeholder="Mar 2024" />
                    <F label="Expiry Date"           value={c.expiryDate}  onChange={e => update('certifications', i, { expiryDate: e.target.value })}  placeholder="Mar 2027 / No Expiry" />
                    <F label="Credential ID"         value={c.credId}      onChange={e => update('certifications', i, { credId: e.target.value })}      placeholder="ABC-123456" />
                    <F label="Credential URL"        value={c.credUrl}     onChange={e => update('certifications', i, { credUrl: e.target.value })}     placeholder="credly.com/badges/…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Certification" onClick={() => add('certifications', { name: '', issuer: '', issueDate: '', expiryDate: '', credId: '', credUrl: '' })} />
              </>
            )}

            {/* ───── ACHIEVEMENTS ───── */}
            {activeTab === 'achievements' && (
              <>
                {resumeData.achievements.map((a, i) => (
                  <ItemCard key={i} title={a.title} onRemove={() => remove('achievements', i)}>
                    <F label="Achievement *"   value={a.title}        onChange={e => update('achievements', i, { title: e.target.value })}       placeholder="National Hackathon Winner" />
                    <F label="Organization"    value={a.org}          onChange={e => update('achievements', i, { org: e.target.value })}         placeholder="HackerEarth" />
                    <F label="Date"            value={a.date}         onChange={e => update('achievements', i, { date: e.target.value })}        placeholder="Oct 2023" />
                    <F label="Prize / Award"   value={a.prize}        onChange={e => update('achievements', i, { prize: e.target.value })}       placeholder="₹1,00,000 cash prize" />
                    <F label="Description"     value={a.description}  onChange={e => update('achievements', i, { description: e.target.value })} multiline placeholder="Details about the achievement…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Achievement" onClick={() => add('achievements', { title: '', org: '', date: '', prize: '', description: '' })} />
              </>
            )}

            {/* ───── TRAINING ───── */}
            {activeTab === 'training' && (
              <>
                {resumeData.training.map((t, i) => (
                  <ItemCard key={i} title={t.name} onRemove={() => remove('training', i)}>
                    <F label="Training / Course Name *" value={t.name}        onChange={e => update('training', i, { name: e.target.value })}         placeholder="Machine Learning Specialization" />
                    <F label="Organization"             value={t.org}         onChange={e => update('training', i, { org: e.target.value })}          placeholder="Coursera / deeplearning.ai" />
                    <F label="Duration"                 value={t.duration}    onChange={e => update('training', i, { duration: e.target.value })}      placeholder="3 months" />
                    <F label="Date Completed"           value={t.date}        onChange={e => update('training', i, { date: e.target.value })}          placeholder="Dec 2023" />
                    <F label="Skills Learned"           value={t.skills}      onChange={e => update('training', i, { skills: e.target.value })}        placeholder="Python, TensorFlow, Neural Networks" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Training" onClick={() => add('training', { name: '', org: '', duration: '', date: '', skills: '' })} />
              </>
            )}

            {/* ───── POSITIONS ───── */}
            {activeTab === 'positions' && (
              <>
                {resumeData.positions.map((p, i) => (
                  <ItemCard key={i} title={p.position || p.org} onRemove={() => remove('positions', i)}>
                    <F label="Position *"       value={p.position}    onChange={e => update('positions', i, { position: e.target.value })}    placeholder="Vice President" />
                    <F label="Organization *"   value={p.org}         onChange={e => update('positions', i, { org: e.target.value })}         placeholder="Google Developer Student Club" />
                    <F label="Duration"         value={p.duration}    onChange={e => update('positions', i, { duration: e.target.value })}    placeholder="Aug 2022 – Jun 2023" />
                    <F label="Responsibilities" value={p.description} onChange={e => update('positions', i, { description: e.target.value })} multiline placeholder="Led team of 20, organized events…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Position" onClick={() => add('positions', { position: '', org: '', duration: '', description: '' })} />
              </>
            )}

            {/* ───── LANGUAGES ───── */}
            {activeTab === 'languages' && (
              <>
                {resumeData.languages.map((l, i) => (
                  <ItemCard key={i} title={l.language} onRemove={() => remove('languages', i)}>
                    <F label="Language *"    value={l.language}    onChange={e => update('languages', i, { language: e.target.value })}    placeholder="Hindi" />
                    <F label="Proficiency"   value={l.proficiency} onChange={e => update('languages', i, { proficiency: e.target.value })} placeholder="Native / Fluent / Intermediate / Basic" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Language" onClick={() => add('languages', { language: '', proficiency: '' })} />
              </>
            )}

            {/* ───── VOLUNTEERING ───── */}
            {activeTab === 'volunteering' && (
              <>
                {resumeData.volunteering.map((v, i) => (
                  <ItemCard key={i} title={v.role || v.org} onRemove={() => remove('volunteering', i)}>
                    <F label="Role *"          value={v.role}        onChange={e => update('volunteering', i, { role: e.target.value })}        placeholder="Volunteer Tutor" />
                    <F label="Organization *"  value={v.org}         onChange={e => update('volunteering', i, { org: e.target.value })}         placeholder="Teach For India" />
                    <F label="Date / Duration" value={v.date}        onChange={e => update('volunteering', i, { date: e.target.value })}        placeholder="Jun 2022 – Present" />
                    <F label="Description"     value={v.description} onChange={e => update('volunteering', i, { description: e.target.value })} multiline placeholder="Impact, activities…" />
                  </ItemCard>
                ))}
                <AddBtn label="Add Volunteering" onClick={() => add('volunteering', { role: '', org: '', date: '', description: '' })} />
              </>
            )}
          </div>

          {/* ── Download button ── */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f3f4f6', flexShrink: 0 }}>
            {accessDenied ? (
              <button onClick={() => setShowUpgrade(true)} style={{
                width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                background: '#f3f4f6', color: '#6b7280', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              }}>
                <Lock size={14} /> Upgrade to Download
              </button>
            ) : (
              <button onClick={handlePrint} disabled={printing} style={{
                width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
                background: printing ? '#fdba74' : 'linear-gradient(135deg,#FF9933,#e68a2e)',
                color: '#fff', fontWeight: '700', fontSize: '13px',
                cursor: printing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              }}>
                {printing
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Preparing PDF…</>
                  : <><Download size={14} /> Download PDF</>}
              </button>
            )}
            <p style={{ textAlign: 'center', fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
              Opens browser print dialog → Save as PDF
            </p>
          </div>
        </div>

        {/* ══════════════ RIGHT PANEL — Live Preview ══════════════ */}
        <div id="resume-preview-panel" style={{ flex: 1, overflowY: 'auto', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div id="resume-preview-inner" style={{ width: '100%', maxWidth: '840px' }}>
            <div id="resume-preview-chrome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Live Preview
              </p>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>A4 · PDF-ready</p>
            </div>

            {/*
              ╔══════════════════════════════════════════════════════╗
              ║  #resume-preview-printable                           ║
              ║  This element is ALWAYS in the DOM and visible.      ║
              ║  @media print hides everything EXCEPT this.          ║
              ║  No display toggling. No portals. No race condition.  ║
              ╚══════════════════════════════════════════════════════╝
            */}
            <div
              id="resume-preview-printable"
              style={{
                background: '#fff',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 10px 40px -5px rgba(0,0,0,.12)',
                borderRadius: '4px',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              {accessDenied && (
                <div id="resume-access-overlay" style={{
                  position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)',
                  backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', zIndex: 10, borderRadius: '4px',
                }}>
                  <Lock size={32} style={{ color: '#FF9933', marginBottom: '10px' }} />
                  <p style={{ fontWeight: '700', fontSize: '15px', color: '#111', marginBottom: '4px' }}>Premium Template</p>
                  <p style={{ color: '#6b7280', fontSize: '12px', marginBottom: '14px', textAlign: 'center', maxWidth: '260px' }}>
                    Upgrade to use the {templateMeta.name} template.
                  </p>
                  <button onClick={() => setShowUpgrade(true)}
                    style={{ padding: '9px 22px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#FF9933,#e68a2e)', color: '#fff', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
                    <Crown size={13} style={{ display: 'inline', marginRight: '5px' }} /> View Plans
                  </button>
                </div>
              )}

              {/* THE TEMPLATE — always rendered, always in DOM */}
              <TemplateComponent data={resumeData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResumeBuilder = () => (
  <SubscriptionProvider>
    <ResumeBuilderInner />
  </SubscriptionProvider>
);

export default ResumeBuilder;
