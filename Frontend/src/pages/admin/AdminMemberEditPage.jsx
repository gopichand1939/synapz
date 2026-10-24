import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function AdminMemberEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [member, setMember] = useState(null);
  const [fullName, setFullName] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [studyPurpose, setStudyPurpose] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [memRes, seatRes] = await Promise.all([
          api.getMemberById(id),
          api.listSeats()
        ]);
        if (!isMounted) return;
        if (memRes.success) {
          setMember(memRes.member);
          setFullName(memRes.member.fullName || '');
          setSeatNumber(memRes.member.allottedSeatNumber || '');
          setStudyPurpose(memRes.member.studyPurpose || '');
          setAddress(memRes.member.address || '');
          setNotes(memRes.member.notes || '');
        }
        setSeats(seatRes.seats || []);
      } catch (err) {
        console.error('Edit load error:', err);
        setError('Failed to load member details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full name cannot be blank.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        fullName: fullName.trim(),
        seatNumber: seatNumber || undefined,
        studyPurpose: studyPurpose.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined
      };

      const res = await api.updateMember(id, payload);
      if (res.success) {
        toast.success('Member Profile Updated', `${fullName}'s details updated successfully.`);
        navigate(`/admin/members/${id}`, { replace: true });
      } else {
        setError(res.error || 'Failed to update member.');
        toast.error('Update Failed', res.error || 'Failed to update member.');
      }
    } catch (err) {
      setError(err.message || 'Update failed.');
      toast.error('Update Error', err.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading member details for editing..." />;
  }

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">Edit Member: {member?.fullName}</h1>
          <p className="admin-subheading">
            ID: {member?.memberCode} • Mobile: +91 {member?.mobileNumber}
          </p>
        </div>
        <Link to={`/admin/members/${id}`} className="btn btn-outline-clean">
          ← Cancel and Return
        </Link>
      </div>

      {error && (
        <div className="portal-alert portal-alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="admin-form-shell">
        <form onSubmit={handleSubmit} className="admin-form-card">
          <div className="admin-form-section">
            <div className="form-section-header">
              <span className="section-num-pill">01</span>
              <div className="section-header-text">
                <h3>Member Identity & Seat Reassignment</h3>
                <p>Update official member name or reassign cabin seat on the 32-cabin layout.</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="edit-name" className="form-label">
                  <span>Full Name</span>
                  <span className="req">*</span>
                </label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-seat" className="form-label">
                  <span>Allotted Cabin</span>
                  <span className="req">*</span>
                </label>
                <select
                  id="edit-seat"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="form-select font-mono"
                  disabled={submitting}
                >
                  <option value="">-- Unassigned --</option>
                  {seats.map((s) => (
                    <option
                      key={s.id}
                      value={s.seatNumber}
                      disabled={s.status !== 'AVAILABLE' && s.seatNumber !== member?.allottedSeatNumber}
                    >
                      Seat {s.seatNumber} ({s.seatNumber === member?.allottedSeatNumber ? 'Currently Assigned' : s.status})
                    </option>
                  ))}
                </select>
                <span className="field-hint">Reassigning seat will automatically update floor plan availability.</span>
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="form-section-header">
              <span className="section-num-pill">02</span>
              <div className="section-header-text">
                <h3>Academic & Administrative Profile</h3>
                <p>Modify student goals, address, or administrative notes.</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="edit-purpose" className="form-label">
                  <span>Study Goal / Exam Target</span>
                </label>
                <input
                  id="edit-purpose"
                  type="text"
                  value={studyPurpose}
                  onChange={(e) => setStudyPurpose(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="edit-address" className="form-label">
                  <span>Residential Address</span>
                </label>
                <input
                  id="edit-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="edit-notes" className="form-label">
                  <span>Internal Administrative Notes</span>
                </label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <div className="admin-form-footer">
            <div className="form-security-badge">
              <span>🔒 Changes logged with timestamp in PostgreSQL</span>
            </div>
            <div className="form-buttons-group">
              <Link to={`/admin/members/${id}`} className="btn btn-ghost-dark">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !fullName.trim()}
                className="btn btn-terracotta"
              >
                {submitting ? 'Saving Changes...' : 'Save Profile Changes ➔'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
