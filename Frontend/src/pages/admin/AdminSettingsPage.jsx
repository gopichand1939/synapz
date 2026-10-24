import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function AdminSettingsPage() {
  const { adminUser } = useOutletContext();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/member/login');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">Administrative Settings</h1>
          <p className="admin-subheading">
            System configuration, facility parameters, and administrator access control.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Administrator Profile */}
        <div className="info-card">
          <h3 className="card-title">Authorized Administrator</h3>
          <div className="profile-attributes-list" style={{ marginTop: '1rem' }}>
            <div className="attribute-item">
              <span className="attr-label">Admin Username</span>
              <span className="attr-val font-mono">{adminUser?.username || 'admin'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Administrator Name</span>
              <span className="attr-val font-bold">{adminUser?.name || 'Administrator'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">System Role</span>
              <span className="attr-val">
                <span className="status-badge status-present">● {adminUser?.role || 'SUPER_ADMIN'}</span>
              </span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Session Security</span>
              <span className="attr-val">HttpOnly JWT Session Cookie (Lax, 7-Day Expiry)</span>
            </div>
          </div>
        </div>

        {/* Reading Room Parameters */}
        <div className="info-card">
          <h3 className="card-title">Reading Room Facility Configuration</h3>
          <div className="profile-attributes-list" style={{ marginTop: '1rem' }}>
            <div className="attribute-item">
              <span className="attr-label">Operating Location</span>
              <span className="attr-val">LIG-A-333, Midhilapuri VUDA Colony, Madhurawada, Visakhapatnam</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Study Shift Timings</span>
              <span className="attr-val">06:00 AM – 10:00 PM (Daily, All 7 Days)</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Facility Timezone</span>
              <span className="attr-val font-mono">Asia/Kolkata (UTC +05:30)</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Total Floor Cabins</span>
              <span className="attr-val font-mono font-bold">32 Dedicated Focus Cabins</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Database Persistence</span>
              <span className="attr-val font-mono">PostgreSQL (TestDB / synapz_* schema)</span>
            </div>
          </div>
        </div>

        {/* Member Portal Share Link */}
        <div className="info-card full-width-card" style={{ gridColumn: '1 / -1' }}>
          <h3 className="card-title">Student Portal Quick Onboarding Link</h3>
          <p className="card-desc" style={{ marginTop: '0.4rem', color: 'var(--ink-muted)' }}>
            Share this URL with registered members so they can log in on their mobile phones and mark their daily attendance.
          </p>

          <div className="share-link-box" style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={`${window.location.origin}/member/login`}
              className="form-input font-mono"
              style={{ maxWidth: '480px', backgroundColor: 'var(--chalk)' }}
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="btn btn-ink"
            >
              {copied ? '✓ Link Copied!' : '📋 Copy Member Portal Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
