import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthService from '../../services/authService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await AuthService.forgotPassword(email.trim());
      setSuccessMsg(res?.message || 'Reset email sent. Please check your inbox (and spam).');
      setEmail('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
      <div style={{ maxWidth: '450px', width: '100%' }}>
        <div className="modal-content" style={{ width: '100%' }}>
          <div className="modal-header">
            <h2>Forgot Password</h2>
            <Link to="/login" className="modal-close" style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#888',
              textDecoration: 'none',
            }}>
              &times;
            </Link>
          </div>

          <div className="modal-body">
            {!successMsg && (
              <p style={{ color: '#555', marginBottom: '20px', fontSize: '14px', lineHeight: 1.5 }}>
                Enter the email address you used to create your account. We&apos;ll send you a secure link to set a new password.
              </p>
            )}

            {error && (
              <div style={{
                backgroundColor: '#fee',
                border: '1px solid #fcc',
                color: '#c33',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
              }}>
                ⚠️ {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                backgroundColor: '#efe',
                border: '1px solid #cfc',
                color: '#1b7a1b',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
                lineHeight: 1.5,
              }}>
                ✅ {successMsg}
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#555' }}>
                  The link will expire in 15 minutes and is valid for one use.
                </div>
                <div style={{ marginTop: '18px' }}>
                  <Link
                    to="/login"
                    style={{
                      display: 'inline-block',
                      backgroundColor: '#134252',
                      color: '#fff',
                      padding: '10px 22px',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}

            {!successMsg && (
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#134252',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? 'Sending reset link...' : 'Send Password Reset Link'}
                  </button>
                  <Link
                    to="/login"
                    style={{
                      textAlign: 'center',
                      fontSize: '13px',
                      color: '#134252',
                      textDecoration: 'none',
                    }}
                  >
                    ← Back to Login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '12px', color: '#888' }}>
          © 2026 NEO GEN INTERNSHIP ENGINE
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
