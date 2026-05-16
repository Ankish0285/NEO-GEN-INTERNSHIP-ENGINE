import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero" style={{
      background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      padding: '120px 0',
      textAlign: 'left'
    }}>
        <div className="container">
            <div className="hero-content" style={{ maxWidth: '600px', margin: '0' }}>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '700', marginBottom: '20px', color: 'white' }}>
                  Launch Your Career <br /> with <span style={{ color: '#f97316' }}>NEO</span> <span style={{ color: '#16a34a' }}>GEN</span>
                </h1>
                <p className="hero-subtitle" style={{ color: '#e5e7eb', fontSize: '1.25rem', marginBottom: '40px' }}>
                  Discover opportunities across various government departments and ministries with AI-powered matching, ATS score optimization, and 24/7 chatbot support.
                </p>
                <div className="hero-actions" style={{ justifyContent: 'flex-start', gap: '20px' }}>
                    <button 
                      className="btn" 
                      id="findInternshipBtn" 
                      style={{ 
                        backgroundColor: '#f97316', 
                        color: 'white', 
                        border: 'none', 
                        padding: '12px 24px', 
                        fontSize: '1rem', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        const element = document.getElementById('internships-section');
                        if (element) element.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      Find an Internship
                    </button>
                    <button 
                      className="btn" 
                      id="postInternshipBtn"
                      style={{ 
                        backgroundColor: '#16a34a', 
                        color: 'white', 
                        border: 'none', 
                        padding: '12px 24px', 
                        fontSize: '1rem', 
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        navigate('/partner/dashboard/post-internship');
                      }}
                    >
                      Post an Internship
                    </button>
                </div>
            </div>
        </div>
    </section>
  );
};

export default Hero;
