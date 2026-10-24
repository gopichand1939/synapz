import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function AdminRegisterMemberPage() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [password, setPassword] = useState('');
  const [autoPassword, setAutoPassword] = useState(true);
  const [studyPurpose, setStudyPurpose] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [membershipStartDate, setMembershipStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [membershipEndDate, setMembershipEndDate] = useState('');
  const [notes, setNotes] = useState('');

  const [seats, setSeats] = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch authentic 32 seats
  useEffect(() => {
    let isMounted = true;
    api.listSeats()
      .then(res => {
        if (!isMounted) return;
        setSeats(res.seats || []);
        // Pre-select first available seat
        const available = res.seats?.find(s => s.status === 'AVAILABLE');
        if (available) setSeatNumber(available.seatNumber);
      })
      .catch(err => console.error('Error fetching seats:', err))
      .finally(() => {
        if (isMounted) setLoadingSeats(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Update auto-password preview based on mobile number
  useEffect(() => {
    if (autoPassword && mobileNumber.length >= 4) {
      setPassword(`Synapz@${mobileNumber.slice(-4)}`);
    } else if (autoPassword && mobileNumber.length < 4) {
      setPassword('Synapz@****');
    }
  }, [mobileNumber, autoPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    if (cleanMobile.length !== 10) {
      setError('Please provide a valid 10-digit Indian mobile number.');
      return;
    }

    if (!seatNumber) {
      setError('Seat assignment is mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: cleanMobile,
        seatNumber,
        password: autoPassword ? `Synapz@${cleanMobile.slice(-4)}` : password.trim(),
        studyPurpose: studyPurpose.trim() || undefined,
        address: address.trim() || undefined,
        aadhaar: aadhaar.trim() || undefined,
        membershipStartDate,
        membershipEndDate: membershipEndDate || undefined,
        notes: notes.trim() || undefined
      };

      const res = await api.registerMember(payload);
      if (res.success) {
        const initialPass = res.initialPassword || payload.password;
        toast.success(
          'Member Registered Successfully!',
          `${res.member.fullName} (${res.member.memberCode}) allotted Cabin ${seatNumber} · Initial Password: ${initialPass}`,
          {
            duration: 10000,
            action: {
              label: 'Copy Credentials',
              onClick: () => {
                const creds = `SYNAPZ STUDY ZONE — STUDENT CREDENTIALS\nName: ${res.member.fullName}\nMember ID: ${res.member.memberCode}\nMobile: +91 ${cleanMobile}\nCabin: ${seatNumber}\nInitial Password: ${initialPass}\nLogin Portal: http://localhost:5173/member/login`;
                navigator.clipboard.writeText(creds);
                toast.info('Copied!', 'Student credentials copied to clipboard.');
              }
            }
          }
        );
        navigate('/admin/members');
      } else {
        setError(res.error || 'Failed to register member.');
        toast.error('Registration Failed', res.error || 'Failed to register member.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Check if mobile or seat is already allotted.');
      toast.error('Registration Error', err.message || 'Check if mobile or seat is already allotted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSeats) {
    return <LoadingSpinner text="Loading cabin availability for registration..." />;
  }

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">Register New Member</h1>
          <p className="admin-subheading">
            Onboard a student, provision their initial login credentials, and assign a dedicated 32-cabin seat.
          </p>
        </div>
        <Link to="/admin/members" className="btn btn-outline-clean">
          ← Back to Members List
        </Link>
      </div>

      {error && (
        <div className="portal-alert portal-alert-error" role="alert">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="admin-form-shell">
        <form onSubmit={handleSubmit} className="admin-form-card">
          {/* Section 01: Account Credentials & Seat Assignment */}
          <div className="admin-form-section">
            <div className="form-section-header">
              <span className="section-num-pill">01</span>
              <div className="section-header-text">
                <h3>Member Credentials & Seat Allotment</h3>
                <p>Required credentials used for member portal sign-in and dedicated desk assignment.</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="reg-name" className="form-label">
                  <span>Full Name</span>
                  <span className="req">*</span>
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
                <span className="field-hint">Official student name for attendance registers.</span>
              </div>

              <div className="form-field">
                <label htmlFor="reg-mobile" className="form-label">
                  <span>10-Digit Mobile Number</span>
                  <span className="req">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">+91</span>
                  <input
                    id="reg-mobile"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    placeholder="9492722891"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="form-input prefixed-input font-mono"
                    disabled={submitting}
                  />
                </div>
                <span className="field-hint">Used as login identifier in the member portal.</span>
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="reg-seat" className="form-label">
                  <span>Allotted Cabin (from 32 Authentic Seats)</span>
                  <span className="req">*</span>
                </label>
                <select
                  id="reg-seat"
                  required
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  className="form-select font-mono"
                  disabled={submitting}
                >
                  <option value="">-- Select Dedicated Cabin --</option>
                  {seats.map((s) => (
                    <option
                      key={s.id}
                      value={s.seatNumber}
                      disabled={s.status !== 'AVAILABLE'}
                    >
                      {s.status === 'AVAILABLE' ? '🟢' : '🔴'} Seat {s.seatNumber} — Zone: {s.zone} ({s.status === 'AVAILABLE' ? 'Available' : `Occupied by ${s.member?.fullName || 'Active Member'}`})
                    </option>
                  ))}
                </select>
                <span className="field-hint">One member per cabin. Zero desk switching during active tenure.</span>
              </div>
            </div>

            <div className="form-field" style={{ marginTop: '0.75rem' }}>
              <label className="form-label">
                <span>Initial Password Provisioning</span>
                <span className="req">*</span>
              </label>

              <div className="password-selector-grid">
                {/* Option 1: Auto-generate */}
                <div
                  className={`pwd-option-card ${autoPassword ? 'is-selected' : ''}`}
                  onClick={() => setAutoPassword(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAutoPassword(true); }}
                >
                  <span className="pwd-radio-dot" />
                  <div className="pwd-card-content">
                    <span className="pwd-card-title">
                      Auto-Generate Password
                      <span className="pwd-card-badge">RECOMMENDED</span>
                    </span>
                    <span className="pwd-card-desc">
                      Pattern: <code>Synapz@&lt;last4digits&gt;</code>{' '}
                      {mobileNumber.length >= 4 ? (
                        <strong>(Preview: Synapz@{mobileNumber.slice(-4)})</strong>
                      ) : (
                        <em>(e.g. Synapz@2891)</em>
                      )}
                    </span>
                  </div>
                </div>

                {/* Option 2: Custom Password */}
                <div
                  className={`pwd-option-card ${!autoPassword ? 'is-selected' : ''}`}
                  onClick={() => setAutoPassword(false)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setAutoPassword(false); }}
                >
                  <span className="pwd-radio-dot" />
                  <div className="pwd-card-content">
                    <span className="pwd-card-title">Set Custom Password</span>
                    <span className="pwd-card-desc">
                      Manually define student password (min 6 characters).
                    </span>
                  </div>
                </div>
              </div>

              {!autoPassword && (
                <div style={{ marginTop: '0.75rem' }}>
                  <input
                    type="text"
                    required
                    minLength={6}
                    placeholder="Enter custom password (min 6 chars, e.g. Focus@2026)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input font-mono"
                    disabled={submitting}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section 02: Academic Goal & Personal Profile */}
          <div className="admin-form-section">
            <div className="form-section-header">
              <span className="section-num-pill">02</span>
              <div className="section-header-text">
                <h3>Academic & Administrative Details</h3>
                <p>Optional student examination focus, tenure dates, and administrative record keeping.</p>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="reg-purpose" className="form-label">
                  <span>Study Goal / Exam Target</span>
                </label>
                <input
                  id="reg-purpose"
                  type="text"
                  placeholder="e.g. UPSC CSE / NEET-PG / GATE / APPSC Group 1"
                  value={studyPurpose}
                  onChange={(e) => setStudyPurpose(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-aadhaar" className="form-label">
                  <span>Aadhaar Number (ID Verification)</span>
                </label>
                <input
                  id="reg-aadhaar"
                  type="text"
                  maxLength={14}
                  placeholder="XXXX-XXXX-XXXX"
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                  className="form-input font-mono"
                  disabled={submitting}
                />
                <span className="field-hint">Masked upon storage. Only last 4 digits displayed.</span>
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-field">
                <label htmlFor="reg-start-date" className="form-label">
                  <span>Membership Start Date</span>
                </label>
                <input
                  id="reg-start-date"
                  type="date"
                  value={membershipStartDate}
                  onChange={(e) => setMembershipStartDate(e.target.value)}
                  className="form-input font-mono"
                  disabled={submitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-end-date" className="form-label">
                  <span>End Date (Optional)</span>
                </label>
                <input
                  id="reg-end-date"
                  type="date"
                  value={membershipEndDate}
                  onChange={(e) => setMembershipEndDate(e.target.value)}
                  className="form-input font-mono"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-grid-1">
              <div className="form-field">
                <label htmlFor="reg-address" className="form-label">
                  <span>Residential Address</span>
                </label>
                <input
                  id="reg-address"
                  type="text"
                  placeholder="e.g. LIG-A-333, PM Palem / Madhurawada, Visakhapatnam"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="form-input"
                  disabled={submitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="reg-notes" className="form-label">
                  <span>Internal Administrative Notes</span>
                </label>
                <textarea
                  id="reg-notes"
                  rows={3}
                  placeholder="e.g. Locker #4 requested, referral student, fee receipt #4021"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-textarea"
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="admin-form-footer">
            <div className="form-security-badge">
              <span>🔒 Hashed with bcrypt · Never plaintext · Asia/Kolkata</span>
            </div>
            <div className="form-buttons-group">
              <Link to="/admin/members" className="btn btn-ghost-dark">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !fullName.trim() || mobileNumber.replace(/\D/g, '').length !== 10 || !seatNumber}
                className="btn btn-terracotta btn-lg"
              >
                {submitting ? 'Registering & Allotting Cabin...' : 'Complete Member Registration ➔'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
