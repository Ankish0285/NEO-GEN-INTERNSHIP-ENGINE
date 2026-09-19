/**
 * Template: Professional  (FREE)
 * Two-tone header, structured sections, blue accent.
 */
import React from 'react';

const BLUE = '#1d4ed8';

const Section = ({ title }) => (
  <h2 style={{
    fontSize: '10.5pt', fontWeight: '700', color: BLUE,
    textTransform: 'uppercase', letterSpacing: '0.07em',
    borderBottom: `2px solid ${BLUE}`, paddingBottom: '3px', marginBottom: '8px',
  }}>{title}</h2>
);

const TemplateProfessional = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', summary = '',
    photo = '',
    experience = [], education = [], skills = [], projects = [],
    certifications = [], achievements = [],
  } = data;

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: '10.5pt', lineHeight: '1.5', color: '#1a1a1a',
      maxWidth: '800px', margin: '0 auto', background: '#fff',
    }}>
      {/* Blue header band */}
      <div style={{
        background: BLUE, color: '#fff', padding: '28px 40px 22px',
        marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {photo && (
            <img src={photo} alt={name}
              style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.75)', flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ fontSize: '22pt', fontWeight: '800', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              {name || 'Your Name'}
            </h1>
            <p style={{ fontSize: '9.5pt', margin: 0, opacity: 0.85 }}>
              {[email, phone, location, linkedin].filter(Boolean).join('   |   ')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 36px' }}>
        {summary && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Profile Summary" />
            <p style={{ margin: '0', color: '#333' }}>{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Work Experience" />
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '10.5pt' }}>{exp.title}</strong>
                  <span style={{ color: '#666', fontSize: '9.5pt' }}>{exp.duration}</span>
                </div>
                <div style={{ color: BLUE, fontSize: '9.5pt', fontStyle: 'italic' }}>{exp.company}</div>
                {exp.description && <p style={{ margin: '4px 0 0', color: '#333' }}>{exp.description}</p>}
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

        {skills.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Core Competencies" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map((s, i) => (
                <span key={i} style={{
                  background: '#eff6ff', color: BLUE, border: `1px solid ${BLUE}40`,
                  padding: '2px 10px', borderRadius: '4px', fontSize: '9.5pt',
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Projects" />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <strong>{p.title}</strong>
                {p.description && <p style={{ margin: '3px 0 0', color: '#333' }}>{p.description}</p>}
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
              <div key={i} style={{ marginBottom: '4px' }}>
                • {typeof a === 'string' ? a : a.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const PreviewThumbnail = ({ template }) => (
  <div style={{ width: '100%', aspectRatio: '3/4', borderRadius: '8px', overflow: 'hidden', boxSizing: 'border-box' }}>
    <div style={{ background: template.color, height: '28%', padding: '8px 10px' }}>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.7)', borderRadius: '2px', marginBottom: '4px', width: '55%' }} />
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.45)', borderRadius: '2px', width: '80%' }} />
    </div>
    <div style={{ background: template.previewBg, flex: 1, padding: '8px 10px' }}>
      {[80, 60, 90, 50, 70, 55, 85].map((w, i) => (
        <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '5px', width: `${w}%` }} />
      ))}
    </div>
  </div>
);

export default TemplateProfessional;
