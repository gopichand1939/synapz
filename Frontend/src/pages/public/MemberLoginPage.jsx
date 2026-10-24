import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../portal/api';

export default function MemberLoginPage() {
  const navigate = useNavigate();

  // Auto-filled by default with seeded demo member credentials
  const [mobileNumber, setMobileNumber] = useState('9492722891');
  const [password, setPassword] = useState('Synapz@2891');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResetHelp, setShowResetHelp] = useState(false);

  const fillMember = (mobile, pwd) => {
    setMobileNumber(mobile);
    setPassword(pwd);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setError('Please enter your valid 10-digit registered Indian mobile number.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginMember(cleanMobile, password.trim());
      if (res.success) {
        navigate('/member/dashboard', { replace: true });
      } else {
        setError(res.error || 'Authentication failed.');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-link">
            <span className="brand-dot" />
            <span className="brand-text">SYNAPZ STUDY ZONE</span>
          </Link>
          <span className="auth-badge">MEMBER PORTAL</span>
          <h1 className="auth-title">Member Sign In</h1>
          <p className="auth-subtitle">
            Enter your registered 10-digit mobile number and password to access your study cabin dashboard.
          </p>
        </div>

        {/* Demo Credentials Quick-Fill Banner */}
        <div style={{
          backgroundColor: '#F8F9FA',
          border: '1px dashed var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '0.85rem 1rem',
          marginBottom: '1.25rem',
          fontSize: '0.8rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ink)' }}>
              ⚡ DEMO CREDENTIALS (AUTO-FILLED)
            </span>
            <button
              type="button"
              onClick={() => fillMember('', '')}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '0.72rem',
                color: 'var(--ink-muted)',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => fillMember('9492722891', 'Synapz@2891')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: mobileNumber === '9492722891' ? 'var(--terracotta)' : 'var(--chalk)',
                color: mobileNumber === '9492722891' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--border-light)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              👤 Aditya Varma (Seat C)
            </button>
            <button
              type="button"
              onClick={() => fillMember('9876543210', 'Synapz@3210')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: mobileNumber === '9876543210' ? 'var(--terracotta)' : 'var(--chalk)',
                color: mobileNumber === '9876543210' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--border-light)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              👤 Sravani Rao (Seat 13)
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-error-alert" role="alert">
            <span className="error-icon">⚠️</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="member-mobile" className="form-label">
              Registered Mobile Number
            </label>
            <div className="input-with-prefix">
              <span className="input-prefix">+91</span>
              <input
                id="member-mobile"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                required
                placeholder="10-digit mobile number"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="form-input prefixed-input"
                autoComplete="tel"
                disabled={loading}
              />
            </div>
            <span className="field-hint">The mobile number registered during cabin allotment.</span>
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label htmlFor="member-password" className="form-label">
                Password
              </label>
              <button
                type="button"
                className="text-link-btn"
                onClick={() => setShowResetHelp(!showResetHelp)}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-with-toggle">
              <input
                id="member-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {/* Administrator Assisted Password Reset Explainer */}
          {showResetHelp && (
            <div className="reset-help-card">
              <div className="reset-help-title">
                <span>🛡️</span>
                <strong>Administrator-Assisted Password Recovery</strong>
              </div>
              <p className="reset-help-body">
                To protect student data, password resets are authorized directly by the front desk administration.
              </p>
              <ul className="reset-steps">
                <li>Visit the Synapz front desk in Madhurawada, or</li>
                <li>WhatsApp the administrator at <strong>+91 9492722891</strong> with your full name and registered seat number.</li>
                <li>The administrator will verify your registered record and provide a secure temporary password immediately.</li>
              </ul>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setShowResetHelp(false)}
                style={{ marginTop: '0.5rem' }}
              >
                Close notice
              </button>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-terracotta btn-auth-submit"
            disabled={loading || mobileNumber.length !== 10 || !password}
          >
            {loading ? 'Authenticating...' : 'Sign In to Member Portal ➔'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <div className="auth-role-switch">
            <span>Staff or Administrator?</span>{' '}
            <Link to="/admin/login" className="switch-link">
              Admin Login ➔
            </Link>
          </div>
          <div className="auth-back-link">
            <Link to="/">← Back to Synapz Study Zone</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
