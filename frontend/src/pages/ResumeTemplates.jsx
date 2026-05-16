import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ResumeTemplates = () => {
  return (
    <div className="page">
      <Navbar />
      <div className="container" style={{ padding: '120px 20px 60px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '20px' }}>Resume Templates</h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '40px' }}>
          Choose from our collection of ATS-friendly resume templates.
        </p>
        
        <div style={{ padding: '40px', backgroundColor: '#f9fafb', borderRadius: '12px', textAlign: 'center', border: '1px dashed #d1d5db' }}>
          <p style={{ color: '#6b7280' }}>Template library coming soon...</p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResumeTemplates;
