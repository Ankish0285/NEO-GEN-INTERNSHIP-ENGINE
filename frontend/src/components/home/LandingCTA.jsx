import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import MotionSection from '../ui/MotionSection';

const LandingCTA = () => {
  const navigate = useNavigate();

  return (
    <MotionSection className="neo-section">
      <div className="neo-container">
        <div className="neo-cta neo-glass">
          <h2 className="neo-h2 mb-3">Ready to start your journey?</h2>
          <p className="neo-lead max-w-xl mx-auto mb-8">
            Explore internships across India or partner with NeoGen to reach talented students nationwide.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              type="button"
              className="neo-btn neo-btn-primary"
              onClick={() => {
                const el = document.getElementById('internships-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Browse Internships
              <ArrowRight size={18} />
            </button>
            <button type="button" className="neo-btn neo-btn-success" onClick={() => navigate('/partner/login')}>
              Become a Partner
            </button>
          </div>
        </div>
      </div>
    </MotionSection>
  );
};

export default LandingCTA;
