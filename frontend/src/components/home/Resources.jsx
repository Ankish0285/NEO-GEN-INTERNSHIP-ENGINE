import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import MotionReveal from '../ui/MotionReveal';

const Resources = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { settings } = useSiteSettings();
  const { resources, branding } = settings;

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
    <section className="resources-section neo-section" id="resources-section" style={{ opacity: 1 }}>
        <div className="neo-container">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '50px' }}>
                <MotionReveal y={30} delay={0} duration={0.6}>
                    <h2 className="neo-h2">{resources.title}</h2>
                </MotionReveal>
                <MotionReveal y={25} delay={0.1} duration={0.55}>
                    <p className="neo-lead">{resources.subtitle}</p>
                </MotionReveal>
            </div>
            
            <div className="resource-guides-container">
                <div className="resource-guides-grid neo-resource-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
                    {templates.map(template => (
                        <motion.div
                            key={template.id} 
                            className="resource-card glass-card" 
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-70px' }}
                            transition={{ delay: 0.2 + template.id * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            whileHover={{ y: -5 }}
                            style={{ 
                                padding: '30px', 
                                borderRadius: '16px', 
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 250ms ease, border-color 250ms ease',
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
                            <div className="resource-preview" style={{ 
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
                                <div className="resource-preview-bar" style={{
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
                            
                            <h3 className="resource-card-title text-lg font-bold text-gray-900 mb-2">{template.title}</h3>
                            <p className="neo-lead text-sm mb-5">Best for {template.role} roles</p>
                            
                            <button 
                                onClick={handleAction}
                                className="neo-btn resource-use-btn w-full"
                                style={{ 
                                    width: '100%', 
                                    padding: '12px', 
                                    border: `1px solid ${template.iconColor}`, 
                                    color: template.iconColor, 
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = template.color;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                <Download size={18} /> Use Template
                            </button>
                        </motion.div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <motion.button
                        onClick={handleAction}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        style={{
                            padding: '16px 40px',
                            backgroundColor: branding.primaryColor,
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
                            e.currentTarget.style.backgroundColor = branding.primaryColor;
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(249, 115, 22, 0.3)';
                        }}
                    >
                        {resources.ctaText} <ArrowRight size={20} />
                    </motion.button>
                </div>
            </div>
        </div>
    </section>
  );
};

export default Resources;
