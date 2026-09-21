/**
 * Template: Student / Fresher  (PREMIUM)
 * Education-first layout for fresh graduates.
 * DATA MODEL: matches current ResumeBuilder form state.
 */
import React from 'react';
import { safeArr, normProject, normExp, normEdu, normCert, normAch, dateRange } from './_sharedHelpers';

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
        <h1 style={{ fontSize: '22pt', fontWeight: '800', margin: '0 0 2px', color: '#111' }}>{name || 'Your Name'}</h1>
        {title && <div style={{ fontSize: '10.5pt', color: PURPLE, fontWeight: '700', marginBottom: '4px' }}>{title}</div>}
        <p style={{ margin: 0, color: '#555', fontSize: '9.5pt' }}>{contact.join('   •   ')}</p>
      </div>

      {summary && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Career Objective" />
          <p style={{ margin: 0, color: '#333' }}>{summary}</p>
        </div>
      )}

      {/* Education first — key for freshers */}
      {education.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Education" />
          {education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{edu.degree}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{edu.dateStr}</span>
              </div>
              <div style={{ color: PURPLE, fontSize: '9.5pt' }}>
                {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
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
        </div>
      )}

      {internships.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Internships" />
          {internships.map((int, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{int.role || int.title || ''}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>
                  {dateRange(int.startDate, int.endDate, int.current) || int.duration || ''}
                </span>
              </div>
              <div style={{ color: PURPLE, fontSize: '9.5pt' }}>
                {int.org || int.company || ''}
                {int.type ? ` · ${int.type}` : ''}
                {int.location ? ` · ${int.location}` : ''}
              </div>
              {int.tech && <div style={{ fontSize: '9pt', color: '#666', marginTop: '2px' }}>Tech: {int.tech}</div>}
              {int.description && <p style={{ margin: '4px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{int.description}</p>}
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Technical Skills" />
          <p style={{ margin: 0, color: '#333' }}>{skills.join('   •   ')}</p>
        </div>
      )}

      {softSkills.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Soft Skills" />
          <p style={{ margin: 0, color: '#333' }}>{softSkills.join('   •   ')}</p>
        </div>
      )}

      {projects.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Projects" />
          {projects.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{p.name}</strong>
                {(p.startDate || p.endDate) && (
                  <span style={{ color: PURPLE, fontSize: '9pt' }}>
                    {[p.startDate, p.endDate].filter(Boolean).join(' – ')}
                  </span>
                )}
              </div>
              {p.role && <div style={{ color: PURPLE, fontSize: '9.5pt', fontStyle: 'italic' }}>{p.role}</div>}
              {p.techStack && <div style={{ fontSize: '9pt', color: '#555', marginTop: '1px' }}>Tech: {p.techStack}</div>}
              {p.description && <p style={{ margin: '3px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{p.description}</p>}
              {(p.github || p.demo) && (
                <div style={{ fontSize: '9pt', color: PURPLE, marginTop: '2px' }}>
                  {p.github && <span style={{ marginRight: '10px' }}>⎇ {p.github}</span>}
                  {p.demo && <span>🔗 {p.demo}</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {experience.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Work Experience" />
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <strong>{exp.title}</strong>
                <span style={{ color: '#666', fontSize: '9.5pt' }}>{exp.dateStr}</span>
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>
                {exp.company}{exp.type ? ` · ${exp.type}` : ''}{exp.location ? ` · ${exp.location}` : ''}
              </div>
              {exp.description && <p style={{ margin: '4px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{exp.description}</p>}
            </div>
          ))}
        </div>
      )}

      {certifications.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Certifications" />
          {certifications.map((c, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>
              <strong>{c.name}</strong>
              {c.issuer && <span style={{ color: '#555' }}> — {c.issuer}</span>}
              {c.issueDate && <span style={{ color: '#777', fontSize: '9pt' }}> · {c.issueDate}</span>}
            </div>
          ))}
        </div>
      )}

      {achievements.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Achievements &amp; Extra-curricular" />
          {achievements.map((a, i) => (
            <div key={i} style={{ marginBottom: '5px' }}>
              <div>• <strong>{a.title}</strong>{a.org ? ` — ${a.org}` : ''}{a.date ? ` · ${a.date}` : ''}</div>
              {a.description && <div style={{ color: '#555', fontSize: '9.5pt', paddingLeft: '10px' }}>{a.description}</div>}
            </div>
          ))}
        </div>
      )}

      {training.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Training &amp; Courses" />
          {training.map((t, i) => {
            const tname = typeof t === 'string' ? t : t.name || '';
            const torg  = typeof t === 'object' ? t.org || '' : '';
            const tdisp = typeof t === 'object' ? [t.duration, t.date].filter(Boolean).join(' · ') : '';
            const tsk   = typeof t === 'object' ? t.skills || '' : '';
            return (
              <div key={i} style={{ marginBottom: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <strong>{tname}</strong>
                  {tdisp && <span style={{ color: '#666', fontSize: '9pt' }}>{tdisp}</span>}
                </div>
                {torg && <div style={{ color: '#555', fontSize: '9.5pt' }}>{torg}</div>}
                {tsk  && <div style={{ color: '#666', fontSize: '9pt' }}>{tsk}</div>}
              </div>
            );
          })}
        </div>
      )}

      {positions.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Positions of Responsibility" />
          {positions.map((p, i) => (
            <div key={i} style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                <strong>{p.position || p.title || ''}</strong>
                {p.duration && <span style={{ color: '#666', fontSize: '9.5pt' }}>{p.duration}</span>}
              </div>
              <div style={{ color: '#555', fontSize: '9.5pt' }}>{p.org || p.organization || ''}</div>
              {p.description && <p style={{ margin: '3px 0 0', color: '#333', whiteSpace: 'pre-line' }}>{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      {languages.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <Section title="Languages" />
          <p style={{ margin: 0, color: '#333' }}>
            {languages.map(l => {
              const lang = typeof l === 'string' ? l : l.language || '';
              const prof = typeof l === 'object' ? l.proficiency || '' : '';
              return lang + (prof ? ` (${prof})` : '');
            }).join('  •  ')}
          </p>
        </div>
      )}

      {volunteering.length > 0 && (
        <div>
          <Section title="Volunteering" />
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
