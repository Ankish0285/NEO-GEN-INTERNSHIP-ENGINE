import React from 'react';

const Policies = () => {
  return (
    <>
      <section className="policy-section" id="privacy-policy" style={{ padding: '60px 0', backgroundColor: '#fff' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Privacy Policy</h2>
            <p style={{ color: '#6b7280' }}>How we handle your data</p>
          </div>
          <div style={{ color: '#4b5563', lineHeight: 1.7 }}>
            <p>We collect only what’s needed to operate the platform: account details, profile information, applications, and support messages.</p>
            <p>Data is stored securely and used to match internships, improve services, and comply with legal requirements. We never sell your data.</p>
            <p>You can access, update, or delete your information by contacting support. For security, we use encryption and strict access controls.</p>
          </div>
        </div>
      </section>
      <section className="policy-section" id="terms-of-service" style={{ padding: '60px 0', backgroundColor: '#f9fafb' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Terms of Service</h2>
            <p style={{ color: '#6b7280' }}>Simple rules for using NEO GEN</p>
          </div>
          <div style={{ color: '#4b5563', lineHeight: 1.7 }}>
            <p>Use accurate information and respect application guidelines. Do not submit false documents or misuse the platform.</p>
            <p>We provide best-effort matching and tools; selections are made by partnering agencies. Accounts may be limited or terminated for policy violations.</p>
            <p>By using NEO GEN, you agree to these terms and our privacy and cookie policies.</p>
          </div>
        </div>
      </section>
      <section className="policy-section" id="cookie-policy" style={{ padding: '60px 0', backgroundColor: '#fff' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>Cookie Policy</h2>
            <p style={{ color: '#6b7280' }}>Cookies that keep things running</p>
          </div>
          <div style={{ color: '#4b5563', lineHeight: 1.7 }}>
            <p>We use essential cookies for login, session security, and analytics to improve performance. No tracking for advertising.</p>
            <p>You can control cookies in your browser. Disabling essential cookies may affect core features like authentication.</p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Policies;
