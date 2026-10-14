/**
 * NotFound  —  404 page for unmatched routes.
 *
 * SEO: emits <meta name="robots" content="noindex, follow"> so search
 * engines don't index dead URLs, but still follow links back to the
 * valid parts of the site.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Home as HomeIcon, Search, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '../seo/useSEO';

const NotFound = () => {
  useSEO({
    title: 'Page Not Found (404)',
    description:
      'The page you are looking for does not exist or has been moved. ' +
      'Browse internships, success stories, and resume templates on NEOGEN INTERNSHIP ENGINE.',
    canonical: 'https://neogeninternshipengine.me/',
    noIndex: true,
  });

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 20px 60px',
          background: 'linear-gradient(180deg,#f8fafc 0%,#fff 100%)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 560 }}>
          <div
            style={{
              fontSize: 'clamp(5rem, 18vw, 9rem)',
              fontWeight: 900,
              lineHeight: 1,
              background: 'linear-gradient(135deg,#FF9933,#e68a2e)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 8,
            }}
          >
            404
          </div>
          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: 800,
              color: '#111827',
              marginBottom: 12,
            }}
          >
            Page not found
          </h1>
          <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            The page you are looking for might have been removed, renamed, or
            is temporarily unavailable. Let's get you back on track.
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 26px',
                borderRadius: 10,
                background: 'linear-gradient(135deg,#FF9933,#e68a2e)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <HomeIcon size={16} /> Go to Home
            </Link>
            <Link
              to="/find-internship"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 26px',
                borderRadius: 10,
                background: '#fff',
                color: '#374151',
                border: '1.5px solid #e5e7eb',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <Search size={16} /> Browse Internships
            </Link>
            <Link
              to="/success-stories"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 26px',
                borderRadius: 10,
                background: '#fff',
                color: '#374151',
                border: '1.5px solid #e5e7eb',
                fontWeight: 700,
                fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <ArrowLeft size={16} /> Success Stories
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default NotFound;
