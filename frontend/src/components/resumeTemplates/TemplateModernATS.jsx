/**
 * Template: Modern ATS  (FREE)
 * Single-column, standard headings, maximum ATS compatibility.
 * All sections use plain text — no tables, no columns in the skills section.
 */
import React from 'react';

const Section = ({ title, children }) => (
  <div style={{ marginBottom: '18px' }}>
    <h2 style={{
      fontSize: '11pt', fontWeight: '700', color: '#FF9933',
      textTransform: 'uppercase', letterSpacing: '0.08em',
      borderBottom: '1.5px solid #FF9933', paddingBottom: '3px',
      marginBottom: '8px',
    }}>{title}</h2>
    {children}
  </div>
);

const TemplateModernATS = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '',
    photo = '',
    summary = '',
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    achievements = [],
  } = data;

  const hasContact = email || phone || location || linkedin || github || portfolio;

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
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF9933', flexShrink: 0 }} />
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '20pt', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>
            {name || 'Your Name'}
          </h1>
          {hasContact && (
            <p style={{ fontSize: '9.5pt', color: '#555', margin: 0 }}>
              {[email, phone, location, linkedin, github, portfolio].filter(Boolean).join('  •  ')}
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.title}</strong>
                <span style={{ color: '#555', fontSize: '9.5pt' }}>{exp.duration}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{exp.company}</div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#333' }}>{exp.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {education.length > 0 && (
        <Section title="Education">
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree || edu.title}</strong>
                <span style={{ color: '#555', fontSize: '9.5pt' }}>{edu.year || edu.duration}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{edu.institution || edu.company}</div>
            </div>
          ))}
        </Section>
      )}

      {skills.length > 0 && (
        <Section title="Skills">
          <p style={{ margin: 0, color: '#333' }}>{skills.join('  •  ')}</p>
        </Section>
      )}

      {projects.length > 0 && (
        <Section title="Projects">
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <strong>{p.title}</strong>
              {p.link && <span style={{ color: '#555', fontSize: '9pt' }}> — {p.link}</span>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#333' }}>{p.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {certifications.length > 0 && (
        <Section title="Certifications">
          {certifications.map((c, i) => (
            <div key={i} style={{ color: '#333', marginBottom: '4px' }}>
              {typeof c === 'string' ? c : `${c.name}${c.issuer ? ' — ' + c.issuer : ''}`}
            </div>
          ))}
        </Section>
      )}

      {achievements.length > 0 && (
        <Section title="Achievements">
          {achievements.map((a, i) => (
            <div key={i} style={{ color: '#333', marginBottom: '4px' }}>• {typeof a === 'string' ? a : a.title}</div>
          ))}
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
