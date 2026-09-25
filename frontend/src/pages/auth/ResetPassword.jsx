import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthService from '../../services/authService';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');

  useEffect(() => {
    if (!token) {
      setTokenError('Invalid reset link. The token is missing.');
    } else if (token.length < 32) {
      setTokenError('Invalid reset link. The token appears to be malformed.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (tokenError) return;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await AuthService.resetPassword(token, newPassword, confirmPassword);
      setSuccessMsg(res?.message || 'Password updated successfully!');

      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reset password. The link may be expired or already used.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-auth-page min-h-screen flex items-center justify-center py-12 px-4">
      <div style={{ maxWidth: '450px', width: '100%' }}>
        <div className="modal-content" style={{ width: '100%' }}>
          <div className="modal-header">
            <h2>Set New Password</h2>
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
            {tokenError && (
              <div style={{
                backgroundColor: '#fff5f5',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '16px',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
                lineHeight: 1.5,
              }}>
                ❌ {tokenError}
                <div style={{ marginTop: '14px' }}>
                  <Link
                    to="/forgot-password"
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
                    Request a new reset link
                  </Link>
                </div>
              </div>
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
                  Redirecting you to login...
                </div>
              </div>
            )}

            {!tokenError && !successMsg && (
              <>
                <p style={{ color: '#555', marginBottom: '20px', fontSize: '14px', lineHeight: 1.5 }}>
                  Choose a strong new password. You&apos;ll be able to login with it immediately after saving.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#666',
                        }}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
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
                      {loading ? 'Updating password...' : 'Update Password'}
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
              </>
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

export default ResetPassword;
