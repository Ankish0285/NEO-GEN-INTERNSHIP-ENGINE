import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Resources = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleAction = () => {
    if (isAuthenticated) {
      navigate('/resources/resume-templates');
    } else {
      navigate('/login');
    }
  };

  const templates = [
    {
      id: 1,
      title: 'Professional Modern',
      role: 'Software Engineer',
      color: '#e0f2fe',
      iconColor: '#0ea5e9'
    },
    {
      id: 2,
      title: 'Clean Minimalist',
      role: 'Product Manager',
      color: '#f0fdf4',
      iconColor: '#16a34a'
    }
  ];

  return (
    <section className="resources-section" id="resources-section" style={{ padding: '80px 0', backgroundColor: '#fff' }}>
        <div className="container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Resume Templates</h2>
                <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Download modern, ATS-friendly resume templates for different roles.</p>
            </div>
            
            <div className="resource-guides-container">
                <div className="resource-guides-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
                    {templates.map(template => (
                        <div 
                            key={template.id} 
                            className="resource-card glass-card" 
                            style={{ 
                                padding: '30px', 
                                borderRadius: '16px', 
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                            }}
                        >
                            <div style={{ 
                                width: '100%', 
                                height: '200px', 
                                backgroundColor: template.color, 
                                borderRadius: '8px', 
                                marginBottom: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <FileText size={64} color={template.iconColor} opacity={0.8} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    left: '0',
                                    right: '0',
                                    padding: '8px',
                                    background: 'rgba(255,255,255,0.9)',
                                    fontSize: '0.875rem',
                                    color: '#4b5563',
                                    fontWeight: '500'
                                }}>
                                    Preview
                                </div>
                            </div>
                            
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{template.title}</h3>
                            <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '20px' }}>Best for {template.role} roles</p>
                            
                            <button 
                                onClick={handleAction}
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    backgroundColor: 'white', 
                                    border: `1px solid ${template.iconColor}`, 
                                    color: template.iconColor, 
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = template.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                }}
                            >
                                <Download size={18} /> Use Template
                            </button>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <button
                        onClick={handleAction}
                        style={{
                            padding: '16px 40px',
                            backgroundColor: '#f97316', // Orange accent
                            color: 'white',
                            border: 'none',
                            borderRadius: '50px',
                            fontSize: '1.125rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ea580c';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(249, 115, 22, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f97316';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(249, 115, 22, 0.3)';
                        }}
                    >
                        Explore Roles <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    </section>
  );
};

export default Resources;
