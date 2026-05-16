import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import logo from '../assets/images/logo.png';

const Footer = () => {
  return (
    <footer className="footer" style={{ backgroundColor: '#111827', color: '#fff', padding: '80px 0 30px' }}>
        <div className="container">
            <div className="footer-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '60px' }}>
                <div className="footer-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <img src={logo} alt="NEO GEN" style={{ width: '40px', height: '40px' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                                <span style={{ color: '#f97316' }}>NEO</span> <span style={{ color: '#16a34a' }}>GEN</span>
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '1px' }}>INTERNSHIP ENGINE</p>
                        </div>
                    </div>
                    <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '20px' }}>
                        Empowering the next generation of professionals through meaningful internship opportunities with government and private organizations.
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}><Facebook size={20} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}><Twitter size={20} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}><Instagram size={20} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}><Linkedin size={20} /></a>
                        <a href="#" style={{ color: '#9ca3af', transition: 'color 0.3s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#9ca3af'}><Youtube size={20} /></a>
                    </div>
                </div>
                
                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>Quick Links</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><a href="/" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#16a34a" /> Home</a></li>
                        <li><a href="#about-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#16a34a" /> About Us</a></li>
                        <li><a href="#internships-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#16a34a" /> Browse Internships</a></li>
                        <li><a href="#resources-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#16a34a" /> Resources</a></li>
                        <li><a href="#contact-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#16a34a" /> Contact</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>For Employers</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><Link to="/partner/dashboard/post-internship" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#f97316" /> Post an Internship</Link></li>
                        <li><Link to="/partner/dashboard" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#f97316" /> Employer Dashboard</Link></li>
                        <li><Link to="/success-stories" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#f97316" /> Success Stories</Link></li>
                        <li><Link to="/#contact-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color="#f97316" /> Partnership Inquiry</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>Contact Us</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#d1d5db' }}>
                            <MapPin size={20} color="#16a34a" style={{ marginTop: '2px' }} />
                            <span>Ministry of Skill Development<br />Shram Shakti Bhawan, New Delhi - 110001</span>
                        </li>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#d1d5db' }}>
                            <Phone size={20} color="#16a34a" />
                            <span>+91 123 456 7890</span>
                        </li>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#d1d5db' }}>
                            <Mail size={20} color="#16a34a" />
                            <span>support@neogen.gov.in</span>
                        </li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom" style={{ borderTop: '1px solid #374151', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} Neo Gen Internship Engine. All rights reserved.</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <a href="#" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</a>
                    <a href="#" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Terms of Service</a>
                    <a href="#" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Cookie Policy</a>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
