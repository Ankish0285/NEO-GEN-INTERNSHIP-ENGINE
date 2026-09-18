import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InternshipList from '../components/home/InternshipList';

class InternshipListErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Something went wrong.' };
  }

  componentDidCatch(error, info) {
    console.error('[FindInternship] InternshipList crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
            Unable to load internships
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{this.state.errorMessage}</p>
          <button
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            style={{
              padding: '10px 24px',
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const FindInternship = () => {
  return (
    <div className="find-internship-page">
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 300px)' }}>
        <InternshipListErrorBoundary>
          <InternshipList />
        </InternshipListErrorBoundary>
      </div>
      <Footer />
    </div>
  );
};

export default FindInternship;
