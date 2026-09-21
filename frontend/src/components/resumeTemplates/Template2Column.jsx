/**
 * Template: 2-Column Professional
 *
 * PRINT FIX NOTES:
 *  - Root div uses width:210mm, minHeight:auto — NOT 100vh (which causes blank pages)
 *  - id="resume-print-root" on the outermost div (targeted by @media print CSS)
 *  - All sections only render when data exists — no empty sections creating whitespace
 *  - 2-column layout uses CSS table/inline-block, NOT flexbox on root
 *    (flexbox root can confuse some print renderers)
 *  - Colors use -webkit-print-color-adjust: exact via global print CSS
 *
 * LAYOUT:
 *  LEFT  (35%): Photo · Contact · Skills · Soft Skills · Languages · Certs · Volunteering
 *  RIGHT (65%): Name · Summary · Experience · Internships · Education · Projects ·
 *               Achievements · Training · Certifications · Positions
 */
import React from 'react';

/* ── Design tokens ──────────────────────────────────────────────────────── */
const C = {
  dark:       '#1e2a3a',   // left column bg
  accent:     '#FF9933',   // brand orange
  white:      '#ffffff',
  rightBg:    '#ffffff',
  textDark:   '#1a1a1a',
  textMid:    '#374151',
  textLight:  '#6b7280',
  border:     '#e5e7eb',
  skillBg:    'rgba(255,255,255,0.13)',
};

const PT = '10pt';     // base font size
const FONT = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

/* ── Shared sub-components ─────────────────────────────────────────────── */

/** Section heading for the RIGHT column */
const RSection = ({ title }) => (
  <div style={{
    fontSize: '8pt',
    fontWeight: '800',
    color: C.dark,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: `2px solid ${C.accent}`,
    paddingBottom: '3px',
    marginBottom: '8px',
    marginTop: '14px',
    /* Keep heading glued to whatever comes directly after it */
    breakAfter: 'avoid',
    pageBreakAfter: 'avoid',
  }}>
    {title}
  </div>
);

/** Section heading for the LEFT column */
const LSection = ({ title }) => (
  <div style={{
    fontSize: '7.5pt',
    fontWeight: '800',
    color: C.accent,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    borderBottom: `1px solid rgba(255,153,51,0.45)`,
    paddingBottom: '3px',
    marginBottom: '7px',
    marginTop: '13px',
  }}>
    {title}
  </div>
);

/** A row with title + optional right-aligned date */
const EntryHeader = ({ title, sub, date, location }) => (
  <div style={{ marginBottom: '2px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
      <span style={{ fontSize: '9.5pt', fontWeight: '700', color: C.dark, lineHeight: '1.3' }}>{title}</span>
      {date && <span style={{ fontSize: '8pt', color: C.textLight, whiteSpace: 'nowrap', flexShrink: 0, fontStyle: 'italic' }}>{date}</span>}
    </div>
    {(sub || location) && (
      <div style={{ fontSize: '8.5pt', color: C.accent, fontWeight: '600', marginTop: '1px' }}>
        {sub}{sub && location ? ' · ' : ''}{location && <span style={{ color: C.textLight, fontWeight: '400' }}>{location}</span>}
      </div>
    )}
  </div>
);

const Bullet = ({ text }) => (
  <div style={{ fontSize: '8.5pt', color: C.textMid, lineHeight: '1.45', marginTop: '3px', paddingLeft: '10px', position: 'relative' }}>
    <span style={{ position: 'absolute', left: 0, top: '0.5px', color: C.accent, fontSize: '7pt' }}>▸</span>
    {text}
  </div>
);

const Divider = () => (
  <div style={{ borderBottom: `0.5px solid ${C.border}`, margin: '8px 0' }} />
);

/* ── Helper: convert flat description to bullet lines ─────────────────── */
const descBullets = (text) => {
  if (!text) return null;
  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  return lines.map((line, i) => <Bullet key={i} text={line} />);
};

/* ── Safe array getter ──────────────────────────────────────────────────── */
const arr = (v) => (Array.isArray(v) ? v : []);

/* ══════════════════════════════════════════════════════════════════════════
   MAIN TEMPLATE
══════════════════════════════════════════════════════════════════════════ */
const Template2Column = ({ data = {} }) => {
  const {
    name = '', title = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '', photo = '', summary = '',
  } = data;

  const experience     = arr(data.experience);
  const internships    = arr(data.internships);
  const education      = arr(data.education);
  const skills         = arr(data.skills);
  const softSkills     = arr(data.softSkills);
  const projects       = arr(data.projects);
  const certifications = arr(data.certifications);
  const achievements   = arr(data.achievements);
  const training       = arr(data.training);
  const positions      = arr(data.positions);
  const languages      = arr(data.languages);
  const volunteering   = arr(data.volunteering);

  /* helper: format date range */
  const dateRange = (start, end, current) => {
    if (!start && !end) return '';
    if (current) return `${start} – Present`;
    return [start, end].filter(Boolean).join(' – ');
  };

  return (
    /*
     * CRITICAL: width = 210mm (A4), minHeight = auto.
     * Do NOT use 100vh — viewport is undefined during print rendering.
     * Use display:table on root to make both columns full-height naturally.
     */
    <div
      id="resume-print-root"
      style={{
        fontFamily: FONT,
        fontSize: PT,
        color: C.textDark,
        width: '210mm',
        minHeight: 'auto',
        background: C.white,
        display: 'table',
        tableLayout: 'fixed',
        boxSizing: 'border-box',
        lineHeight: '1.4',
      }}
    >
      {/* ════════ LEFT COLUMN ════════ */}
      <div style={{
        display: 'table-cell',
        width: '35%',
        background: C.dark,
        color: C.white,
        padding: '28px 18px 28px 18px',
        verticalAlign: 'top',
        boxSizing: 'border-box',
      }}>

        {/* ── Photo ── */}
        {photo && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img
              src={photo}
              alt={name}
              style={{
                width: '90px', height: '90px', borderRadius: '50%',
                objectFit: 'cover', border: `3px solid ${C.accent}`,
                display: 'block', margin: '0 auto',
              }}
            />
          </div>
        )}

        {/* ── Name (mobile-fallback in left col) ── */}
        {/* Name rendered in right column header. Left shows initials if no photo */}
        {!photo && (name) && (
          <div style={{ textAlign: 'center', marginBottom: '14px' }}>
            <div style={{
              width: '68px', height: '68px', borderRadius: '50%',
              background: C.accent, margin: '0 auto 8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20pt', fontWeight: '800', color: C.white,
            }}>
              {name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* ── Contact ── */}
        {(email || phone || location || linkedin || github || portfolio) && (
          <div>
            <LSection title="Contact" />
            {email && <ContactRow icon="✉" text={email} />}
            {phone && <ContactRow icon="📞" text={phone} />}
            {location && <ContactRow icon="📍" text={location} />}
            {linkedin && <ContactRow icon="in" text={linkedin} mono />}
            {github && <ContactRow icon="gh" text={github} mono />}
            {portfolio && <ContactRow icon="🌐" text={portfolio} mono />}
          </div>
        )}

        {/* ── Technical Skills ── */}
        {skills.length > 0 && (
          <div>
            <LSection title="Technical Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {skills.map((s, i) => (
                <span key={i} style={{
                  background: C.skillBg, color: C.white,
                  border: '0.5px solid rgba(255,255,255,0.25)',
                  padding: '2px 7px', borderRadius: '3px',
                  fontSize: '7.5pt', fontWeight: '500',
                  display: 'inline-block',
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── Soft Skills ── */}
        {softSkills.length > 0 && (
          <div>
            <LSection title="Soft Skills" />
            {softSkills.map((s, i) => (
              <div key={i} style={{ fontSize: '8pt', marginBottom: '3px', paddingLeft: '8px', position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: C.accent }}>▸</span>
                {s}
              </div>
            ))}
          </div>
        )}

        {/* ── Languages ── */}
        {languages.length > 0 && (
          <div>
            <LSection title="Languages" />
            {languages.map((l, i) => {
              const lang = typeof l === 'string' ? l : l.language || '';
              const prof = typeof l === 'string' ? '' : l.proficiency || '';
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600' }}>{lang}</span>
                  {prof && <span style={{ opacity: 0.75, fontStyle: 'italic' }}>{prof}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Certifications ── */}
        {certifications.length > 0 && (
          <div>
            <LSection title="Certifications" />
            {certifications.map((c, i) => {
              const cname      = typeof c === 'string' ? c : c.name       || '';
              const cissuer    = typeof c === 'object' ? c.issuer         || '' : '';
              const cdate      = typeof c === 'object' ? c.issueDate      || '' : '';
              const cexpiry    = typeof c === 'object' ? c.expiryDate     || '' : '';
              const ccredUrl   = typeof c === 'object' ? c.credUrl        || '' : '';
              const ccredId    = typeof c === 'object' ? c.credId         || '' : '';
              return (
                <div key={i} style={{ fontSize: '8pt', marginBottom: '7px' }}>
                  <div style={{ fontWeight: '700', lineHeight: '1.3' }}>{cname}</div>
                  {cissuer && <div style={{ opacity: 0.8, fontSize: '7.5pt', marginTop: '1px' }}>{cissuer}</div>}
                  {(cdate || cexpiry) && (
                    <div style={{ opacity: 0.65, fontSize: '7pt', marginTop: '1px', fontStyle: 'italic' }}>
                      {cdate}{cdate && cexpiry ? ' – ' : ''}{cexpiry}
                    </div>
                  )}
                  {ccredId && (
                    <div style={{ opacity: 0.65, fontSize: '7pt', marginTop: '1px' }}>
                      ID: {ccredId}
                    </div>
                  )}
                  {ccredUrl && (
                    <div style={{ opacity: 0.7, fontSize: '7pt', marginTop: '1px', wordBreak: 'break-all' }}>
                      🔗 {ccredUrl}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Volunteering ── */}
        {volunteering.length > 0 && (
          <div>
            <LSection title="Volunteering" />
            {volunteering.map((v, i) => {
              const role = typeof v === 'string' ? v    : v.role || '';
              const org  = typeof v === 'object' ? v.org  || '' : '';
              const date = typeof v === 'object' ? v.date || '' : '';
              const desc = typeof v === 'object' ? v.description || '' : '';
              return (
                <div key={i} style={{ fontSize: '8pt', marginBottom: '7px' }}>
                  <div style={{ fontWeight: '700' }}>{role}</div>
                  {org  && <div style={{ opacity: 0.8, fontSize: '7.5pt', marginTop: '1px' }}>{org}</div>}
                  {date && <div style={{ opacity: 0.65, fontSize: '7pt', fontStyle: 'italic', marginTop: '1px' }}>{date}</div>}
                  {desc && <div style={{ opacity: 0.85, fontSize: '7.5pt', marginTop: '2px', lineHeight: '1.35' }}>{desc}</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════ RIGHT COLUMN ════════ */}
      <div style={{
        display: 'table-cell',
        width: '65%',
        background: C.rightBg,
        padding: '28px 22px 28px 22px',
        verticalAlign: 'top',
        boxSizing: 'border-box',
      }}>

        {/* ── Header: Name + Title + Summary ── */}
        <div style={{ borderBottom: `3px solid ${C.accent}`, paddingBottom: '10px', marginBottom: '4px' }}>
          <h1 style={{
            fontSize: '20pt', fontWeight: '900', color: C.dark,
            margin: '0 0 2px', letterSpacing: '-0.02em', lineHeight: '1.15',
          }}>
            {name || 'Your Name'}
          </h1>
          {title && (
            <div style={{ fontSize: '10.5pt', color: C.accent, fontWeight: '700', marginBottom: '6px', letterSpacing: '0.02em' }}>
              {title}
            </div>
          )}
          {summary && (
            <p style={{ fontSize: '8.5pt', color: C.textMid, margin: '0', lineHeight: '1.5', fontStyle: 'italic' }}>
              {summary}
            </p>
          )}
        </div>

        {/* ── Experience ── */}
        {experience.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Work Experience" />
            {/* First entry is wrapped with heading to prevent orphan heading */}
            {experience.map((exp, i) => (
              <div key={i} style={{
                marginBottom: '10px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                /* First entry must not be separated from the heading above */
                breakBefore: i === 0 ? 'avoid' : 'auto',
                pageBreakBefore: i === 0 ? 'avoid' : 'auto',
              }}>
                <EntryHeader
                  title={exp.title || ''}
                  sub={exp.company || ''}
                  date={dateRange(exp.startDate, exp.endDate, exp.current) || exp.duration || ''}
                  location={[exp.type, exp.location].filter(Boolean).join(' · ')}
                />
                {descBullets(exp.description)}
                {i < experience.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}

        {/* ── Internships ── */}
        {internships.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Internships" />
            {internships.map((int, i) => (
              <div key={i} style={{
                marginBottom: '10px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                breakBefore: i === 0 ? 'avoid' : 'auto',
                pageBreakBefore: i === 0 ? 'avoid' : 'auto',
              }}>
                <EntryHeader
                  title={int.role || int.title || ''}
                  sub={int.org || int.company || ''}
                  date={dateRange(int.startDate, int.endDate, int.current) || int.duration || ''}
                  location={[int.type, int.location].filter(Boolean).join(' · ')}
                />
                {int.tech && (
                  <div style={{ fontSize: '7.5pt', color: C.textLight, marginTop: '2px', fontStyle: 'italic' }}>
                    Tech: {int.tech}
                  </div>
                )}
                {descBullets(int.description)}
                {i < internships.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}

        {/* ── Education ── */}
        {education.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Education" />
            {education.map((edu, i) => (
              <div key={i} style={{
                marginBottom: '10px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                breakBefore: i === 0 ? 'avoid' : 'auto',
                pageBreakBefore: i === 0 ? 'avoid' : 'auto',
              }}>
                <EntryHeader
                  title={edu.degree || edu.title || ''}
                  sub={edu.institution || edu.company || ''}
                  date={[edu.startDate, edu.endDate].filter(Boolean).join(' – ') || edu.year || ''}
                  location={edu.location || ''}
                />
                {(edu.field) && (
                  <div style={{ fontSize: '8pt', color: C.textMid, marginTop: '2px' }}>
                    {edu.field}
                  </div>
                )}
                {(edu.cgpa || edu.percentage) && (
                  <div style={{ fontSize: '8pt', color: C.textMid, marginTop: '2px' }}>
                    {edu.cgpa ? `CGPA: ${edu.cgpa}` : ''}
                    {edu.cgpa && edu.percentage ? '  |  ' : ''}
                    {edu.percentage ? `${edu.percentage}` : ''}
                  </div>
                )}
                {edu.coursework && (
                  <div style={{ fontSize: '7.5pt', color: C.textLight, marginTop: '3px', fontStyle: 'italic', lineHeight: '1.4' }}>
                    Coursework: {edu.coursework}
                  </div>
                )}
                {edu.highlights && (
                  <div style={{ fontSize: '7.5pt', color: C.textMid, marginTop: '2px' }}>
                    {edu.highlights}
                  </div>
                )}
                {i < education.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}

        {/* ── Projects ── */}
        {projects.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Projects" />
            {projects.map((p, i) => (
              <div key={i} style={{
                marginBottom: '10px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                breakBefore: i === 0 ? 'avoid' : 'auto',
                pageBreakBefore: i === 0 ? 'avoid' : 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ fontSize: '9.5pt', fontWeight: '700', color: C.dark }}>
                    {p.name || p.title || ''}
                  </span>
                  {(p.startDate || p.endDate) && (
                    <span style={{ fontSize: '8pt', color: C.textLight, whiteSpace: 'nowrap', fontStyle: 'italic' }}>
                      {[p.startDate, p.endDate].filter(Boolean).join(' – ')}
                    </span>
                  )}
                </div>
                {p.role && <div style={{ fontSize: '8.5pt', color: C.accent, fontWeight: '600' }}>{p.role}</div>}
                {p.techStack && (
                  <div style={{ fontSize: '7.5pt', color: C.textLight, marginTop: '2px', fontStyle: 'italic' }}>
                    {p.techStack}
                  </div>
                )}
                {descBullets(p.description)}
                {(p.github || p.demo) && (
                  <div style={{ fontSize: '7.5pt', color: C.accent, marginTop: '3px' }}>
                    {p.github && <span style={{ marginRight: '10px' }}>⎇ {p.github}</span>}
                    {p.demo  && <span>🔗 {p.demo}</span>}
                  </div>
                )}
                {i < projects.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}

        {/* ── Achievements ── */}
        {achievements.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Achievements" />
            {achievements.map((a, i) => {
              const atitle = typeof a === 'string' ? a : a.title || '';
              const aorg   = typeof a === 'object' ? a.org   || '' : '';
              const adate  = typeof a === 'object' ? a.date  || '' : '';
              const aprize = typeof a === 'object' ? a.prize || '' : '';
              const adesc  = typeof a === 'object' ? a.description || '' : '';
              return (
                <div key={i} style={{
                  marginBottom: '7px',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                  breakBefore: i === 0 ? 'avoid' : 'auto',
                  pageBreakBefore: i === 0 ? 'avoid' : 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '8.5pt', fontWeight: '700', color: C.dark }}>{atitle}</span>
                    {adate && <span style={{ fontSize: '7.5pt', color: C.textLight, whiteSpace: 'nowrap' }}>{adate}</span>}
                  </div>
                  {(aorg || aprize) && (
                    <div style={{ fontSize: '8pt', color: C.accent, fontWeight: '600' }}>
                      {aorg}{aorg && aprize ? ' · ' : ''}{aprize}
                    </div>
                  )}
                  {adesc && <div style={{ fontSize: '8pt', color: C.textMid, marginTop: '2px' }}>{adesc}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Training ── */}
        {training.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Training & Courses" />
            {training.map((t, i) => {
              const tname     = typeof t === 'string' ? t : t.name     || '';
              const torg      = typeof t === 'object' ? t.org          || '' : '';
              const tduration = typeof t === 'object' ? t.duration     || '' : '';
              const tdate     = typeof t === 'object' ? t.date         || '' : '';
              const tsk       = typeof t === 'object' ? t.skills       || '' : '';
              const tdisplay  = [tduration, tdate].filter(Boolean).join(' · ');
              return (
                <div key={i} style={{
                  marginBottom: '6px',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                  breakBefore: i === 0 ? 'avoid' : 'auto',
                  pageBreakBefore: i === 0 ? 'avoid' : 'auto',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '8.5pt', fontWeight: '700', color: C.dark }}>{tname}</span>
                    {tdisplay && <span style={{ fontSize: '7.5pt', color: C.textLight, whiteSpace: 'nowrap', fontStyle: 'italic' }}>{tdisplay}</span>}
                  </div>
                  {torg && <div style={{ fontSize: '8pt', color: C.accent, fontWeight: '600' }}>{torg}</div>}
                  {tsk  && <div style={{ fontSize: '7.5pt', color: C.textLight, fontStyle: 'italic' }}>{tsk}</div>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Positions of Responsibility ── */}
        {positions.length > 0 && (
          <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <RSection title="Positions of Responsibility" />
            {positions.map((p, i) => (
              <div key={i} style={{
                marginBottom: '9px',
                breakInside: 'avoid',
                pageBreakInside: 'avoid',
                breakBefore: i === 0 ? 'avoid' : 'auto',
                pageBreakBefore: i === 0 ? 'avoid' : 'auto',
              }}>
                <EntryHeader
                  title={p.position || p.title || ''}
                  sub={p.org || p.organization || ''}
                  date={p.duration || ''}
                />
                {descBullets(p.description)}
                {i < positions.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

/* ── Contact row helper ─────────────────────────────────────────────────── */
const ContactRow = ({ icon, text, mono = false }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '5px',
    fontSize: '7.5pt', marginBottom: '4px', wordBreak: 'break-all', lineHeight: '1.35',
  }}>
    <span style={{ flexShrink: 0, opacity: 0.85, minWidth: '14px', marginTop: '0.5px' }}>{icon}</span>
    <span style={{ fontFamily: mono ? 'monospace' : 'inherit', opacity: 0.9 }}>{text}</span>
  </div>
);

/* ── Preview thumbnail for template gallery ─────────────────────────────── */
export const PreviewThumbnail = ({ template }) => (
  <div style={{
    width: '100%', aspectRatio: '3/4', borderRadius: '8px',
    overflow: 'hidden', display: 'flex',
  }}>
    <div style={{ width: '35%', background: '#1e2a3a', padding: '8px 6px' }}>
      <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FF9933', margin: '0 auto 7px' }} />
      {[90, 70, 80, 60].map((w, i) => (
        <div key={i} style={{ height: '2px', background: 'rgba(255,255,255,0.2)', borderRadius: '1px', marginBottom: '4px', width: `${w}%` }} />
      ))}
      <div style={{ height: '1px', background: 'rgba(255,153,51,0.4)', margin: '7px 0 5px' }} />
      {[65, 85, 50].map((w, i) => (
        <div key={i} style={{ height: '6px', background: 'rgba(255,255,255,0.12)', borderRadius: '2px', marginBottom: '3px', width: `${w}%` }} />
      ))}
    </div>
    <div style={{ width: '65%', background: '#fff', padding: '8px 7px' }}>
      <div style={{ height: '5px', background: '#1e2a3a', borderRadius: '2px', marginBottom: '3px', width: '65%' }} />
      <div style={{ height: '2.5px', background: '#FF9933', borderRadius: '1px', marginBottom: '7px', width: '80%' }} />
      {[75, 55, 85, 45, 70, 60].map((w, i) => (
        <div key={i} style={{ height: '2.5px', background: '#e5e7eb', borderRadius: '1px', marginBottom: '4px', width: `${w}%` }} />
      ))}
    </div>
  </div>
);

export default Template2Column;
