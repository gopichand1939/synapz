import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../portal/api';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  // Auto-filled by default with master administrative credentials
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('synapz@focus2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fillAdmin = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide administrative username and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.loginAdmin(username.trim(), password.trim());
      if (res.success) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(res.error || 'Invalid administrative credentials.');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify administrative privileges.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-shell admin-auth-shell">
      <div className="auth-card-container">
        {/* Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand-link">
            <span className="brand-dot" />
            <span className="brand-text">SYNAPZ STUDY ZONE</span>
          </Link>
          <span className="auth-badge admin-badge">ADMINISTRATIVE CONSOLE</span>
          <h1 className="auth-title">Admin Sign In</h1>
          <p className="auth-subtitle">
            Restricted access for reading room management, cabin allotment, and live attendance audit.
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
              🛡️ ADMIN CREDENTIALS (AUTO-FILLED)
            </span>
            <button
              type="button"
              onClick={() => fillAdmin('', '')}
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
              onClick={() => fillAdmin('admin', 'synapz@focus2026')}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                backgroundColor: username === 'admin' ? 'var(--ink)' : 'var(--chalk)',
                color: username === 'admin' ? '#fff' : 'var(--ink)',
                border: '1px solid var(--border-light)',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🔑 Master Admin (admin / synapz@focus2026)
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
            <label htmlFor="admin-username" className="form-label">
              Admin Username
            </label>
            <input
              id="admin-username"
              type="text"
              required
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <div className="input-with-toggle">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter admin password"
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

          <button
            type="submit"
            className="btn btn-ink btn-auth-submit"
            disabled={loading || !username || !password}
          >
            {loading ? 'Verifying Authorization...' : 'Sign In to Admin Workspace ➔'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer">
          <div className="auth-role-switch">
            <span>Student or member?</span>{' '}
            <Link to="/member/login" className="switch-link">
              Member Login ➔
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
