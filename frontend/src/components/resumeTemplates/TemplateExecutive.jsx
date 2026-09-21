/**
 * Template: Executive  (PREMIUM)
 * Bold header, amber accent, skill badges, ideal for senior roles.
 * DATA MODEL: matches current ResumeBuilder form state.
 */
import React from 'react';
import { safeArr, normProject, normExp, normEdu, normCert, normAch, dateRange } from './_sharedHelpers';

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
      fontFamily: "'Georgia', 'Times New Roman', serif",
      fontSize: '10.5pt', lineHeight: '1.5', color: '#1c1917',
      maxWidth: '800px', margin: '0 auto', background: '#fff',
    }}>
      {/* Bold amber header */}
      <div style={{ background: AMBER, color: '#fff', padding: '26px 40px 20px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          {photo && (
            <img src={photo} alt={name}
              style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.75)', flexShrink: 0 }} />
          )}
          <div>
            <h1 style={{ fontSize: '22pt', fontWeight: '700', margin: '0 0 4px', letterSpacing: '0.01em' }}>
              {name || 'Your Name'}
            </h1>
            {title && <div style={{ fontSize: '10.5pt', opacity: 0.9, marginBottom: '4px' }}>{title}</div>}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '4px' }}>
                  <strong style={{ fontSize: '11pt' }}>{exp.title}</strong>
                  <span style={{ color: '#78716c', fontSize: '9.5pt' }}>{exp.dateStr}</span>
                </div>
                <div style={{ color: AMBER, fontSize: '9.5pt', fontStyle: 'italic' }}>
                  {exp.company}{exp.type ? ` · ${exp.type}` : ''}{exp.location ? ` · ${exp.location}` : ''}
                </div>
                {exp.description && <p style={{ margin: '4px 0 0', color: '#292524', whiteSpace: 'pre-line' }}>{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {internships.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Internships" />
            {internships.map((int, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <strong>{int.role || int.title || ''}</strong>
                  <span style={{ color: '#78716c', fontSize: '9.5pt' }}>
                    {dateRange(int.startDate, int.endDate, int.current) || int.duration || ''}
                  </span>
                </div>
                <div style={{ color: AMBER, fontSize: '9.5pt', fontStyle: 'italic' }}>
                  {int.org || int.company || ''}
                  {int.type ? ` · ${int.type}` : ''}
                  {int.location ? ` · ${int.location}` : ''}
                </div>
                {int.tech && <div style={{ fontSize: '9pt', color: '#78716c', marginTop: '2px' }}>Tech: {int.tech}</div>}
                {int.description && <p style={{ margin: '4px 0 0', color: '#292524', whiteSpace: 'pre-line' }}>{int.description}</p>}
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

        {softSkills.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Soft Skills" />
            <p style={{ margin: 0, color: '#292524' }}>{softSkills.join('  •  ')}</p>
          </div>
        )}

        {education.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Education" />
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <strong>{edu.degree}</strong>
                  <span style={{ color: '#78716c', fontSize: '9.5pt' }}>{edu.dateStr}</span>
                </div>
                <div style={{ color: '#78716c', fontSize: '9.5pt' }}>
                  {edu.institution}{edu.location ? ` · ${edu.location}` : ''}
                </div>
                {edu.field && <div style={{ fontSize: '9.5pt', color: '#78716c' }}>{edu.field}</div>}
                {(edu.cgpa || edu.percentage) && (
                  <div style={{ fontSize: '9.5pt', color: '#78716c' }}>
                    {edu.cgpa ? `CGPA: ${edu.cgpa}` : ''}{edu.cgpa && edu.percentage ? '  |  ' : ''}{edu.percentage || ''}
                  </div>
                )}
                {edu.coursework && <div style={{ fontSize: '9pt', color: '#78716c', marginTop: '2px' }}>Coursework: {edu.coursework}</div>}
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Key Projects" />
            {projects.map((p, i) => (
              <div key={i} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <strong>{p.name}</strong>
                  {(p.startDate || p.endDate) && (
                    <span style={{ color: '#78716c', fontSize: '9pt' }}>
                      {[p.startDate, p.endDate].filter(Boolean).join(' – ')}
                    </span>
                  )}
                </div>
                {p.role && <div style={{ color: AMBER, fontSize: '9.5pt', fontStyle: 'italic' }}>{p.role}</div>}
                {p.techStack && <div style={{ fontSize: '9pt', color: '#78716c', marginTop: '1px' }}>Tech: {p.techStack}</div>}
                {p.description && <p style={{ margin: '3px 0 0', color: '#292524', whiteSpace: 'pre-line' }}>{p.description}</p>}
                {(p.github || p.demo) && (
                  <div style={{ fontSize: '9pt', color: AMBER, marginTop: '2px' }}>
                    {p.github && <span style={{ marginRight: '10px' }}>⎇ {p.github}</span>}
                    {p.demo && <span>🔗 {p.demo}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Certifications" />
            {certifications.map((c, i) => (
              <div key={i} style={{ color: '#292524', marginBottom: '4px' }}>
                <strong>{c.name}</strong>
                {c.issuer && <span style={{ color: '#78716c' }}> — {c.issuer}</span>}
                {c.issueDate && <span style={{ color: '#78716c', fontSize: '9pt' }}> · {c.issueDate}</span>}
              </div>
            ))}
          </div>
        )}

        {achievements.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Achievements" />
            {achievements.map((a, i) => (
              <div key={i} style={{ marginBottom: '5px' }}>
                <div>▸ <strong>{a.title}</strong>{a.org ? ` — ${a.org}` : ''}{a.date ? ` · ${a.date}` : ''}</div>
                {a.description && <div style={{ color: '#78716c', fontSize: '9.5pt', paddingLeft: '12px' }}>{a.description}</div>}
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
                <div key={i} style={{ marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                    <strong>{tname}</strong>
                    {tdisp && <span style={{ color: '#78716c', fontSize: '9pt' }}>{tdisp}</span>}
                  </div>
                  {torg && <div style={{ color: '#78716c', fontSize: '9.5pt' }}>{torg}</div>}
                  {tsk  && <div style={{ color: '#78716c', fontSize: '9pt' }}>{tsk}</div>}
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
                  {p.duration && <span style={{ color: '#78716c', fontSize: '9.5pt' }}>{p.duration}</span>}
                </div>
                <div style={{ color: '#78716c', fontSize: '9.5pt' }}>{p.org || p.organization || ''}</div>
                {p.description && <p style={{ margin: '3px 0 0', color: '#292524', whiteSpace: 'pre-line' }}>{p.description}</p>}
              </div>
            ))}
          </div>
        )}

        {languages.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <Section title="Languages" />
            <p style={{ margin: 0, color: '#292524' }}>
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
                  {org && <span style={{ color: '#78716c' }}> — {org}</span>}
                  {date && <span style={{ color: '#78716c', fontSize: '9pt' }}> · {date}</span>}
                  {desc && <p style={{ margin: '2px 0 0', color: '#292524', fontSize: '9.5pt' }}>{desc}</p>}
                </div>
              );
            })}
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
