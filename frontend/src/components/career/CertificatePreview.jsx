import React, { useRef, useEffect } from 'react';
import { QRCodeSVG as QRCode } from 'qrcode.react';

/**
 * CertificatePreview — Indian Flag Colour Theme
 *
 * Templates:
 *   "classic" — Saffron / White / Green tri-band formal layout
 *   "modern"  — Deep Navy with Saffron & Green accents
 *
 * Indian Flag Colours:
 *   Saffron  #FF9933
 *   White    #FFFFFF
 *   Green    #138808
 *   Navy     #000080  (Ashoka Chakra blue)
 */

// ── Colour Palette ────────────────────────────────────────────────────────────
const C = {
  saffron:      '#FF9933',
  saffronDark:  '#E07B00',
  saffronLight: '#FFF3E0',
  green:        '#138808',
  greenDark:    '#0D6B05',
  greenLight:   '#E8F5E9',
  navy:         '#000080',
  navyLight:    '#E8EAF6',
  white:        '#FFFFFF',
  cream:        '#FFFDF5',
  gold:         '#C8960C',
  goldLight:    '#FDF3D0',
  charcoal:     '#1A1A2E',
  text:         '#1A1A1A',
  muted:        '#666666',
  border:       '#E5E7EB',
};

// ── Ashoka Chakra SVG ─────────────────────────────────────────────────────────
const AshokaChakra = ({ size = 32, color = C.navy }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="4" fill="none" />
    <circle cx="50" cy="50" r="6" fill={color} />
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const x1 = 50 + 6 * Math.cos(angle);
      const y1 = 50 + 6 * Math.sin(angle);
      const x2 = 50 + 44 * Math.cos(angle);
      const y2 = 50 + 44 * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.5" />;
    })}
  </svg>
);

// ── Indian Flag Triband Stripe ────────────────────────────────────────────────
const TriBand = ({ width = '100%' }) => (
  <div style={{ display: 'flex', width, height: '6px' }}>
    <div style={{ flex: 1, background: C.saffron }} />
    <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}` }} />
    <div style={{ flex: 1, background: C.green }} />
  </div>
);

// ── Signature Block ───────────────────────────────────────────────────────────
const SignatureBlock = ({ url, name, designation, org, align = 'left', lineColor = C.navy }) => {
  const isRight = align === 'right';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRight ? 'flex-end' : 'flex-start', minWidth: '160px' }}>
      {url ? (
        <img src={url} alt={`${name} signature`} style={{ height: '44px', objectFit: 'contain', marginBottom: '4px' }} />
      ) : (
        <div style={{
          width: '140px', height: '44px',
          border: `1px dashed ${C.border}`,
          borderRadius: '4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: C.muted, fontSize: '10px', marginBottom: '4px',
        }}>
          Signature
        </div>
      )}
      <div style={{ width: '140px', height: '2px', background: `linear-gradient(90deg, ${lineColor}, transparent)`, transform: isRight ? 'scaleX(-1)' : 'none', marginBottom: '5px' }} />
      <p style={{ color: C.text, fontWeight: 700, fontSize: '12px', margin: 0, textAlign: isRight ? 'right' : 'left' }}>{name}</p>
      {designation && <p style={{ color: C.muted, fontSize: '10px', margin: '1px 0 0', textAlign: isRight ? 'right' : 'left' }}>{designation}</p>}
      {org && <p style={{ color: C.muted, fontSize: '10px', margin: '1px 0 0', textAlign: isRight ? 'right' : 'left' }}>{org}</p>}
    </div>
  );
};

// ── Skill Badge ───────────────────────────────────────────────────────────────
const SkillBadge = ({ label }) => (
  <span style={{
    background: C.navyLight,
    color: C.navy,
    border: `1px solid ${C.navy}33`,
    borderRadius: '20px',
    padding: '3px 11px',
    fontSize: '11px',
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
  }}>
    {label}
  </span>
);

// ── Main Component ────────────────────────────────────────────────────────────
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
  neogenBranding = null,
  partnerBranding = null,
}) => {
  const certRef = useRef(null);

  useEffect(() => {
    if (onExportReady && certRef.current) onExportReady(certRef);
  }, [onExportReady]);

  const formattedDate = issueDate
    ? new Date(issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

  const qrValue = qrCodeData || `https://neogeninternshipengine.me/verify/${certificateId}`;

  // NEO GEN branding — always use logo.png from public folder as default
  const neoLogoUrl  = neogenBranding?.logoUrl  || '/logo.png';
  const neoCeoName  = neogenBranding?.ceoName  || 'Ankish Kumar';
  const neoCeoDesig = neogenBranding?.ceoDesignation || 'Founder & CEO, NEOGEN Internship Engine';
  const neoCeoSig   = neogenBranding?.ceoSignatureUrl || '';

  const partnerSigName  = partnerBranding?.signatoryName || issuerName || 'Authorized Signatory';
  const partnerSigDesig = partnerBranding?.signatoryDesignation || '';
  const partnerSigUrl   = partnerBranding?.signatureUrl || '';
  const partnerLogoUrl  = partnerBranding?.logoUrl || '';
  // HR details (second signatory on right side)
  const partnerHrName   = partnerBranding?.hrName || '';
  const partnerHrDesig  = partnerBranding?.hrDesignation || '';
  const partnerHrSigUrl = partnerBranding?.hrSignatureUrl || '';
  const isDualBranding  = !!partnerBranding;

  // ── CLASSIC TEMPLATE ────────────────────────────────────────────────────────
  if (templateId === 'classic') {
    return (
      <div
        ref={certRef}
        style={{
          width: '100%', maxWidth: '760px', margin: '0 auto',
          background: C.cream,
          border: `6px solid ${C.saffron}`,
          outline: `2px solid ${C.green}`,
          outlineOffset: '-12px',
          borderRadius: '6px',
          position: 'relative',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          fontFamily: 'Georgia, "Times New Roman", serif',
          overflow: 'hidden',
        }}
      >
        {/* Top triband */}
        <TriBand />

        {/* Corner Ashoka Chakras */}
        <div style={{ position: 'absolute', top: '18px', left: '18px', opacity: 0.12 }}>
          <AshokaChakra size={48} color={C.navy} />
        </div>
        <div style={{ position: 'absolute', top: '18px', right: '18px', opacity: 0.12 }}>
          <AshokaChakra size={48} color={C.navy} />
        </div>
        <div style={{ position: 'absolute', bottom: '18px', left: '18px', opacity: 0.12 }}>
          <AshokaChakra size={48} color={C.navy} />
        </div>
        <div style={{ position: 'absolute', bottom: '18px', right: '18px', opacity: 0.12 }}>
          <AshokaChakra size={48} color={C.navy} />
        </div>

        <div style={{ padding: '32px 48px 28px' }}>

          {/* Header: NEO GEN logo + partner logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '6px' }}>
            <img src={neoLogoUrl} alt="NEOGEN Internship Engine" style={{ height: '52px', objectFit: 'contain' }} onError={e => { e.target.style.display='none'; }} />
            {isDualBranding && (
              <>
                <span style={{ color: C.saffron, fontSize: '20px' }}>✦</span>
                {partnerLogoUrl
                  ? <img src={partnerLogoUrl} alt="Partner" style={{ height: '48px', objectFit: 'contain' }} />
                  : <span style={{ fontSize: '14px', fontWeight: 700, color: C.green, fontFamily: 'Inter,sans-serif' }}>{organization}</span>
                }
              </>
            )}
          </div>

          {/* Company full name */}
          <div style={{ textAlign: 'center', marginBottom: '4px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: C.green, letterSpacing: '3px', textTransform: 'uppercase', fontFamily: 'Inter,sans-serif', margin: 0 }}>
              NEOGEN INTERNSHIP ENGINE
            </p>
          </div>

          {/* Ashoka Chakra divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '10px 0' }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${C.saffron})` }} />
            <AshokaChakra size={22} color={C.navy} />
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
          </div>

          {/* Title */}
          <div style={{ textAlign: 'center', margin: '16px 0 8px' }}>
            <p style={{ fontSize: '24px', fontWeight: 700, color: C.navy, letterSpacing: '1px', margin: 0 }}>
              {title}
            </p>
            <p style={{ fontSize: '12px', color: C.muted, marginTop: '6px', fontFamily: 'Inter,sans-serif', letterSpacing: '1px' }}>
              THIS IS TO CERTIFY THAT
            </p>
          </div>

          {/* Student Name */}
          <div style={{ textAlign: 'center', margin: '12px 0 16px' }}>
            <p style={{
              fontSize: '34px', fontWeight: 800, color: C.saffronDark,
              borderBottom: `3px solid ${C.saffron}`,
              display: 'inline-block', paddingBottom: '6px',
              wordBreak: 'break-word', maxWidth: '580px', lineHeight: 1.2, margin: 0,
            }}>
              {studentName || 'Student Full Name'}
            </p>
          </div>

          {/* Body */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: C.text, lineHeight: 1.8, margin: '0 0 12px' }}>
            has successfully completed the internship programme as{' '}
            <strong style={{ color: C.navy }}>{role || 'Intern'}</strong>{' '}at{' '}
            <strong style={{ color: C.green }}>{organization || 'Organization'}</strong>
            {duration ? `, for a duration of ${duration}` : ''}.
          </p>
          {description && (
            <p style={{ textAlign: 'center', fontSize: '13px', color: C.muted, lineHeight: 1.7, margin: '0 0 12px' }}>
              {description}
            </p>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div style={{ textAlign: 'center', margin: '12px 0' }}>
              <p style={{ color: C.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'Inter,sans-serif', marginBottom: '8px' }}>
                Skills Demonstrated
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
                {skills.map((s, i) => <SkillBadge key={i} label={s} />)}
              </div>
            </div>
          )}

          {/* Ashoka Chakra divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0 16px' }}>
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${C.saffron})` }} />
            <AshokaChakra size={18} color={C.navy} />
            <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
          </div>

          {/* Footer row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* Issue date + cert ID */}
            <div style={{ minWidth: '120px' }}>
              <p style={{ color: C.muted, fontSize: '10px', fontFamily: 'Inter,sans-serif', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px' }}>Issue Date</p>
              <p style={{ color: C.navy, fontWeight: 700, fontSize: '13px', fontFamily: 'Inter,sans-serif', margin: 0 }}>{formattedDate}</p>
              {certificateId && (
                <p style={{ color: C.muted, fontSize: '9px', fontFamily: 'monospace', marginTop: '6px' }}>{certificateId}</p>
              )}
            </div>

            {/* QR */}
            {qrValue && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <div style={{ padding: '6px', background: C.white, border: `2px solid ${C.navy}22`, borderRadius: '6px' }}>
                  <QRCode value={qrValue} size={68} fgColor={C.navy} />
                </div>
                <p style={{ color: C.muted, fontSize: '9px', fontFamily: 'Inter,sans-serif' }}>Scan to verify</p>
              </div>
            )}

            {/* Signatures */}
            {isDualBranding ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '12px' }}>
                {/* LEFT — NEO GEN CEO */}
                <SignatureBlock url={neoCeoSig} name={neoCeoName} designation={neoCeoDesig} lineColor={C.saffron} align="left" />
                {/* RIGHT — Company CEO + HR */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                  {partnerLogoUrl && (
                    <img src={partnerLogoUrl} alt="Company Logo" style={{ height: '32px', objectFit: 'contain', marginBottom: '2px' }} />
                  )}
                  <SignatureBlock url={partnerSigUrl} name={partnerSigName} designation={partnerSigDesig} org={!partnerHrName ? (organization || '') : ''} lineColor={C.green} align="right" />
                  {partnerHrName && (
                    <SignatureBlock url={partnerHrSigUrl} name={partnerHrName} designation={partnerHrDesig} org={organization || ''} lineColor={C.green} align="right" />
                  )}
                </div>
              </div>
            ) : (
              <SignatureBlock url={neoCeoSig} name={neoCeoName} designation={neoCeoDesig} lineColor={C.saffron} align="right" />
            )}
          </div>
        </div>

        {/* Bottom triband */}
        <TriBand />
      </div>
    );
  }

  // ── MODERN TEMPLATE — Indian flag theme (clean card version of Classic) ──────
  return (
    <div
      ref={certRef}
      style={{
        width: '100%', maxWidth: '760px', margin: '0 auto',
        background: C.cream,
        border: `4px solid ${C.navy}`,
        outline: `2px solid ${C.saffron}`,
        outlineOffset: '-10px',
        borderRadius: '8px',
        position: 'relative',
        boxShadow: '0 10px 40px rgba(0,0,80,0.16)',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Top triband */}
      <TriBand />

      {/* Faint chakra corners */}
      <div style={{ position: 'absolute', top: '16px', left: '16px', opacity: 0.08 }}>
        <AshokaChakra size={44} color={C.navy} />
      </div>
      <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.08 }}>
        <AshokaChakra size={44} color={C.navy} />
      </div>
      <div style={{ position: 'absolute', bottom: '16px', left: '16px', opacity: 0.08 }}>
        <AshokaChakra size={44} color={C.navy} />
      </div>
      <div style={{ position: 'absolute', bottom: '16px', right: '16px', opacity: 0.08 }}>
        <AshokaChakra size={44} color={C.navy} />
      </div>

      <div style={{ padding: '28px 44px 24px' }}>

        {/* Header: logos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={neoLogoUrl} alt="NEOGEN Internship Engine" style={{ height: '48px', objectFit: 'contain' }}
              onError={e => { e.target.style.display='none'; }} />
            <div>
              <p style={{ color: C.saffron, fontSize: '20px', fontWeight: 800, letterSpacing: '1px', margin: 0, lineHeight: 1 }}>NEOGEN</p>
              <p style={{ color: C.green, fontSize: '10px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', margin: '2px 0 0' }}>
                INTERNSHIP ENGINE
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {isDualBranding && (
              partnerLogoUrl
                ? <img src={partnerLogoUrl} alt="Company Logo" style={{ height: '40px', objectFit: 'contain' }} />
                : <p style={{ color: C.navy, fontSize: '13px', fontWeight: 700 }}>{organization}</p>
            )}
            {certificateId && (
              <p style={{ color: C.muted, fontSize: '9px', fontFamily: 'monospace' }}>{certificateId}</p>
            )}
          </div>
        </div>

        {/* Chakra divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${C.saffron})` }} />
          <AshokaChakra size={20} color={C.navy} />
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
        </div>

        {/* Title */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontSize: '11px', color: C.muted, textTransform: 'uppercase', letterSpacing: '2px', margin: '0 0 6px' }}>
            This certifies that
          </p>
          <p style={{
            fontSize: '30px', fontWeight: 800, color: C.saffronDark,
            borderBottom: `2px solid ${C.saffron}`,
            display: 'inline-block', paddingBottom: '4px',
            wordBreak: 'break-word', maxWidth: '580px', lineHeight: 1.2, margin: '0 0 10px',
          }}>
            {studentName || 'Student Full Name'}
          </p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: C.navy, margin: 0 }}>
            {title || 'Internship Completion Certificate'}
          </p>
        </div>

        {/* Body text */}
        <p style={{ fontSize: '13px', color: C.text, lineHeight: 1.8, margin: '0 0 12px' }}>
          has successfully completed the internship programme as{' '}
          <strong style={{ color: C.navy }}>{role || 'Intern'}</strong>{' '}at{' '}
          <strong style={{ color: C.green }}>{organization || 'Organization'}</strong>
          {duration ? `, for a duration of ${duration}` : ''}.
        </p>
        {description && (
          <p style={{ fontSize: '12px', color: C.muted, lineHeight: 1.7, margin: '0 0 12px' }}>{description}</p>
        )}

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px 20px', marginBottom: '14px', background: C.navyLight, borderRadius: '8px', padding: '12px 16px' }}>
          {[
            { label: 'Role', value: role },
            { label: 'Duration', value: duration },
            { label: 'Issue Date', value: formattedDate },
          ].filter(i => i.value).map(({ label, value }) => (
            <div key={label}>
              <p style={{ color: C.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 2px' }}>{label}</p>
              <p style={{ color: C.navy, fontWeight: 700, fontSize: '12px', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: C.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 7px' }}>
              Skills Demonstrated
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {skills.map((s, i) => <SkillBadge key={i} label={s} />)}
            </div>
          </div>
        )}

        {/* Chakra divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, transparent, ${C.saffron})` }} />
          <AshokaChakra size={16} color={C.navy} />
          <div style={{ flex: 1, height: '1px', background: `linear-gradient(90deg, ${C.green}, transparent)` }} />
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          {/* Issue date + cert id */}
          <div style={{ minWidth: '100px' }}>
            <p style={{ color: C.muted, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 3px' }}>Issue Date</p>
            <p style={{ color: C.navy, fontWeight: 700, fontSize: '12px', fontFamily: 'Inter,sans-serif', margin: 0 }}>{formattedDate}</p>
            {certificateId && (
              <p style={{ color: C.muted, fontSize: '9px', fontFamily: 'monospace', marginTop: '4px' }}>{certificateId}</p>
            )}
          </div>

          {/* QR */}
          {qrValue && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{ padding: '5px', background: C.white, border: `2px solid ${C.navy}22`, borderRadius: '6px' }}>
                <QRCode value={qrValue} size={64} fgColor={C.navy} />
              </div>
              <p style={{ color: C.muted, fontSize: '9px' }}>Scan to verify</p>
            </div>
          )}

          {/* Signatures */}
          {isDualBranding ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
              {partnerLogoUrl && (
                <img src={partnerLogoUrl} alt="Company" style={{ height: '28px', objectFit: 'contain' }} />
              )}
              <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                <SignatureBlock url={neoCeoSig} name={neoCeoName} designation={neoCeoDesig} lineColor={C.saffron} align="left" />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <SignatureBlock url={partnerSigUrl} name={partnerSigName} designation={partnerSigDesig}
                    org={!partnerHrName ? (organization || '') : ''} lineColor={C.green} align="right" />
                  {partnerHrName && (
                    <SignatureBlock url={partnerHrSigUrl} name={partnerHrName} designation={partnerHrDesig}
                      org={organization || ''} lineColor={C.green} align="right" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <SignatureBlock url={neoCeoSig} name={neoCeoName} designation={neoCeoDesig} lineColor={C.saffron} align="right" />
          )}
        </div>
      </div>

      {/* Bottom triband */}
      <TriBand />
    </div>
  );
};

export default CertificatePreview;
