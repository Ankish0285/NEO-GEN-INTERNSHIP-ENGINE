/**
 * Template: Minimal  (PREMIUM)
 * Ultra-clean white-space design, dark navy accent, content-forward.
 * DATA MODEL: matches current ResumeBuilder form state.
 */
import React from 'react';
import { safeArr, normProject, normExp, normEdu, normCert, normAch, dateRange } from './_sharedHelpers';

const NAVY  = '#0f172a';
const LIGHT = '#64748b';

const Divider = () => (
  <div style={{ height: '1px', background: '#e2e8f0', margin: '14px 0 10px' }} />
);

const SectionTitle = ({ children }) => (
  <h2 style={{
    fontSize: '9pt', fontWeight: '700', color: LIGHT,
    textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 8px',
  }}>{children}</h2>
);

const TemplateMinimal = ({ data = {} }) => {
  const {
    name = '', title = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '', photo = '', summary = '',
  } = data;

  const experience     = safeArr(data.experience).map(normExp);
  const internships    = safeArr(data.internships);
  const education      = safeArr(data.education).map(normEdu);
  const skills         = safeArr(data.skills);
  const softSkills     = safeArr(data.softSkills);
  const projects       = safeArr(data.projects).map(normProject);
  const certifications = safeArr(data.certifications).map(normCert);
  const achievements   = safeArr(data.achievements).map(normAch);
  const training       = safeArr(data.training);
  const positions      = safeArr(data.positions);
  const languages      = safeArr(data.languages);
  const volunteering   = safeArr(data.volunteering);

  const contact = [email, phone, location, linkedin, github, portfolio].filter(Boolean);

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      fontSize: '10pt', lineHeight: '1.6', color: NAVY,
      maxWidth: '780px', margin: '0 auto', padding: '48px 56px', background: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '4px' }}>
        {photo && (
          <img src={photo} alt={name}
            style={{ width: '68px', height: '68px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1', flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: '26pt', fontWeight: '300', letterSpacing: '-0.02em', margin: '0 0 2px', color: NAVY }}>
            {name || 'Your Name'}
          </h1>
          {title && <div style={{ fontSize: '10.5pt', color: LIGHT, marginBottom: '2px' }}>{title}</div>}
          {contact.length > 0 && (
            <p style={{ fontSize: '9pt', color: LIGHT, margin: 0 }}>{contact.join('   ·   ')}</p>
          )}
        </div>
      </div>

      {summary && (
        <>
          <Divider />
          <p style={{ margin: 0, color: '#334155', fontSize: '10pt', lineHeight: '1.7' }}>{summary}</p>
        </>
      )}

      {experience.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Experience</SectionTitle>
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                <strong style={{ fontSize: '10.5pt' }}>{exp.title}</strong>
                <span style={{ color: LIGHT, fontSize: '9pt' }}>{exp.dateStr}</span>
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>
                {exp.company}{exp.type ? ` · ${exp.type}` : ''}{exp.location ? ` · ${exp.location}` : ''}
              </div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-line' }}>{exp.description}</p>}
            </div>
          ))}
        </>
      )}

      {internships.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Internships</SectionTitle>
          {internships.map((int, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong style={{ fontSize: '10.5pt' }}>{int.role || int.title || ''}</strong>
                <span style={{ color: LIGHT, fontSize: '9pt' }}>
                  {dateRange(int.startDate, int.endDate, int.current) || int.duration || ''}
                </span>
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>
                {int.org || int.company || ''}
                {int.type ? ` · ${int.type}` : ''}
                {int.location ? ` · ${int.location}` : ''}
              </div>
              {int.tech && <div style={{ fontSize: '9pt', color: LIGHT, marginTop: '2px' }}>Tech: {int.tech}</div>}
              {int.description && <p style={{ margin: '4px 0 0', color: '#334155', whiteSpace: 'pre-line' }}>{int.description}</p>}
            </div>
          ))}
        </>
      )}

      {education.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Education</SectionTitle>
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{edu.degree}</strong>
                <span style={{ color: LIGHT, fontSize: '9pt' }}>{edu.dateStr}</span>
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>
                {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
              </div>
              {edu.field && <div style={{ fontSize: '9.5pt', color: LIGHT }}>{edu.field}</div>}
              {(edu.cgpa || edu.percentage) && (
                <div style={{ fontSize: '9.5pt', color: LIGHT }}>
                  {edu.cgpa ? `CGPA: ${edu.cgpa}` : ''}{edu.cgpa && edu.percentage ? '  |  ' : ''}{edu.percentage || ''}
                </div>
              )}
              {edu.coursework && <div style={{ fontSize: '9pt', color: LIGHT, marginTop: '2px' }}>Coursework: {edu.coursework}</div>}
            </div>
          ))}
        </>
      )}

      {skills.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Technical Skills</SectionTitle>
          <p style={{ margin: 0, color: '#334155' }}>{skills.join('  ·  ')}</p>
        </>
      )}

      {softSkills.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Soft Skills</SectionTitle>
          <p style={{ margin: 0, color: '#334155' }}>{softSkills.join('  ·  ')}</p>
        </>
      )}

      {projects.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Projects</SectionTitle>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{p.name}</strong>
                {(p.startDate || p.endDate) && (
                  <span style={{ color: LIGHT, fontSize: '9pt' }}>
                    {[p.startDate, p.endDate].filter(Boolean).join(' – ')}
                  </span>
                )}
              </div>
              {p.role && <div style={{ color: LIGHT, fontSize: '9.5pt', fontStyle: 'italic' }}>{p.role}</div>}
              {p.techStack && <div style={{ fontSize: '9pt', color: LIGHT, marginTop: '1px' }}>Tech: {p.techStack}</div>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#334155', whiteSpace: 'pre-line' }}>{p.description}</p>}
              {(p.github || p.demo) && (
                <div style={{ fontSize: '9pt', color: LIGHT, marginTop: '2px' }}>
                  {p.github && <span style={{ marginRight: '10px' }}>⎇ {p.github}</span>}
                  {p.demo && <span>🔗 {p.demo}</span>}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {certifications.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Certifications</SectionTitle>
          {certifications.map((c, i) => (
            <div key={i} style={{ color: '#334155', marginBottom: '4px' }}>
              <strong>{c.name}</strong>
              {c.issuer && <span style={{ color: LIGHT }}> — {c.issuer}</span>}
              {c.issueDate && <span style={{ color: LIGHT, fontSize: '9pt' }}> · {c.issueDate}</span>}
            </div>
          ))}
        </>
      )}

      {achievements.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Achievements</SectionTitle>
          {achievements.map((a, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>
              <div style={{ color: '#334155' }}>
                · <strong>{a.title}</strong>{a.org ? ` — ${a.org}` : ''}{a.date ? ` · ${a.date}` : ''}
              </div>
              {a.description && <div style={{ color: LIGHT, fontSize: '9.5pt', paddingLeft: '10px' }}>{a.description}</div>}
            </div>
          ))}
        </>
      )}

      {training.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Training &amp; Courses</SectionTitle>
          {training.map((t, i) => {
            const tname = typeof t === 'string' ? t : t.name || '';
            const torg  = typeof t === 'object' ? t.org || '' : '';
            const tdisp = typeof t === 'object' ? [t.duration, t.date].filter(Boolean).join(' · ') : '';
            const tsk   = typeof t === 'object' ? t.skills || '' : '';
            return (
              <div key={i} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <strong>{tname}</strong>
                  {tdisp && <span style={{ color: LIGHT, fontSize: '9pt' }}>{tdisp}</span>}
                </div>
                {torg && <div style={{ color: LIGHT, fontSize: '9.5pt' }}>{torg}</div>}
                {tsk  && <div style={{ color: LIGHT, fontSize: '9pt' }}>{tsk}</div>}
              </div>
            );
          })}
        </>
      )}

      {positions.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Positions of Responsibility</SectionTitle>
          {positions.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                <strong>{p.position || p.title || ''}</strong>
                {p.duration && <span style={{ color: LIGHT, fontSize: '9pt' }}>{p.duration}</span>}
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>{p.org || p.organization || ''}</div>
              {p.description && <p style={{ margin: '3px 0 0', color: '#334155', whiteSpace: 'pre-line' }}>{p.description}</p>}
            </div>
          ))}
        </>
      )}

      {languages.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Languages</SectionTitle>
          <p style={{ margin: 0, color: '#334155' }}>
            {languages.map(l => {
              const lang = typeof l === 'string' ? l : l.language || '';
              const prof = typeof l === 'object' ? l.proficiency || '' : '';
              return lang + (prof ? ` (${prof})` : '');
            }).join('  ·  ')}
          </p>
        </>
      )}

      {volunteering.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Volunteering</SectionTitle>
          {volunteering.map((v, i) => {
            const role = typeof v === 'string' ? v : v.role || '';
            const org  = typeof v === 'object' ? v.org || '' : '';
            const date = typeof v === 'object' ? v.date || '' : '';
            const desc = typeof v === 'object' ? v.description || '' : '';
            return (
              <div key={i} style={{ marginBottom: '6px' }}>
                <strong>{role}</strong>
                {org && <span style={{ color: LIGHT }}> — {org}</span>}
                {date && <span style={{ color: LIGHT, fontSize: '9pt' }}> · {date}</span>}
                {desc && <p style={{ margin: '2px 0 0', color: '#334155', fontSize: '9.5pt' }}>{desc}</p>}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
};

export const PreviewThumbnail = ({ template }) => (
  <div style={{ width: '100%', aspectRatio: '3/4', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', padding: '14px', boxSizing: 'border-box' }}>
    <div style={{ height: '9px', background: template.color, borderRadius: '2px', marginBottom: '4px', width: '45%', opacity: 0.85 }} />
    <div style={{ height: '2px', background: '#e2e8f0', marginBottom: '8px', width: '80%' }} />
    {[75, 55, 85, 50, 65, 80, 45, 70].map((w, i) => (
      <div key={i} style={{ height: '2.5px', background: '#e2e8f0', borderRadius: '2px', marginBottom: '5px', width: `${w}%` }} />
    ))}
  </div>
);

export default TemplateMinimal;
