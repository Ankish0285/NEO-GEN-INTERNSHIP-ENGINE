/**
 * Template: Minimal  (PREMIUM)
 * Ultra-clean white-space design, dark navy accent, content-forward.
 */
import React from 'react';

const NAVY = '#0f172a';
const LIGHT = '#64748b';

const TemplateMinimal = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '',
    photo = '',
    summary = '', experience = [], education = [],
    skills = [], projects = [], certifications = [], achievements = [],
  } = data;

  const contact = [email, phone, location, linkedin, github, portfolio].filter(Boolean);

  const Divider = () => (
    <div style={{ height: '1px', background: '#e2e8f0', margin: '14px 0 10px' }} />
  );

  const SectionTitle = ({ children }) => (
    <h2 style={{
      fontSize: '9pt', fontWeight: '700', color: LIGHT,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      margin: '0 0 8px',
    }}>{children}</h2>
  );

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
          <h1 style={{ fontSize: '26pt', fontWeight: '300', letterSpacing: '-0.02em', margin: '0 0 4px', color: NAVY }}>
            {name || 'Your Name'}
          </h1>
          {contact.length > 0 && (
            <p style={{ fontSize: '9pt', color: LIGHT, margin: 0 }}>
              {contact.join('   ·   ')}
            </p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '10.5pt' }}>{exp.title}</strong>
                <span style={{ color: LIGHT, fontSize: '9pt' }}>{exp.duration}</span>
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>{exp.company}</div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#334155' }}>{exp.description}</p>}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree || edu.title}</strong>
                <span style={{ color: LIGHT, fontSize: '9pt' }}>{edu.year || edu.duration}</span>
              </div>
              <div style={{ color: LIGHT, fontSize: '9.5pt' }}>{edu.institution || edu.company}</div>
            </div>
          ))}
        </>
      )}

      {skills.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Skills</SectionTitle>
          <p style={{ margin: 0, color: '#334155' }}>{skills.join('  ·  ')}</p>
        </>
      )}

      {projects.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Projects</SectionTitle>
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <strong>{p.title}</strong>
              {p.link && <span style={{ color: LIGHT, fontSize: '9pt', marginLeft: '8px' }}>{p.link}</span>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#334155' }}>{p.description}</p>}
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
              {typeof c === 'string' ? c : `${c.name}${c.issuer ? ' — ' + c.issuer : ''}`}
            </div>
          ))}
        </>
      )}

      {achievements.length > 0 && (
        <>
          <Divider />
          <SectionTitle>Achievements</SectionTitle>
          {achievements.map((a, i) => (
            <div key={i} style={{ color: '#334155', marginBottom: '4px' }}>
              · {typeof a === 'string' ? a : a.title}
            </div>
          ))}
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
