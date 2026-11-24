// Branded HTML email templates for the centralized notification system.
// All templates are pure functions returning { subject, html }.
// Branding: Indian tricolor (saffron #FF9933 / white / green #138808) + navy #000080.

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://neogeninternshipengine.me';

// Inline-SVG emblem so emails carry the brand even without an external logo URL.
const LOGO_SVG = `<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <rect width="60" height="60" rx="14" fill="#000080"/>
  <text x="30" y="39" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="24" font-weight="700" fill="#ffffff">NG</text>
  <rect x="14" y="46" width="32" height="3" rx="1.5" fill="#FF9933"/>
  <rect x="14" y="51" width="32" height="3" rx="1.5" fill="#138808"/>
</svg>`;

// Shared wrapper. Inline styles for max email-client compatibility.
const emailLayout = ({ preheader = '', title, bodyHtml, ctaText = '', ctaUrl = '' }) => {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${title}</title>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#ffffff;">${preheader}</div>` : ''}
</head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5f7;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#FF9933;height:6px;font-size:0;line-height:6px;width:33.33%;">&nbsp;</td>
                  <td style="background-color:#ffffff;height:6px;font-size:0;line-height:6px;width:33.34%;">&nbsp;</td>
                  <td style="background-color:#138808;height:6px;font-size:0;line-height:6px;width:33.33%;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 24px 16px 24px;background-color:#000080;">
              ${LOGO_SVG}
              <div style="margin-top:10px;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:1px;">NEOGEN INTERNSHIP ENGINE</div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px 24px;">
              <h1 style="margin:0;color:#000080;font-size:22px;line-height:1.3;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 24px 24px;">
              <div style="color:#374151;font-size:15px;line-height:1.6;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          ${ctaText && ctaUrl ? `<tr>
            <td align="center" style="padding:0 24px 28px 24px;">
              <a href="${ctaUrl}" style="display:inline-block;background-color:#FF9933;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 30px;border-radius:8px;">${ctaText}</a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:18px 24px;background-color:#f9fafb;border-top:1px solid #eef0f3;">
              <p style="margin:0;color:#6b7280;font-size:12px;line-height:1.5;text-align:center;">
                You received this email because of your activity on NEOGEN INTERNSHIP ENGINE.<br>
                Manage your preferences at <a href="${FRONTEND_URL}/dashboard/settings" style="color:#138808;text-decoration:none;">Dashboard Settings</a>.
              </p>
              <p style="margin:8px 0 0 0;color:#9ca3af;font-size:11px;text-align:center;">&copy; ${year} NEOGEN INTERNSHIP ENGINE. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const esc = (value) => String(value == null ? '' : value);

const welcomeEmail = (user) => {
  const name = user && user.name ? user.name : 'there';
  return {
    subject: 'Welcome to NEOGEN INTERNSHIP ENGINE!',
    html: emailLayout({
      preheader: 'Your journey at NEOGEN starts here',
      title: `Welcome, ${esc(name)}!`,
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        <p>Welcome to <strong>NEOGEN INTERNSHIP ENGINE</strong> — the platform connecting talented students with meaningful internship opportunities.</p>
        <p>Your account is ready. Here is what you can do next:</p>
        <ul style="padding-left:20px;margin:12px 0;">
          <li>Browse internships matched to your skills</li>
          <li>Complete your profile for better recommendations</li>
          <li>Upload your resume and track applications</li>
        </ul>`,
      ctaText: 'Explore Internships',
      ctaUrl: `${FRONTEND_URL}/internships`,
    }),
  };
};

const newInternshipEmail = (user, internship) => {
  const name = user && user.name ? user.name : 'there';
  const title = internship && internship.title ? internship.title : 'a new internship';
  const org = internship && internship.organization ? internship.organization : 'an organization';
  const rows = [
    `<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;width:40%;">ROLE</td><td style="padding:12px 16px;color:#111827;font-weight:600;">${esc(title)}</td></tr>`,
    `<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">ORGANIZATION</td><td style="padding:12px 16px;color:#111827;font-weight:600;">${esc(org)}</td></tr>`,
  ];
  if (internship && internship.location) rows.push(`<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">LOCATION</td><td style="padding:12px 16px;color:#111827;">${esc(internship.location)}</td></tr>`);
  if (internship && internship.duration) rows.push(`<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">DURATION</td><td style="padding:12px 16px;color:#111827;">${esc(internship.duration)}</td></tr>`);
  if (internship && internship.stipend) rows.push(`<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">STIPEND</td><td style="padding:12px 16px;color:#111827;">${esc(internship.stipend)}</td></tr>`);
  return {
    subject: `New Internship: ${title} at ${org}`,
    html: emailLayout({
      preheader: `New opportunity: ${title}`,
      title: 'New Internship Opportunity',
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        <p>A new internship matching your interests has just been published:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;border:1px solid #eef0f3;border-radius:10px;overflow:hidden;">
          ${rows.join('')}
        </table>
        <p>Apply before the deadline to secure your spot.</p>`,
      ctaText: 'View Internship',
      ctaUrl: `${FRONTEND_URL}/internships/${internship && internship._id ? esc(internship._id) : ''}`,
    }),
  };
};

const newSuccessStoryEmail = (user, story) => {
  const name = user && user.name ? user.name : 'there';
  const author = story && story.name ? story.name : 'a student';
  const company = story && story.company ? story.company : '';
  const headline = company ? `${author} — ${company}` : author;
  return {
    subject: `New Success Story from ${author}`,
    html: emailLayout({
      preheader: `Read how ${author} succeeded`,
      title: 'New Success Story',
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        <p>A new success story has just been published on NEOGEN INTERNSHIP ENGINE.</p>
        <p style="font-weight:600;color:#000080;">${esc(headline)}</p>
        <p>Read it and get inspired for your own internship journey.</p>`,
      ctaText: 'Read Success Stories',
      ctaUrl: `${FRONTEND_URL}/success-stories`,
    }),
  };
};

const certificateIssuedEmail = (user, certificate) => {
  const name = user && user.name ? user.name : 'there';
  const certTitle = certificate && certificate.title ? certificate.title : 'Internship Completion Certificate';
  const certId = certificate && certificate.certificateId ? certificate.certificateId : '';
  const org = certificate && certificate.organization ? certificate.organization : '';
  const role = certificate && certificate.role ? certificate.role : '';
  return {
    subject: `Your Certificate Has Been Issued — ${certTitle}`,
    html: emailLayout({
      preheader: 'Your certificate is now active',
      title: 'Certificate Issued',
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        <p>Congratulations! Your certificate has been issued and is now active.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:16px 0;border:1px solid #eef0f3;border-radius:10px;overflow:hidden;">
          <tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;width:40%;">CERTIFICATE</td><td style="padding:12px 16px;color:#111827;font-weight:600;">${esc(certTitle)}</td></tr>
          ${certId ? `<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">CERT ID</td><td style="padding:12px 16px;color:#111827;">${esc(certId)}</td></tr>` : ''}
          ${org ? `<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">ORGANIZATION</td><td style="padding:12px 16px;color:#111827;">${esc(org)}</td></tr>` : ''}
          ${role ? `<tr><td style="padding:12px 16px;background-color:#f9fafb;color:#6b7280;font-size:12px;">ROLE</td><td style="padding:12px 16px;color:#111827;">${esc(role)}</td></tr>` : ''}
        </table>
        <p>You can view and download it from your certificate passport.</p>`,
      ctaText: 'View My Certificate',
      ctaUrl: `${FRONTEND_URL}/dashboard/passport`,
    }),
  };
};

const certificateStatusEmail = (user, certificate, statusLabel) => {
  const name = user && user.name ? user.name : 'there';
  const certTitle = certificate && certificate.title ? certificate.title : 'your certificate';
  const certId = certificate && certificate.certificateId ? certificate.certificateId : '';
  const label = statusLabel === 'revoked' ? 'revoked' : 'active';
  const body =
    label === 'revoked'
      ? `<p>Please note that your certificate <strong>${esc(certTitle)}</strong>${certId ? ` (ID: ${esc(certId)})` : ''} has been <strong>revoked</strong>.</p>
         <p>If you believe this is a mistake, please contact support.</p>`
      : `<p>Good news! Your certificate <strong>${esc(certTitle)}</strong>${certId ? ` (ID: ${esc(certId)})` : ''} has been <strong>verified and is now active</strong>.</p>
         <p>You can view and share it from your certificate passport.</p>`;
  return {
    subject: `Certificate Update: ${label === 'revoked' ? 'Revoked' : 'Verified & Active'} — ${certTitle}`,
    html: emailLayout({
      preheader: `Certificate status: ${label}`,
      title: 'Certificate Status Update',
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        ${body}`,
      ctaText: label === 'revoked' ? 'Go to Dashboard' : 'View My Certificate',
      ctaUrl: `${FRONTEND_URL}/dashboard/passport`,
    }),
  };
};

const announcementEmail = (user, { subject, title, body, cta, ctaUrl } = {}) => {
  const name = user && user.name ? user.name : 'there';
  const heading = title || 'Platform Announcement';
  return {
    subject: subject || heading,
    html: emailLayout({
      preheader: heading,
      title: heading,
      bodyHtml: `
        <p>Hi <strong>${esc(name)}</strong>,</p>
        <p>${esc(body || '')}</p>`,
      ctaText: cta || 'Learn More',
      ctaUrl: ctaUrl || FRONTEND_URL,
    }),
  };
};

module.exports = {
  emailLayout,
  welcomeEmail,
  newInternshipEmail,
  newSuccessStoryEmail,
  certificateIssuedEmail,
  certificateStatusEmail,
  announcementEmail,
};
