import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, MapPin, Phone, ArrowRight } from 'lucide-react';
import defaultLogo from '../assets/images/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../utils/resolveStoryImageUrl';

const SocialLink = ({ href, children }) => {
  if (!href || !href.trim()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: '#9ca3af', transition: 'color 0.3s' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = '#9ca3af'; }}
    >
      {children}
    </a>
  );
};

const Footer = () => {
  const { settings } = useSiteSettings();
  const { branding, footer, social, contact } = settings;
  const logoSrc = branding.logoUrl
    ? resolveStoryImageUrl(branding.logoUrl) || branding.logoUrl
    : defaultLogo;

  return (
    <footer className="footer neo-footer">
        <div className="neo-container">
            <div className="footer-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '60px' }}>
                <div className="footer-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <img src={logoSrc} alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = defaultLogo; }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
                                <span style={{ color: branding.primaryColor }}>{branding.brandNameLine1}</span>{' '}
                                <span style={{ color: branding.secondaryColor }}>{branding.brandNameLine2}</span>
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#9ca3af', letterSpacing: '1px' }}>{branding.brandSubtitle}</p>
                        </div>
                    </div>
                    <p style={{ color: '#9ca3af', lineHeight: '1.6', marginBottom: '20px' }}>
                        {footer.description}
                    </p>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <SocialLink href={social.facebook}><Facebook size={20} /></SocialLink>
                        <SocialLink href={social.twitter}><Twitter size={20} /></SocialLink>
                        <SocialLink href={social.instagram}><Instagram size={20} /></SocialLink>
                        <SocialLink href={social.linkedin}><Linkedin size={20} /></SocialLink>
                        <SocialLink href={social.youtube}><Youtube size={20} /></SocialLink>
                    </div>
                </div>

                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>Quick Links</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><a href="/" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.secondaryColor} /> Home</a></li>
                        <li><a href="#about-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.secondaryColor} /> About Us</a></li>
                        <li><a href="#internships-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.secondaryColor} /> Browse Internships</a></li>
                        <li><a href="#resources-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.secondaryColor} /> Resources</a></li>
                        <li><a href="#contact-section" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.secondaryColor} /> Contact</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>For Employers</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><Link to="/login" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.primaryColor} /> Login</Link></li>
                        <li><Link to="/partner/dashboard" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.primaryColor} /> Employer Dashboard</Link></li>
                        <li><Link to="/success-stories" style={{ color: '#d1d5db', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}><ArrowRight size={14} color={branding.primaryColor} /> Success Stories</Link></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '25px', color: '#fff' }}>Contact Us</h4>
                    <ul className="footer-links" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: '#d1d5db' }}>
                            <MapPin size={20} color={branding.secondaryColor} style={{ marginTop: '2px' }} />
                            <span>
                              {contact.addressLine1}<br />
                              {contact.addressLine2}<br />
                              {contact.addressLine3}
                            </span>
                        </li>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#d1d5db' }}>
                            <Phone size={20} color={branding.secondaryColor} />
                            <span>{contact.phone}</span>
                        </li>
                        <li style={{ display: 'flex', gap: '12px', alignItems: 'center', color: '#d1d5db' }}>
                            <Mail size={20} color={branding.secondaryColor} />
                            <span>{contact.email}</span>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom" style={{ borderTop: '1px solid #374151', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} {footer.copyright}</p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <Link to="/login" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Login</Link>
                    <a href="#privacy-policy" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</a>
                    <a href="#terms-of-service" style={{ color: '#9ca3af', fontSize: '0.875rem', textDecoration: 'none' }}>Terms of Service</a>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;
