/**
 * Template: Executive  (PREMIUM)
 * Bold header, amber accent, skill badges, ideal for senior roles.
 */
import React from 'react';

const AMBER = '#b45309';
const BG    = '#fffbeb';

const Section = ({ title }) => (
  <h2 style={{
    fontSize: '10pt', fontWeight: '700', color: AMBER,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    borderBottom: `2px solid ${AMBER}`, paddingBottom: '3px', marginBottom: '9px',
  }}>{title}</h2>
);

const TemplateExecutive = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', summary = '',
    photo = '',
    experience = [], education = [], skills = [],
    projects = [], certifications = [], achievements = [],
  } = data;

  const contact = [email, phone, location, linkedin].filter(Boolean);

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: '10.5pt', lineHeight: '1.5', color: '#1c1917',
      maxWidth: '800px', margin: '0 auto', background: '#fff',
    }}>
      {/* Bold amber header */}
      <div style={{
        background: AMBER, color: '#fff',
        padding: '26px 40px 20px', marginBottom: '22px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {photo && (
            <img src={photo} alt={name}
              style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.75)', flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ fontSize: '22pt', fontWeight: '700', margin: '0 0 6px', letterSpacing: '0.01em' }}>
              {name || 'Your Name'}
            </h1>
            <p style={{ margin: 0, fontSize: '9.5pt', opacity: 0.88 }}>
              {contact.join('   |   ')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 40px 36px' }}>
        {summary && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Executive Summary" />
            <p style={{ margin: 0, color: '#292524' }}>{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Professional Experience" />
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '11pt' }}>{exp.title}</strong>
                  <span style={{ color: '#78716c', fontSize: '9.5pt' }}>{exp.duration}</span>
                </div>
                <div style={{ color: AMBER, fontSize: '9.5pt', fontStyle: 'italic' }}>{exp.company}</div>
                {exp.description && <p style={{ margin: '4px 0 0', color: '#292524' }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Core Competencies" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {skills.map((s, i) => (
                <span key={i} style={{
                  background: BG, border: `1px solid ${AMBER}50`,
                  color: AMBER, padding: '2px 11px', borderRadius: '4px', fontSize: '9.5pt',
                }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Education" />
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{edu.degree || edu.title}</strong>
                  <span style={{ color: '#78716c', fontSize: '9.5pt' }}>{edu.year || edu.duration}</span>
                </div>
                <div style={{ color: '#78716c', fontSize: '9.5pt' }}>{edu.institution || edu.company}</div>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Key Projects" />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: '8px' }}>
                <strong>{p.title}</strong>
                {p.description && <p style={{ margin: '3px 0 0', color: '#292524' }}>{p.description}</p>}
              </div>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Certifications" />
            {certifications.map((c, i) => (
              <div key={i} style={{ color: '#292524', marginBottom: '4px' }}>
                {typeof c === 'string' ? c : `${c.name}${c.issuer ? ' — ' + c.issuer : ''}`}
              </div>
            ))}
          </div>
        )}

        {achievements.length > 0 && (
          <div>
            <Section title="Achievements" />
            {achievements.map((a, i) => (
              <div key={i} style={{ color: '#292524', marginBottom: '4px' }}>
                ▸ {typeof a === 'string' ? a : a.title}
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
    <div style={{ background: template.color, height: '26%', padding: '8px 10px' }}>
      <div style={{ height: '7px', background: 'rgba(255,255,255,0.75)', borderRadius: '2px', marginBottom: '4px', width: '52%' }} />
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.45)', borderRadius: '2px', width: '78%' }} />
    </div>
    <div style={{ background: template.previewBg, flex: 1, padding: '8px 10px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '6px' }}>
        {[28,22,30].map((w, i) => (
          <div key={i} style={{ height: '9px', background: `${template.color}30`, border: `1px solid ${template.color}40`, borderRadius: '3px', width: `${w}%` }} />
        ))}
      </div>
      {[80, 60, 90, 50, 70].map((w, i) => (
        <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '5px', width: `${w}%` }} />
      ))}
    </div>
  </div>
);

export default TemplateExecutive;
