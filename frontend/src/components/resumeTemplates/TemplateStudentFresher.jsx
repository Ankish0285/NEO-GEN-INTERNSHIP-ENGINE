/**
 * Template: Student / Fresher  (PREMIUM)
 * Education-first layout, purple accent, clean structure for fresh graduates.
 */
import React from 'react';

const PURPLE = '#7c3aed';

const Section = ({ title }) => (
  <h2 style={{
    fontSize: '10pt', fontWeight: '700', color: PURPLE, textTransform: 'uppercase',
    letterSpacing: '0.08em', borderBottom: `1.5px solid ${PURPLE}`,
    paddingBottom: '2px', marginBottom: '8px',
  }}>{title}</h2>
);

const TemplateStudentFresher = ({ data = {} }) => {
  const {
    name = '', email = '', phone = '', location = '',
    linkedin = '', github = '', summary = '',
    photo = '',
    education = [], experience = [], skills = [], projects = [],
    certifications = [], achievements = [],
  } = data;

  const contact = [email, phone, location, linkedin, github].filter(Boolean);

  return (
    <div id="resume-print-root" style={{
      fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      fontSize: '10.5pt', lineHeight: '1.5', color: '#111',
      maxWidth: '800px', margin: '0 auto', padding: '30px 40px', background: '#fff',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: `2px solid ${PURPLE}` }}>
        {photo && (
          <div style={{ marginBottom: '10px' }}>
            <img src={photo} alt={name}
              style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${PURPLE}`, display: 'inline-block' }} />
          </div>
        )}
        <h1 style={{ fontSize: '22pt', fontWeight: '800', margin: '0 0 6px', color: '#111' }}>{name || 'Your Name'}</h1>
        <p style={{ margin: 0, color: '#555', fontSize: '9.5pt' }}>{contact.join('   •   ')}</p>
      </div>

      {summary && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Objective" />
          <p style={{ margin: 0, color: '#333' }}>{summary}</p>
        </div>
      )}

      {/* Education first — key for freshers */}
      {education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Education" />
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{edu.degree || edu.title}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{edu.year || edu.duration}</span>
              </div>
              <div style={{ color: PURPLE, fontSize: '9.5pt' }}>{edu.institution || edu.company}</div>
              {edu.description && <p style={{ margin: '3px 0 0', color: '#555', fontSize: '9.5pt' }}>{edu.description}</p>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Skills" />
          <p style={{ margin: 0, color: '#333' }}>{skills.join('   •   ')}</p>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <strong>{p.title}</strong>
              {p.link && <span style={{ color: PURPLE, fontSize: '9pt', marginLeft: '6px' }}>{p.link}</span>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#333' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Internship / Experience" />
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{exp.title}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{exp.duration}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{exp.company}</div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#333' }}>{exp.description}</p>}
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
          <Section title="Achievements / Extra-curricular" />
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
    <div style={{ textAlign: 'center', marginBottom: '8px' }}>
      <div style={{ height: '7px', background: template.color, borderRadius: '2px', margin: '0 auto 3px', width: '50%' }} />
      <div style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', margin: '0 auto', width: '75%' }} />
    </div>
    <div style={{ height: '1.5px', background: template.color, marginBottom: '8px' }} />
    {[90, 65, 80, 55, 70, 85, 60].map((w, i) => (
      <div key={i} style={{ height: '3px', background: '#e5e7eb', borderRadius: '2px', marginBottom: '5px', width: `${w}%` }} />
    ))}
  </div>
);

export default TemplateStudentFresher;
