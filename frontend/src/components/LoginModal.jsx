import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import AuthService from '../services/authService';
import logo from '../assets/images/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { resolveStoryImageUrl } from '../utils/resolveStoryImageUrl';

const LoginModal = ({ isOpen, onClose, initialTab = 'login', embedded = false }) => {
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const isGoogleConfigured = Boolean(googleClientId);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    role: 'student',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const { login, register, verifyOtp, verifyLoginOtp } = useAuth();
  const { settings } = useSiteSettings();
  const { branding } = settings;
  const logoSrc = branding.logoUrl
    ? resolveStoryImageUrl(branding.logoUrl) || branding.logoUrl
    : logo;
  const primaryColor = branding.primaryColor || '#FF9933';
  const secondaryColor = branding.secondaryColor || '#138808';
  const navigate = useNavigate();

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (activeTab === 'login') {
        let result;
        if (showOtp) {
          if (!formData.otp) {
            setError('Please enter the OTP');
            setLoading(false);
            return;
          }
          result = await verifyLoginOtp(formData.email, formData.otp);
        } else {
          console.log('[LoginModal] Attempting login...');
          result = await login(formData.email, formData.password);
        }
        
        console.log('[LoginModal] Login result:', result);
        
        if (result.success) {
          if (result.requiresOtp) {
            setSuccess('OTP sent to your email. Please verify it to complete login.');
            setShowOtp(true);
            setOtpTimer((result.expiresIn || 5) * 60);
            return;
          }

          setSuccess('Login successful!');
          
          // Reset form
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            name: '',
            phone: '',
            role: 'student',
            otp: ''
          });
          setShowOtp(false);
          
          setTimeout(() => {
            onClose();
            if (result.role === 'admin' || result.role === 'super_admin') {
              window.location.href = '/admin/dashboard';
            } else if (result.role === 'partner') {
              window.location.href = '/partner/dashboard';
            } else {
              window.location.href = '/dashboard';
            }
          }, 1000);
        } else {
          setError(result.message || 'Invalid email or password. Please try again.');
        }
      } else {
        // SIGNUP FLOW
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        if (showOtp) {
          // STEP 2: VERIFY OTP
          if (!formData.otp) {
            setError('Please enter the OTP');
            setLoading(false);
            return;
          }

          console.log('[LoginModal] Verifying OTP...');
          const result = await verifyOtp(formData.email, formData.otp);
          
          console.log('[LoginModal] OTP verification result:', result);
          
          if (result.success) {
            setSuccess('Registration successful! You are now logged in.');
            
            // Reset form
            setFormData({
              email: '',
              password: '',
              confirmPassword: '',
              name: '',
              phone: '',
              role: 'student',
              otp: ''
            });
            setShowOtp(false);
            
            // Redirect based on role
            setTimeout(() => {
              onClose();
              
              if (result.role === 'admin' || result.role === 'super_admin') {
                console.log('[LoginModal] Redirecting admin to /admin/dashboard');
                window.location.href = '/admin/dashboard';
              } else if (result.role === 'partner') {
                console.log('[LoginModal] Redirecting partner to /partner/dashboard');
                window.location.href = '/partner/dashboard';
              } else {
                console.log('[LoginModal] Redirecting student to /dashboard');
                window.location.href = '/dashboard';
              }
            }, 1500);
          } else {
            console.error('[LoginModal] OTP verification failed:', result.message);
            setError(result.message || 'OTP verification failed');
          }
        } else {
          // STEP 1: REGISTER & SEND OTP
          if (!formData.name) {
            setError('Please enter your name');
            setLoading(false);
            return;
          }

          const result = await register({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone || '',
            role: 'student'
          });

          if (result.success) {
            setSuccess('OTP sent to your email! Please check your inbox (and spam folder).');
            setShowOtp(true);
            setOtpTimer(300); // 5 minutes
            
            // Start countdown
            const interval = setInterval(() => {
              setOtpTimer(prev => {
                if (prev <= 1) {
                  clearInterval(interval);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
            setError(result.message || 'Registration failed. Please try again.');
          }
        }
      }
    } catch (err) {
      console.error('[LoginModal] Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const response = activeTab === 'login'
        ? await AuthService.sendLoginOtp(formData.email)
        : await AuthService.sendOtp(formData.email);
      if (response && response.success) {
        setSuccess('New OTP sent to your email');
        setOtpTimer(300); // Reset to 5 minutes
      } else {
        setError(response?.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = (credentialResponse) => {
    // Real Google OAuth via @react-oauth/google — credentialResponse.credential = id_token (JWT)
    const idToken = credentialResponse?.credential;
    if (!idToken) {
      setError('Google authentication failed. No credential received.');
      return;
    }
    processGoogleLogin(idToken);
  };

  const processGoogleLogin = async (idToken) => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await AuthService.googleLogin(idToken);
      if (result?.success) {
        if (result.requiresOtp) {
          setFormData(prev => ({ ...prev, email: result.email, otp: '' }));
          setShowOtp(true);
          setOtpTimer((result.expiresIn || 5) * 60);
          setSuccess('OTP sent to your email. Please verify it to complete login.');
          return;
        }
        setSuccess('Login successful!');
        setTimeout(() => {
          onClose?.();
          if (result.role === 'admin' || result.role === 'super_admin') {
            window.location.href = '/admin/dashboard';
          } else if (result.role === 'partner') {
            window.location.href = '/partner/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        }, 1000);
      } else {
        setError(result?.message || 'Google login failed. Please try again.');
      }
    } catch (err) {
      console.error('[LoginModal] Google login error:', err);
      setError(err?.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const wrapperStyle = embedded
    ? { display: 'flex', justifyContent: 'center', width: '100%' }
    : { display: isOpen ? 'flex' : 'none' };

  return (
    <div
      id="loginModal"
      className={embedded ? '' : `modal ${isOpen ? '' : 'hidden'}`}
      style={wrapperStyle}
    >
      <div className="modal-content" style={{ maxWidth: '450px', width: '90%' }}>
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div className="neo-auth-brand" aria-label={`${branding.brandNameLine1 || 'NEO'} ${branding.brandNameLine2 || 'GEN'} Internship Engine`}>
            <img
              src={logoSrc}
              alt="NEO GEN logo"
              className="neo-auth-brand__logo"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = logo;
              }}
            />
            <div>
              <h2 className="neo-auth-brand__name">
                <span style={{ color: primaryColor }}>{branding.brandNameLine1 || 'NEO'}</span>{' '}
                <span style={{ color: secondaryColor }}>{branding.brandNameLine2 || 'GEN'}</span>
              </h2>
              <p className="neo-auth-brand__subtitle">{branding.brandSubtitle || 'INTERNSHIP ENGINE'}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`} 
              onClick={() => {
                setActiveTab('login');
                setError('');
                setSuccess('');
              }}
            >
              Login
            </button>
            <button 
              className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`} 
              onClick={() => {
                setActiveTab('signup');
                setError('');
                setSuccess('');
              }}
            >
              Sign Up
            </button>
          </div>
          
          {error && (
            <div className="alert alert-danger" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{
              backgroundColor: '#efe',
              border: '1px solid #cfc',
              color: '#3c3',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              ✓ {success}
            </div>
          )}

          {activeTab === 'login' && (
            <div id="loginTab" className="auth-form active">
              <form onSubmit={handleSubmit}>
                {!showOtp ? <>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" name="email" className="form-control" placeholder="Enter your email" required value={formData.email} onChange={handleChange} autoComplete="email" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input type="password" name="password" className="form-control" placeholder="Enter your password" required value={formData.password} onChange={handleChange} autoComplete="current-password" />
                  </div>
                  <div className="form-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <label className="checkbox-container"><input type="checkbox" /> Remember me</label>
                    <a href="/forgot-password" onClick={(e) => { e.preventDefault(); onClose?.(); navigate('/forgot-password'); }} className="forgot-password" style={{ fontSize: '14px', color: '#666' }}>Forgot Password?</a>
                  </div>
                  <button type="submit" className="btn btn--primary btn--full-width" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
                </> : <>
                  <div className="otp-verification-section" style={{ textAlign: 'center' }}>
                    <h3>Verify Login</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>Enter the OTP sent to <strong>{formData.email}</strong></p>
                    <div className="form-group"><input type="text" name="otp" className="form-control" placeholder="000000" required value={formData.otp} onChange={handleChange} maxLength="6" style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '10px', fontWeight: 'bold' }} /></div>
                    <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>{otpTimer > 0 ? <p>OTP expires in: <strong>{formatTimer(otpTimer)}</strong></p> : <p style={{ color: '#c33' }}>OTP has expired</p>}</div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn btn--outline btn--full-width" onClick={() => { setShowOtp(false); setFormData(prev => ({ ...prev, otp: '' })); }} disabled={loading}>Back</button>
                      <button type="button" className="btn btn--outline btn--full-width" onClick={handleResendOtp} disabled={loading || otpTimer > 60}>{loading ? 'Resending...' : 'Resend OTP'}</button>
                    </div>
                  </div>
                  <button type="submit" className="btn btn--primary btn--full-width" disabled={loading || otpTimer <= 0} style={{ marginTop: '15px' }}>{loading ? 'Verifying...' : 'Verify & Login'}</button>
                </>}
              </form>
            </div>
          )}

          {activeTab === 'signup' && (
            <div id="signupTab" className="auth-form active">
              <form onSubmit={handleSubmit}>
                {!showOtp && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        name="name"
                        className="form-control" 
                        placeholder="Enter your full name" 
                        required 
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input 
                        type="email" 
                        name="email"
                        className="form-control" 
                        placeholder="Enter your email" 
                        required 
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone (Optional)</label>
                      <input 
                        type="tel" 
                        name="phone"
                        className="form-control" 
                        placeholder="Enter your phone number" 
                        value={formData.phone}
                        onChange={handleChange}
                        autoComplete="tel"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Password</label>
                      <input 
                        type="password" 
                        name="password"
                        className="form-control" 
                        placeholder="Create a strong password" 
                        required 
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                      <small style={{display: 'block', marginTop: '5px', color: '#999', fontSize: '12px'}}>
                        Use at least 8 characters with numbers and symbols
                      </small>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input 
                        type="password" 
                        name="confirmPassword"
                        className="form-control" 
                        placeholder="Confirm your password" 
                        required 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                      />
                    </div>
                  </>
                )}
                
                {showOtp && (
                  <div className="otp-verification-section" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ marginBottom: '5px' }}>Verify Your Email</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>
                        We sent a 6-digit code to <strong>{formData.email}</strong>
                      </p>
                    </div>

                    <div className="form-group">
                      <input 
                        type="text" 
                        name="otp"
                        className="form-control" 
                        placeholder="000000"
                        required 
                        value={formData.otp}
                        onChange={handleChange}
                        maxLength="6"
                        style={{ 
                          textAlign: 'center', 
                          fontSize: '24px', 
                          letterSpacing: '10px',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: '15px', color: '#666', fontSize: '14px' }}>
                      {otpTimer > 0 ? (
                        <p>OTP expires in: <strong>{formatTimer(otpTimer)}</strong></p>
                      ) : (
                        <p style={{ color: '#c33' }}>OTP has expired</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="button" 
                        className="btn btn--outline btn--full-width"
                        onClick={() => {
                          setShowOtp(false);
                          setFormData(prev => ({ ...prev, otp: '' }));
                        }}
                        disabled={loading}
                      >
                        Back
                      </button>
                      <button 
                        type="button" 
                        className="btn btn--outline btn--full-width"
                        onClick={handleResendOtp}
                        disabled={loading || otpTimer > 60}
                        style={{ opacity: (loading || otpTimer > 60) ? 0.6 : 1 }}
                      >
                        {loading ? 'Resending...' : 'Resend OTP'}
                      </button>
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn btn--primary btn--full-width" 
                  disabled={loading || (showOtp && otpTimer <= 0)}
                  style={{ marginTop: showOtp ? '15px' : '0' }}
                >
                  {loading ? 'Processing...' : (showOtp ? 'Verify & Create Account' : 'Send OTP')}
                </button>
              </form>
            </div>
          )}

          <div className="auth-divider" style={{ margin: '20px 0', textAlign: 'center', color: '#999' }}>
            <span>OR</span>
          </div>
          
          <div className="social-auth">
            <div style={{ width: '100%' }}>
              {isGoogleConfigured ? (
                <GoogleLogin
                  onSuccess={handleGoogleAuth}
                  onError={() => setError('Google authentication was cancelled or failed.')}
                  useOneTap
                  theme="outline"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                  logo_alignment="left"
                />
              ) : (
                <button
                  type="button"
                  disabled
                  className="btn btn--outline btn--full-width"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  title="Google OAuth is not configured yet"
                >
                  Continue with Google
                </button>
              )}
            </div>
            {!isGoogleConfigured && (
              <p className="google-verification-notice" style={{ marginTop: '10px' }}>
                <small>Google login is currently unavailable because `VITE_GOOGLE_CLIENT_ID` is not configured.</small>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
