import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const Contact = () => {
  const { settings } = useSiteSettings();
  const { contact } = settings;
  const supportLines = (contact.supportHours || '').split('\n').filter(Boolean);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional
    const phoneRegex = /^[\d\s\-+()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.phone && !validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      const subjectMap = {
        internship: 'Internship Inquiry',
        technical: 'Technical Support',
        partnership: 'Partnership Opportunity',
        feedback: 'Feedback',
        other: 'General Inquiry',
      };
      const categoryMap = {
        internship: 'Internship',
        technical: 'Technical',
        partnership: 'General',
        feedback: 'General',
        other: 'Other',
      };

      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: (formData.phone || '').trim(),
        subject: subjectMap[formData.subject] || formData.subject.trim(),
        category: categoryMap[formData.subject] || 'General',
        message: formData.message.trim(),
      };

      await api.post('/support-tickets', payload);

      setSuccess('Thank you! Your message has been sent successfully. We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setErrors({});

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Contact form error:', err);
      setError(err.message || 'An error occurred while sending your message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section" id="contact-section" style={{ padding: '80px 0', backgroundColor: '#f9fafb' }}>
      <div className="container">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 className="section-title" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>{contact.title}</h2>
          <p className="section-subtitle" style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
            {contact.subtitle}
          </p>
        </div>

        <div className="contact-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          <div className="contact-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Contact Info Cards */}
            <div className="contact-info-card glass-card" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
              <div className="contact-icon" style={{ width: '50px', height: '50px', backgroundColor: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', margin: '0 auto 20px' }}>
                <Mail size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>Email</h3>
              <p>
                <a href={`mailto:${contact.email}`} className="contact-link" style={{ color: '#6b7280', textDecoration: 'none' }}>
                  {contact.email}
                </a>
              </p>
            </div>

            <div className="contact-info-card glass-card" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
              <div className="contact-icon" style={{ width: '50px', height: '50px', backgroundColor: '#f0fdf4', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 20px' }}>
                <Phone size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>Phone</h3>
              <p style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <a href={`tel:${contact.phone?.replace(/\s/g, '')}`} className="contact-link" style={{ color: '#6b7280', textDecoration: 'none' }}>
                  {contact.phone}
                </a>
                {contact.phoneTollFree && (
                <a href={`tel:${contact.phoneTollFree.replace(/\D/g, '')}`} className="contact-link" style={{ color: '#6b7280', textDecoration: 'none' }}>
                  {contact.phoneTollFree}
                </a>
                )}
              </p>
            </div>

            <div className="contact-info-card glass-card" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
              <div className="contact-icon" style={{ width: '50px', height: '50px', backgroundColor: '#fff7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316', margin: '0 auto 20px' }}>
                <MapPin size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>Office</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                {contact.addressLine1}<br />
                {contact.addressLine2}<br />
                {contact.addressLine3}
              </p>
            </div>

            <div className="contact-info-card glass-card" style={{ padding: '30px', borderRadius: '16px', textAlign: 'center' }}>
              <div className="contact-icon" style={{ width: '50px', height: '50px', backgroundColor: '#fef2f2', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', margin: '0 auto 20px' }}>
                <Clock size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>Support Hours</h3>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                {supportLines.map((line, i) => (
                  <React.Fragment key={i}>{line}{i < supportLines.length - 1 && <br />}</React.Fragment>
                ))}
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-container glass-card" style={{ padding: '40px', borderRadius: '24px' }}>
            <h3 className="contact-form-title" style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px', color: '#111827' }}>Send us a Message</h3>

            {error && (
              <div className="alert alert-error" role="alert" style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                <span aria-hidden="true">⚠️</span> {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" role="alert" style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
                <span aria-hidden="true">✓</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="contact-name" className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Full Name <span className="required" style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                />
                {errors.name && <span className="error-message" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label htmlFor="contact-email" className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Email Address <span className="required" style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                  />
                  {errors.email && <span className="error-message" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="contact-phone" className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
                  />
                  {errors.phone && <span className="error-message" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.phone}</span>}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label htmlFor="contact-subject" className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Subject
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: 'white' }}
                >
                  <option value="">Select a subject</option>
                  <option value="internship">Internship Inquiry</option>
                  <option value="technical">Technical Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label htmlFor="contact-message" className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#374151' }}>
                  Message <span className="required" style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="How can we help you?"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', resize: 'vertical' }}
                ></textarea>
                {errors.message && <span className="error-message" style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>{errors.message}</span>}
              </div>

              <button 
                type="submit" 
                className="btn btn--primary btn--full-width" 
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Sending...' : 'Send Message'}
                {!loading && <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
        {/* FAQ Section */}
        <div className="faq-section" style={{ marginTop: '80px' }}>
          <h3 className="faq-title" style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', marginBottom: '40px', color: '#111827' }}>Frequently Asked Questions</h3>
          
          <div className="faq-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>How do I apply for an internship?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Create an account, complete your profile, and browse available internships. 
                Click "Apply" on any internship that matches your interests to submit your application.
              </p>
            </div>

            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>Is there a fee to use NEO GEN INTERNSHIP ENGINE?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                No, NEO GEN INTERNSHIP ENGINE is completely free for students. We are a government initiative aimed at 
                making quality internship opportunities accessible to everyone.
              </p>
            </div>

            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>What documents do I need?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                You'll need a current resume, valid government ID proof, and educational certificates. 
                Some positions may require additional documents based on specific requirements.
              </p>
            </div>

            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>Can I apply to multiple internships?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Yes! You can apply to as many internships as you want. There's no limit on the number of 
                applications, allowing you to explore diverse opportunities.
              </p>
            </div>

            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>How long does the review process take?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Most applications are reviewed within 5-7 business days. You'll be notified via email 
                and through your dashboard about application status updates.
              </p>
            </div>

            <div className="faq-card glass-card" style={{ padding: '30px', borderRadius: '16px' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', color: '#111827' }}>How do I track my applications?</h4>
              <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
                Go to your Dashboard to view all your submitted applications, their current status, 
                and any messages from the recruiting departments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
