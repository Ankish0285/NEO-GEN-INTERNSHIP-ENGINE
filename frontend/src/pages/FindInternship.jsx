import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InternshipList from '../components/home/InternshipList';

const FindInternship = () => {
  return (
    <div className="page">
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: 'calc(100vh - 300px)' }}>
        <InternshipList />
      </div>
      <Footer />
    </div>
  );
};

export default FindInternship;
