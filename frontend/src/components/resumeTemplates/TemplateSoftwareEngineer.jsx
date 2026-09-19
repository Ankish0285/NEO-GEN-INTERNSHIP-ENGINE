/**
 * Template: Software Engineer  (PREMIUM)
 * Tech-focused: skills matrix, project highlights, green accent.
 */
import React from 'react';

const GREEN = '#138808';

const Section = ({ title }) => (
  <h2 style={{
    fontSize: '10pt', fontWeight: '700', color: GREEN, textTransform: 'uppercase',
    letterSpacing: '0.08em', borderBottom: `1.5px solid ${GREEN}`,
    paddingBottom: '2px', marginBottom: '8px',
  }}>{title}</h2>
);

const TemplateSoftwareEngineer = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', github = '', portfolio = '',
    photo = '',
    summary = '', experience = [], education = [],
    skills = [], projects = [], certifications = [], achievements = [],
  } = data;

  const contactParts = [email, phone, location, linkedin, github, portfolio].filter(Boolean);

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      fontSize: '10.5pt', lineHeight: '1.4', color: '#111',
      maxWidth: '800px', margin: '0 auto', padding: '30px 40px', background: '#fff',
    }}>
      {/* Header */}
      <div style={{
        borderLeft: `4px solid ${GREEN}`, paddingLeft: '14px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        {photo && (
          <img src={photo} alt={name}
            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GREEN}`, flexShrink: 0 }} />
        )}
        <div>
          <h1 style={{ fontSize: '20pt', fontWeight: '800', margin: '0 0 4px', color: '#111' }}>
            {name || 'Your Name'}
          </h1>
          <p style={{ margin: 0, color: '#555', fontSize: '9.5pt' }}>
            {contactParts.join('  •  ')}
          </p>
        </div>
      </div>

      {summary && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="About" />
          <p style={{ margin: 0, color: '#333' }}>{summary}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Technical Skills" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {skills.map((s, i) => (
              <span key={i} style={{
                background: '#f0fdf4', border: `1px solid ${GREEN}50`,
                color: '#166534', padding: '2px 10px', borderRadius: '4px', fontSize: '9.5pt',
              }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Experience" />
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.title}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{exp.duration}</span>
              </div>
              <div style={{ color: GREEN, fontSize: '9.5pt' }}>{exp.company}</div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#333' }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{p.title}</strong>
                {p.link && <span style={{ color: GREEN, fontSize: '9pt' }}>{p.link}</span>}
              </div>
              {p.description && <p style={{ margin: '3px 0 0', color: '#333' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Education" />
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree || edu.title}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{edu.year || edu.duration}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{edu.institution || edu.company}</div>
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Certifications" />
          {certifications.map((c, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              {typeof c === 'string' ? c : `${c.name}${c.issuer ? ' — ' + c.issuer : ''}`}
            </div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div>
          <Section title="Achievements" />
          {achievements.map((a, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>• {typeof a === 'string' ? a : a.title}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export const PreviewThumbnail = ({ template }) => (
  <div style={{ width: '100%', aspectRatio: '3/4', background: template.previewBg, borderRadius: '8px', overflow: 'hidden', padding: '12px', boxSizing: 'border-box' }}>
    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', alignItems: 'center' }}>
      <div style={{ width: '4px', height: '20px', background: template.color, borderRadius: '2px' }} />
      <div style={{ height: '6px', background: template.color, borderRadius: '2px', flex: 1 }} />
    </div>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '8px' }}>
      {[30,25,35,28,32].map((w, i) => (
        <div key={i} style={{ height: '10px', background: `${template.color}30`, border: `1px solid ${template.color}40`, borderRadius: '3px', width: `${w}%` }} />
      ))}
    </div>
    {[85, 60, 75, 90, 50].map((w, i) => (
      <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '5px', width: `${w}%` }} />
    ))}
  </div>
);

export default TemplateSoftwareEngineer;
