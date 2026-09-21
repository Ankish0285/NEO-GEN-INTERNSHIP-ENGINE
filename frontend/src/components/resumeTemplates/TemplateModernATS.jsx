/**
 * Template: Modern ATS  (FREE)
 * Single-column, standard headings, maximum ATS compatibility.
 * DATA MODEL: matches ResumeBuilder form state (p.name, p.techStack, p.github,
 * exp.startDate/endDate, etc.)
 */
import React from 'react';

const ORANGE = '#FF9933';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <h2 style={{
      fontSize: '11pt', fontWeight: '700', color: ORANGE,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1.5px solid ' + ORANGE, paddingBottom: '3px',
      marginBottom: '8px', margin: '0 0 8px',
    }}>{title}</h2>
    {children}
  </div>
);

/* safely format a date range from startDate/endDate/current */
const dateRange = (start, end, current) => {
  if (!start && !end) return '';
  if (current) return `${start || ''} – Present`;
  return [start, end].filter(Boolean).join(' – ');
};

/* helper: one safe string getter for old OR new property shape */
const safe = (v, ...keys) => {
  for (const k of keys) { if (v?.[k]) return v[k]; }
  return '';
};

const arr = (v) => Array.isArray(v) ? v : [];

const TemplateModernATS = ({ data = {} }) => {
  const {
    name = '', title = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '',
    photo = '', summary = '',
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

  const contactParts = [email, phone, location, linkedin, github, portfolio].filter(Boolean);

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      fontSize: '10.5pt', lineHeight: '1.45', color: '#111',
      maxWidth: '800px', margin: '0 auto', padding: '36px 40px',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {photo && (
          <img src={photo} alt={name}
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid ' + ORANGE, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20pt', fontWeight: '800', color: '#111', margin: '0 0 2px' }}>
            {name || 'Your Name'}
          </h1>
          {title && <div style={{ fontSize: '11pt', color: ORANGE, fontWeight: '700', marginBottom: '4px' }}>{title}</div>}
          {contactParts.length > 0 && (
            <p style={{ fontSize: '9.5pt', color: '#555', margin: 0 }}>
              {contactParts.join('  •  ')}
            </p>
          )}
        </div>
      </div>

      {summary && (
        <Section title="Professional Summary">
          <p style={{ margin: 0, color: '#333' }}>{summary}</p>
        </Section>
      )}

      {experience.length > 0 && (
        <Section title="Work Experience">
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{exp.title || ''}</strong>
                <span style={{ color: '#555', fontSize: '9.5pt' }}>
                  {dateRange(exp.startDate, exp.endDate, exp.current) || exp.duration || ''}
                </span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>
                {exp.company || ''}
                {exp.type ? ` · ${exp.type}` : ''}
                {exp.location ? ` · ${exp.location}` : ''}
              </div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{exp.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {internships.length > 0 && (
        <Section title="Internships">
          {internships.map((int, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{int.role || int.title || ''}</strong>
                <span style={{ color: '#555', fontSize: '9.5pt' }}>
                  {dateRange(int.startDate, int.endDate, int.current) || int.duration || ''}
                </span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>
                {int.org || int.company || ''}
                {int.type ? ` · ${int.type}` : ''}
                {int.location ? ` · ${int.location}` : ''}
              </div>
              {int.tech && <div style={{ fontSize: '9pt', color: '#777', marginTop: '2px' }}>Tech: {int.tech}</div>}
              {int.description && <p style={{ margin: '4px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{int.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{edu.degree || edu.title || ''}</strong>
                <span style={{ color: '#555', fontSize: '9.5pt' }}>
                  {[edu.startDate, edu.endDate].filter(Boolean).join(' – ') || edu.year || edu.duration || ''}
                </span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>
                {edu.institution || edu.company || ''}
                {edu.location ? ` · ${edu.location}` : ''}
              </div>
              {edu.field && <div style={{ fontSize: '9.5pt', color: '#555' }}>{edu.field}</div>}
              {(edu.cgpa || edu.percentage) && (
                <div style={{ fontSize: '9.5pt', color: '#555' }}>
                  {edu.cgpa ? `CGPA: ${edu.cgpa}` : ''}{edu.cgpa && edu.percentage ? '  |  ' : ''}{edu.percentage || ''}
                </div>
              )}
              {edu.coursework && <div style={{ fontSize: '9pt', color: '#666', marginTop: '2px' }}>Coursework: {edu.coursework}</div>}
              {edu.highlights && <div style={{ fontSize: '9pt', color: '#555', marginTop: '2px' }}>{edu.highlights}</div>}
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Technical Skills">
          <p style={{ margin: 0, color: '#333' }}>{skills.join('  •  ')}</p>
        </Section>
      )}

      {softSkills.length > 0 && (
        <Section title="Soft Skills">
          <p style={{ margin: 0, color: '#333' }}>{softSkills.join('  •  ')}</p>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{p.name || p.title || ''}</strong>
                {(p.startDate || p.endDate) && (
                  <span style={{ color: '#555', fontSize: '9pt' }}>
                    {[p.startDate, p.endDate].filter(Boolean).join(' – ')}
                  </span>
                )}
              </div>
              {p.role && <div style={{ color: ORANGE, fontSize: '9.5pt', fontWeight: '600' }}>{p.role}</div>}
              {p.techStack && <div style={{ fontSize: '9pt', color: '#666', marginTop: '1px' }}>Tech: {p.techStack}</div>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{p.description}</p>}
              {(p.github || p.demo || p.link) && (
                <div style={{ fontSize: '9pt', color: ORANGE, marginTop: '2px' }}>
                  {(p.github || p.link) && <span style={{ marginRight: '10px' }}>⎇ {p.github || p.link}</span>}
                  {p.demo && <span>🔗 {p.demo}</span>}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          {certifications.map((c, i) => {
            const cname   = typeof c === 'string' ? c : c.name || '';
            const cissuer = typeof c === 'object' ? c.issuer || '' : '';
            const cdate   = typeof c === 'object' ? c.issueDate || '' : '';
            return (
              <div key={i} style={{ color: '#333', marginBottom: '4px' }}>
                <strong>{cname}</strong>
                {cissuer && <span style={{ color: '#555' }}> — {cissuer}</span>}
                {cdate && <span style={{ color: '#777', fontSize: '9pt' }}> · {cdate}</span>}
              </div>
            );
          })}
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          {achievements.map((a, i) => {
            const t = typeof a === 'string' ? a : a.title || '';
            const org = typeof a === 'object' ? a.org || '' : '';
            const date = typeof a === 'object' ? a.date || '' : '';
            const desc = typeof a === 'object' ? a.description || '' : '';
            return (
              <div key={i} style={{ marginBottom: '5px' }}>
                <div style={{ color: '#333' }}>
                  • <strong>{t}</strong>
                  {org && <span style={{ color: '#555' }}> — {org}</span>}
                  {date && <span style={{ color: '#777', fontSize: '9pt' }}> · {date}</span>}
                </div>
                {desc && <div style={{ color: '#555', fontSize: '9.5pt', paddingLeft: '12px' }}>{desc}</div>}
              </div>
            );
          })}
        </Section>
      )}

      {training.length > 0 && (
        <Section title="Training &amp; Courses">
          {training.map((t, i) => {
            const tname = typeof t === 'string' ? t : t.name || '';
            const torg  = typeof t === 'object' ? t.org || '' : '';
            const tdisp = typeof t === 'object' ? [t.duration, t.date].filter(Boolean).join(' · ') : '';
            const tsk   = typeof t === 'object' ? t.skills || '' : '';
            return (
              <div key={i} style={{ marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <strong>{tname}</strong>
                  {tdisp && <span style={{ color: '#777', fontSize: '9pt' }}>{tdisp}</span>}
                </div>
                {torg && <div style={{ color: '#555', fontSize: '9.5pt' }}>{torg}</div>}
                {tsk  && <div style={{ color: '#666', fontSize: '9pt' }}>{tsk}</div>}
              </div>
            );
          })}
        </Section>
      )}

      {positions.length > 0 && (
        <Section title="Positions of Responsibility">
          {positions.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                <strong>{p.position || p.title || ''}</strong>
                {p.duration && <span style={{ color: '#555', fontSize: '9.5pt' }}>{p.duration}</span>}
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{p.org || p.organization || ''}</div>
              {p.description && <p style={{ margin: '3px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{p.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {languages.length > 0 && (
        <Section title="Languages">
          <p style={{ margin: 0, color: '#333' }}>
            {languages.map(l => {
              const lang = typeof l === 'string' ? l : l.language || '';
              const prof = typeof l === 'object' ? l.proficiency || '' : '';
              return lang + (prof ? ` (${prof})` : '');
            }).join('  •  ')}
          </p>
        </Section>
      )}

      {volunteering.length > 0 && (
        <Section title="Volunteering">
          {volunteering.map((v, i) => {
            const role = typeof v === 'string' ? v : v.role || '';
            const org  = typeof v === 'object' ? v.org || '' : '';
            const date = typeof v === 'object' ? v.date || '' : '';
            const desc = typeof v === 'object' ? v.description || '' : '';
            return (
              <div key={i} style={{ marginBottom: '6px' }}>
                <strong>{role}</strong>
                {org && <span style={{ color: '#555' }}> — {org}</span>}
                {date && <span style={{ color: '#777', fontSize: '9pt' }}> · {date}</span>}
                {desc && <p style={{ margin: '2px 0 0', color: '#333', fontSize: '9.5pt' }}>{desc}</p>}
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
};

export const PreviewThumbnail = ({ template }) => (
  <div style={{
    width: '100%', aspectRatio: '3/4', background: template.previewBg,
    borderRadius: '8px', overflow: 'hidden', padding: '12px', boxSizing: 'border-box',
  }}>
    <div style={{ height: '8px', background: template.color, borderRadius: '2px', marginBottom: '6px', width: '60%' }} />
    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '10px', width: '90%' }} />
    {[70, 90, 55, 80, 65, 75].map((w, i) => (
      <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '4px', width: `${w}%` }} />
    ))}
    <div style={{ height: '6px', background: template.color + '50', borderRadius: '2px', margin: '8px 0 6px', width: '40%' }} />
    {[85, 60, 75].map((w, i) => (
      <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '4px', width: `${w}%` }} />
    ))}
  </div>
);

export default TemplateModernATS;
