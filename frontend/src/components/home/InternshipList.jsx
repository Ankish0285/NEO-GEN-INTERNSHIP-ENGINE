import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, DollarSign, Clock, ArrowRight, Filter, Briefcase, Building } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getResumeFromStorage, isResumeUploaded } from '../../utils/storageUtils';
import ApplicationService from '../../services/applicationService';
import AIApplicationModal from './AIApplicationModal';

const InternshipList = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [internships, setInternships] = useState([]);
  const [filteredInternships, setFilteredInternships] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    location: '',
    duration: '',
    stipendRange: '',
    field: '',
    deadlineUrgency: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [loadingApply, setLoadingApply] = useState({});
  const [appliedInternships, setAppliedInternships] = useState(new Set());
  const [myApplications, setMyApplications] = useState([]);
  const [userResume, setUserResume] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);

  const fetchInternships = async () => {
    try {
      const data = await api.get('/internships');
      if (Array.isArray(data)) {
        setInternships(data);
        setFilteredInternships(data);
      }
    } catch (error) {
      console.error("Failed to fetch internships", error);
      // Fallback mock data
      const mockData = [
        { 
          _id: '1', 
          title: 'Policy Research Intern', 
          organization: 'NITI Aayog', 
          location: 'New Delhi', 
          duration: '3 months', 
          stipend: '₹10,000/month',
          deadline: '2025-02-15',
          skills: ['Policy', 'Research', 'Economics'],
          description: 'Work on policy research projects related to economic development'
        },
        { 
          _id: '2', 
          title: 'Web Development Intern', 
          organization: 'Ministry of Electronics & IT', 
          location: 'Remote', 
          duration: '6 months', 
          stipend: '₹15,000/month',
          deadline: '2025-02-20',
          skills: ['Web Dev', 'React', 'GovTech'],
          description: 'Develop web applications for government transparency initiatives'
        },
      ];
      setInternships(mockData);
      setFilteredInternships(mockData);
    }
  };

  const fetchMyData = async () => {
    if (!isAuthenticated) return;
    try {
      // Fetch applications
      const appData = await ApplicationService.getMyApplications();
      setMyApplications(appData);
      const applied = new Set(appData.map(app => (app.internship._id || app.internship)));
      setAppliedInternships(applied);

      // Check localStorage first for resume data
      const storedResume = getResumeFromStorage();
      if (storedResume && isResumeUploaded()) {
        setUserResume(storedResume);
        return; // Use localStorage data
      }

      // Skip backend check for resume status to remove dependency
      // Use local storage as the source of truth
      setUserResume(null);
    } catch (error) {
      console.error("Failed to fetch user data", error);
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchMyData();
  }, [isAuthenticated]);

  useEffect(() => {
    let result = [...internships];
    
    // Text search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(i => 
        (i.title || '').toLowerCase().includes(searchLower) || 
        (i.organization || '').toLowerCase().includes(searchLower) ||
        (i.description || '').toLowerCase().includes(searchLower) ||
        (i.skills || []).some(f => f.toLowerCase().includes(searchLower))
      );
    }
    
    // Department filter
    if (filters.department) {
      result = result.filter(i => (i.organization || '').includes(filters.department));
    }
    
    // Location filter
    if (filters.location) {
      result = result.filter(i => i.location === filters.location);
    }
    
    // Duration filter
    if (filters.duration) {
      result = result.filter(i => {
        const duration = i.duration.toLowerCase();
        if (filters.duration === '1-3') return duration.includes('1') || duration.includes('2') || duration.includes('3');
        if (filters.duration === '4-6') return duration.includes('4') || duration.includes('5') || duration.includes('6');
        if (filters.duration === '6+') return duration.includes('6') || duration.includes('7') || duration.includes('8') || duration.includes('9') || duration.includes('12');
        return true;
      });
    }
    
    // Stipend filter
    if (filters.stipendRange) {
      result = result.filter(i => {
        const stipendStr = (i.stipend || '').replace(/[^0-9]/g, '');
        const stipend = parseInt(stipendStr);
        if (isNaN(stipend)) return true; // Include if we can't parse
        
        if (filters.stipendRange === '0-10000') return stipend < 10000;
        if (filters.stipendRange === '10000-20000') return stipend >= 10000 && stipend < 20000;
        if (filters.stipendRange === '20000+') return stipend >= 20000;
        return true;
      });
    }
    
    // Field filter
    if (filters.field) {
      result = result.filter(i => (i.skills || []).includes(filters.field));
    }
    
    // Deadline urgency filter
    if (filters.deadlineUrgency) {
      const now = new Date();
      result = result.filter(i => {
        const deadline = new Date(i.deadline);
        const daysUntil = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (filters.deadlineUrgency === 'urgent') return daysUntil <= 7;
        if (filters.deadlineUrgency === 'soon') return daysUntil <= 30;
        return true;
      });
    }
    
    // Sorting
    if (sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    } else if (sortBy === 'stipend') {
      result.sort((a, b) => {
        const stipendA = parseInt((a.stipend || '').replace(/[^0-9]/g, '')) || 0;
        const stipendB = parseInt((b.stipend || '').replace(/[^0-9]/g, '')) || 0;
        return stipendB - stipendA;
      });
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    
    setFilteredInternships(result);
  }, [search, filters, sortBy, internships]);

  const handleApply = (internshipId) => {
    console.log("Applying for internship:", internshipId);
    if (!isAuthenticated) {
      alert('Please login to apply for internships');
      return;
    }

    if (!internshipId) {
      console.error("No internship ID provided");
      return;
    }

    setSelectedInternshipId(internshipId);
    setShowApplyForm(true);
  };

  const handleWithdraw = async (internshipId) => {
    const application = myApplications.find(app => 
      String(app.internship._id || app.internship) === String(internshipId)
    );
    if (!application) return;

    if (!window.confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
      return;
    }

    setLoadingApply(prev => ({ ...prev, [internshipId]: true }));
    try {
      const response = await ApplicationService.withdrawApplication(application._id || application.id);
      console.log('Withdraw response:', response);
      
      // Update local state
      setAppliedInternships(prev => {
        const next = new Set(prev);
        next.delete(internshipId);
        return next;
      });
      setMyApplications(prev => prev.filter(app => (app._id || app.id) !== (application._id || application.id)));
      
      alert('Application withdrawn successfully.');
    } catch (error) {
      console.error('Error withdrawing application:', error);
      const errorMessage =
        error.message || error.data?.message || error.response?.data?.message || 'Failed to withdraw application.';
      alert(errorMessage);
    } finally {
      setLoadingApply(prev => ({ ...prev, [internshipId]: false }));
    }
  };

  const filteredData = filteredInternships;

  return (
    <section className="internships-section" id="internships-section">
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Featured Internships</h2>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Explore top opportunities handpicked for you</p>
          </div>
          
          {/* Search Bar with Enhanced Filters */}
          <div className="search-container" style={{ marginTop: '30px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f3f4f6' }}>
              <div style={{ flex: '1', minWidth: '250px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search className="text-gray-400" size={20} style={{ position: 'absolute', left: '12px' }} />
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by title, organization, or skills..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '12px 12px 12px 40px', 
                    border: 'none', 
                    outline: 'none',
                    fontSize: '1rem'
                  }}
                />
              </div>
              
              <div style={{ height: '30px', width: '1px', backgroundColor: '#e5e7eb', display: window.innerWidth > 768 ? 'block' : 'none' }}></div>

              <select 
                className="form-control" 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ 
                  minWidth: '180px', 
                  padding: '10px 12px', 
                  border: 'none', 
                  backgroundColor: 'transparent', 
                  fontSize: '0.95rem', 
                  color: '#4b5563',
                  cursor: 'pointer'
                }}
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="deadline">Sort by Deadline</option>
                <option value="stipend">Sort by Stipend</option>
                <option value="recent">Sort by Recent</option>
              </select>
              
              <button 
                className="btn" 
                onClick={() => setShowFilters(!showFilters)}
                style={{ 
                  padding: '10px 20px', 
                  whiteSpace: 'nowrap', 
                  backgroundColor: showFilters ? '#e5e7eb' : '#f3f4f6', 
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <Filter size={18} />
                {showFilters ? 'Hide Filters' : 'Filters'}
              </button>
            </div>
            
            {/* Advanced Filters Panel */}
            {showFilters && (
              <div className="filters-panel" style={{ 
                marginTop: '15px', 
                padding: '20px', 
                backgroundColor: '#f9f9f9', 
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '15px'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Organization</label>
                  <select 
                    className="form-control"
                    value={filters.department}
                    onChange={(e) => setFilters({...filters, department: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">All Organizations</option>
                    <option value="NITI Aayog">NITI Aayog</option>
                    <option value="Ministry of Electronics & IT">Electronics & IT</option>
                    <option value="Ministry of Foreign Affairs">Foreign Affairs</option>
                    <option value="RBI">RBI</option>
                    <option value="ISRO">ISRO</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Location</label>
                  <select 
                    className="form-control"
                    value={filters.location}
                    onChange={(e) => setFilters({...filters, location: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">All Locations</option>
                    <option value="New Delhi">New Delhi</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Duration</label>
                  <select 
                    className="form-control"
                    value={filters.duration}
                    onChange={(e) => setFilters({...filters, duration: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Any Duration</option>
                    <option value="1-3">1-3 months</option>
                    <option value="4-6">4-6 months</option>
                    <option value="6+">6+ months</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Stipend Range</label>
                  <select 
                    className="form-control"
                    value={filters.stipendRange}
                    onChange={(e) => setFilters({...filters, stipendRange: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Any Stipend</option>
                    <option value="0-10000">Under ₹10,000</option>
                    <option value="10000-20000">₹10,000 - ₹20,000</option>
                    <option value="20000+">Above ₹20,000</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Field</label>
                  <select 
                    className="form-control"
                    value={filters.field}
                    onChange={(e) => setFilters({...filters, field: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">All Fields</option>
                    <option value="Web Dev">Web Development</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Policy">Policy & Research</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '500' }}>Deadline</label>
                  <select 
                    className="form-control"
                    value={filters.deadlineUrgency}
                    onChange={(e) => setFilters({...filters, deadlineUrgency: e.target.value})}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    <option value="">Any Deadline</option>
                    <option value="urgent">Urgent (Within 7 days)</option>
                    <option value="soon">Soon (Within 30 days)</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button 
                    className="btn btn--secondary"
                    onClick={() => setFilters({
                      department: '',
                      location: '',
                      duration: '',
                      stipendRange: '',
                      field: '',
                      deadlineUrgency: ''
                    })}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Results Count */}
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
            Showing <strong>{filteredInternships.length}</strong> of <strong>{internships.length}</strong> internships
          </div>
        </div>

        <div className="internships-grid" id="internshipsGrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginTop: '30px' }}>
          {filteredInternships.length === 0 ? (
            <div className="no-internships" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>No internships found matching your criteria.</p>
              <p style={{ fontSize: '14px' }}>Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredInternships.map(internship => (
              <div 
                key={internship._id || internship.id} 
                className="internship-card glass-card"
                onClick={() => handleApply(internship._id || internship.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#fff7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                      <Building size={24} />
                    </div>
                    <span style={{ 
                      padding: '4px 12px', 
                      backgroundColor: '#f0fdf4', 
                      color: '#16a34a', 
                      borderRadius: '50px', 
                      fontSize: '0.75rem', 
                      fontWeight: '600' 
                    }}>
                      {internship.organization || internship.department}
                    </span>
                  </div>
                  
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '12px', lineHeight: '1.4' }}>
                    {internship.title}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                      <MapPin size={16} /> {internship.location}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                      <Clock size={16} /> {internship.duration}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.9rem' }}>
                      <DollarSign size={16} /> {internship.stipend}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                    {(internship.skills || internship.tags || []).slice(0, 3).map(tag => (
                      <span 
                        key={tag} 
                        style={{
                          backgroundColor: '#f9fafb',
                          color: '#4b5563',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          border: '1px solid #e5e7eb'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{ paddingTop: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '0.8rem' }}>
                        <Calendar size={14} /> Apply by: {internship.deadline || '2025-02-28'}
                     </div>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       {appliedInternships.has(internship._id || internship.id) ? (
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdraw(internship._id || internship.id);
                            }}
                            disabled={loadingApply[internship._id || internship.id]}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#fee2e2',
                              color: '#ef4444',
                              border: '1px solid #fecaca',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                          >
                            {loadingApply[internship._id || internship.id] ? 'Wait...' : 'Withdraw'}
                          </button>
                       ) : (
                         <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApply(internship._id || internship.id);
                            }}
                            disabled={loadingApply[internship._id || internship.id]}
                            style={{
                              padding: '10px 20px',
                              backgroundColor: '#f97316',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              transition: 'all 0.2s'
                            }}
                          >
                            {loadingApply[internship._id || internship.id] ? 'Processing...' : 'Apply Now'}
                            {!loadingApply[internship._id || internship.id] && <ArrowRight size={16} />}
                          </button>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      

      {showApplyForm && selectedInternshipId && (
        <AIApplicationModal
          internship={internships.find(i => 
            String(i._id || i.id) === String(selectedInternshipId)
          )}
          onClose={() => setShowApplyForm(false)}
          onSuccess={(newApplication) => {
            setShowApplyForm(false);
            setAppliedInternships(prev => new Set([...prev, selectedInternshipId]));
            if (newApplication) {
              setMyApplications(prev => [...prev, newApplication]);
            } else {
              // If we don't have the new application object, re-fetch
              fetchMyData();
            }
            alert('Application submitted successfully!');
            setSelectedInternshipId(null);
          }}
        />
      )}
    </section>
  );
};

export default InternshipList;
