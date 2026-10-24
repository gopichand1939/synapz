import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function AdminMemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);

  const fetchMember = async () => {
    try {
      const res = await api.getMemberById(id);
      if (res.success) {
        setMember(res.member);
      } else {
        setError('Member not found.');
      }
    } catch (err) {
      setError(err.message || 'Failed to load member profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  const handleResetPassword = async () => {
    const confirmReset = window.confirm(
      `Generate a new temporary password for ${member.fullName}? The previous password will become invalid.`
    );
    if (!confirmReset) return;

    setResettingPassword(true);
    try {
      const res = await api.resetMemberPassword(id, '');
      if (res.success) {
        toast.success(
          'Temporary Password Generated!',
          `New password for ${member.fullName}: ${res.tempPassword}`,
          {
            duration: 10000,
            action: {
              label: 'Copy Password',
              onClick: () => {
                navigator.clipboard.writeText(res.tempPassword);
                toast.info('Copied!', 'Temporary password copied to clipboard.');
              }
            }
          }
        );
      }
    } catch (err) {
      toast.error('Reset Failed', err.message || 'Failed to reset password.');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleStatusToggle = async () => {
    const newStatus = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Change status to ${newStatus}?`)) return;

    try {
      const res = await api.updateMemberStatus(id, newStatus);
      if (res.success) {
        toast.success('Status Updated', `Member status updated to ${newStatus}.`);
        fetchMember();
      }
    } catch (err) {
      toast.error('Status Error', err.message || 'Failed to update status.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving member profile & attendance history..." />;
  }

  if (error || !member) {
    return (
      <div className="admin-page-wrap">
        <div className="empty-state-simple">
          <p>{error || 'Member not found.'}</p>
          <Link to="/admin/members" className="btn btn-outline-clean">
            ← Return to Members List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-wrap">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <div className="header-meta-row">
            <span className="font-mono member-id-tag">{member.memberCode}</span>
            <span className={`status-badge ${member.status === 'ACTIVE' ? 'status-present' : 'status-suspended'}`}>
              ● {member.status}
            </span>
          </div>
          <h1 className="admin-heading">{member.fullName}</h1>
          <p className="admin-subheading">
            Cabin {member.allottedSeatNumber || 'Unassigned'} • Registered {member.createdAt ? new Date(member.createdAt).toLocaleDateString('en-IN') : '—'}
          </p>
        </div>

        <div className="header-action-group">
          <Link to={`/admin/members/${id}/edit`} className="btn btn-outline-clean">
            ✏️ Edit Profile
          </Link>
          <button
            type="button"
            onClick={handleResetPassword}
            disabled={resettingPassword}
            className="btn btn-ink"
            title="Administrator assisted password reset"
          >
            {resettingPassword ? 'Generating...' : '🔑 Reset Password'}
          </button>
          <button
            type="button"
            onClick={handleStatusToggle}
            className="btn btn-ghost"
          >
            {member.status === 'ACTIVE' ? 'Suspend Account' : 'Reactivate Account'}
          </button>
        </div>
      </div>

      {/* Details Grid */}
      <div className="member-dashboard-grid">
        {/* Profile Card */}
        <div className="info-card">
          <h3 className="card-title">Member Details</h3>
          <div className="profile-attributes-list" style={{ marginTop: '1rem' }}>
            <div className="attribute-item">
              <span className="attr-label">Mobile Number</span>
              <span className="attr-val font-mono">+91 {member.mobileNumber}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Allotted Seat</span>
              <span className="attr-val font-mono font-bold">Cabin {member.allottedSeatNumber || 'Unassigned'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Study Goal / Exam</span>
              <span className="attr-val">{member.studyPurpose || 'Academic / Focus'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Aadhaar (Masked)</span>
              <span className="attr-val font-mono">{member.aadhaarMasked || 'Not provided'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Address</span>
              <span className="attr-val">{member.address || 'Not specified'}</span>
            </div>
            <div className="attribute-item">
              <span className="attr-label">Admin Notes</span>
              <span className="attr-val">{member.notes || 'None'}</span>
            </div>
          </div>
        </div>

        {/* Seat / Zone Snapshot */}
        <div className="info-card">
          <h3 className="card-title">Cabin Allotment Status</h3>
          <div className="cabin-big-display" style={{ marginTop: '1rem' }}>
            <div className="cabin-box">
              <span className="cabin-label">Allotted Cabin</span>
              <span className="cabin-number">{member.allottedSeatNumber || '—'}</span>
            </div>
            <div className="cabin-details-list">
              <div className="detail-row">
                <span className="detail-name">Floor Zone</span>
                <span className="detail-value">{member.seat?.zone || 'North Aisle'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-name">Cabin Status</span>
                <span className="detail-value">ALLOTTED</span>
              </div>
              <div className="detail-row">
                <span className="detail-name">Total Recorded Days</span>
                <span className="detail-value font-bold">{member.attendances?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member's Attendance History */}
      <div className="admin-section-card" style={{ marginTop: '1.5rem' }}>
        <div className="section-card-header">
          <div>
            <h2 className="section-title">Attendance History ({member.attendances?.length || 0} Sessions)</h2>
            <p className="section-sub">Chronological record of check-in events for this member.</p>
          </div>
        </div>

        {!member.attendances || member.attendances.length === 0 ? (
          <div className="empty-state-simple">
            <p>No check-in records have been recorded yet for this member.</p>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="synapz-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check-In Time (IST)</th>
                  <th>Seat Snapshot</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {member.attendances.map((att) => (
                  <tr key={att.id}>
                    <td>
                      <span className="font-mono font-medium">{att.attendanceDate}</span>
                    </td>
                    <td>
                      <span className="badge-time">
                        {new Date(att.checkInAt).toLocaleTimeString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          hour: '2-digit',
                          minute: '2-digit'
                        })} IST
                      </span>
                    </td>
                    <td>
                      <span className="seat-cell-pill">Seat {att.seatNumberSnapshot || member.allottedSeatNumber}</span>
                    </td>
                    <td>
                      <span className="status-badge status-present">✓ {att.status}</span>
                    </td>
                    <td>
                      <span className="method-tag">{att.method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
