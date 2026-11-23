import React, { useRef, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { Award } from 'lucide-react';

/**
 * CertificatePreview
 *
 * Renders a visual certificate using two templates:
 *   "classic" — cream/gold formal layout
 *   "modern"  — dark gradient header, clean sans-serif
 *
 * Props:
 *   templateId       string   "classic" | "modern"
 *   studentName      string
 *   certificateId    string
 *   role             string
 *   organization     string
 *   duration         string
 *   skills           string[]
 *   issueDate        string | Date
 *   issuerName       string
 *   title            string
 *   description      string
 *   qrCodeData       string  (URL for QR code)
 *   onExportReady    fn(ref) — called on mount so parent can trigger PDF export
 */
const CertificatePreview = ({
  templateId = 'classic',
  studentName = '',
  certificateId = '',
  role = '',
  organization = '',
  duration = '',
  skills = [],
  issueDate,
  issuerName = '',
  title = 'Internship Completion Certificate',
  description = '',
  qrCodeData = '',
  onExportReady,
}) => {
  const certRef = useRef(null);

  useEffect(() => {
    if (onExportReady && certRef.current) {
      onExportReady(certRef);
    }
  }, [onExportReady]);

  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const qrValue = qrCodeData || `https://neogeninternshipengine.me/verify/${certificateId}`;

  if (templateId === 'modern') {
    return (
      <div
        ref={certRef}
        className="w-full max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff', fontFamily: 'Inter, sans-serif', minHeight: '480px' }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            padding: '32px 40px 24px',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award size={32} style={{ color: '#FF9933' }} />
              <div>
                <p style={{ color: '#FF9933', fontSize: '20px', fontWeight: 800, letterSpacing: '1px' }}>
                  NEO GEN
                </p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>
                  Internship Engine
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Certificate ID
              </p>
              <p style={{ color: '#FF9933', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700 }}>
                {certificateId || 'NEOGEN-CERT-PENDING'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,153,51,0.3)', paddingTop: '24px' }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              This certifies that
            </p>
            <p style={{
              color: '#FF9933',
              fontSize: '28px',
              fontWeight: 800,
              lineHeight: 1.2,
              wordBreak: 'break-word',
              maxWidth: '480px',
            }}>
              {studentName || 'Student Name'}
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '28px 40px', background: '#fff' }}>
          <p style={{ color: '#555', fontSize: '13px', marginBottom: '4px' }}>
            has successfully completed the internship program
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <p style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Role / Position
              </p>
              <p style={{ color: '#1a1a2e', fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>
                {role || '—'}
              </p>
            </div>
            <div>
              <p style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Organization
              </p>
              <p style={{ color: '#1a1a2e', fontWeight: 700, fontSize: '15px', marginTop: '2px' }}>
                {organization || '—'}
              </p>
            </div>
            {duration && (
              <div>
                <p style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Duration
                </p>
                <p style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                  {duration}
                </p>
              </div>
            )}
            <div>
              <p style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Issue Date
              </p>
              <p style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '14px', marginTop: '2px' }}>
                {formattedDate}
              </p>
            </div>
          </div>

          {description && (
            <p style={{ color: '#666', fontSize: '13px', marginTop: '16px', lineHeight: 1.6 }}>
              {description}
            </p>
          )}

          {skills.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#999', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Skills Demonstrated
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {skills.map((skill, i) => (
                  <span key={i} style={{
                    background: 'rgba(255,153,51,0.1)',
                    color: '#c47a00',
                    border: '1px solid rgba(255,153,51,0.3)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <div>
              <div style={{ width: '140px', height: '1px', background: '#1a1a2e', marginBottom: '6px' }} />
              <p style={{ color: '#1a1a2e', fontWeight: 700, fontSize: '13px' }}>
                {issuerName || 'Authorized Signatory'}
              </p>
              <p style={{ color: '#999', fontSize: '11px' }}>NEO GEN Internship Engine</p>
            </div>

            {qrValue && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <QRCode value={qrValue} size={72} />
                <p style={{ color: '#bbb', fontSize: '9px' }}>Scan to verify</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Classic template ──────────────────────────────────────────────────────
  return (
    <div
      ref={certRef}
      style={{
        width: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        background: '#fdfaf3',
        border: '8px double #c9a94a',
        outline: '2px solid #e8c97a',
        outlineOffset: '-14px',
        borderRadius: '4px',
        padding: '40px 48px',
        fontFamily: 'Georgia, serif',
        minHeight: '480px',
        position: 'relative',
        boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Top branding */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Award size={28} style={{ color: '#c9a94a' }} />
          <span style={{ fontSize: '22px', fontWeight: 900, color: '#c9a94a', letterSpacing: '3px', fontFamily: 'Inter, sans-serif' }}>
            NEO GEN
          </span>
        </div>
        <p style={{ color: '#888', fontSize: '11px', fontFamily: 'Inter, sans-serif', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Internship Engine
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #c9a94a', margin: '12px 0' }} />

      {/* Title */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <p style={{ fontSize: '26px', fontWeight: 700, color: '#5a3e00', letterSpacing: '1px' }}>
          {title || 'Internship Completion Certificate'}
        </p>
        <p style={{ fontSize: '13px', color: '#888', marginTop: '6px', fontFamily: 'Inter, sans-serif' }}>
          This is to certify that
        </p>
      </div>

      {/* Student name */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <p style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#c9a94a',
          borderBottom: '2px solid #c9a94a',
          display: 'inline-block',
          paddingBottom: '4px',
          wordBreak: 'break-word',
          maxWidth: '560px',
          lineHeight: 1.2,
        }}>
          {studentName || 'Student Name'}
        </p>
      </div>

      {/* Body text */}
      <div style={{ textAlign: 'center', margin: '16px 0', fontSize: '14px', color: '#555', lineHeight: 1.7 }}>
        <p>
          has successfully completed the internship program as{' '}
          <strong style={{ color: '#3a2800' }}>{role || 'Intern'}</strong>
          {' '}at{' '}
          <strong style={{ color: '#3a2800' }}>{organization || 'Organization'}</strong>
          {duration ? ` for a duration of ${duration}` : ''}.
        </p>
        {description && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>{description}</p>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div style={{ textAlign: 'center', margin: '16px 0' }}>
          <p style={{ color: '#888', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Inter, sans-serif', marginBottom: '8px' }}>
            Skills Demonstrated
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
            {skills.map((skill, i) => (
              <span key={i} style={{
                background: 'rgba(201,169,74,0.12)',
                color: '#7a5900',
                border: '1px solid rgba(201,169,74,0.4)',
                borderRadius: '20px',
                padding: '3px 10px',
                fontSize: '11px',
                fontFamily: 'Inter, sans-serif',
              }}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '28px' }}>
        <div>
          <p style={{ color: '#888', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>Issue Date</p>
          <p style={{ color: '#3a2800', fontWeight: 700, fontSize: '13px' }}>{formattedDate}</p>
        </div>

        <div style={{ textAlign: 'center' }}>
          {qrValue && (
            <>
              <QRCode value={qrValue} size={68} />
              <p style={{ color: '#bbb', fontSize: '9px', fontFamily: 'Inter, sans-serif', marginTop: '4px' }}>
                Scan to verify
              </p>
            </>
          )}
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ width: '130px', height: '1px', background: '#c9a94a', marginBottom: '6px', marginLeft: 'auto' }} />
          <p style={{ color: '#3a2800', fontWeight: 700, fontSize: '13px' }}>
            {issuerName || 'Authorized Signatory'}
          </p>
          <p style={{ color: '#888', fontSize: '11px', fontFamily: 'Inter, sans-serif' }}>NEO GEN</p>
        </div>
      </div>

      {/* Cert ID */}
      {certificateId && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ color: '#bbb', fontSize: '10px', fontFamily: 'monospace' }}>
            {certificateId}
          </p>
        </div>
      )}
    </div>
  );
};

export default CertificatePreview;
