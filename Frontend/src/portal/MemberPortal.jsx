import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function MemberPortal({ initialMember, onLogout, onClose }) {
  const [member, setMember] = useState(initialMember);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(initialMember ? 'dashboard' : 'mobile'); // 'mobile' | 'otp' | 'dashboard'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

  // Dashboard state
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    if (member) {
      loadTodayStatus();
      loadHistory();
    }
  }, [member]);

  const loadTodayStatus = async () => {
    try {
      setCheckingAttendance(true);
      const res = await api.getTodayAttendance();
      if (res.marked && res.attendance) {
        setTodayAttendance(res.attendance);
      } else {
        setTodayAttendance(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingAttendance(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.getMemberHistory();
      setAttendanceHistory(res.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Request OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const cleanMobile = mobileNumber.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        throw new Error('Please enter a valid 10-digit Indian mobile number.');
      }
      const res = await api.requestMemberOtp(cleanMobile);
      setStep('otp');
      setSuccessMsg(res.message);
      if (res.devOtp) {
        setDevOtpHint(res.devOtp);
        setOtp(res.devOtp); // Auto-fill for seamless testing in dev
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await api.verifyMemberOtp(mobileNumber, otp);
      setMember(res.member);
      setStep('dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. One-Tap Mark Attendance
  const handleMarkAttendance = async () => {
    setError('');
    setSuccessMsg('');
    setMarking(true);
    try {
      const res = await api.markAttendance();
      setTodayAttendance(res.attendance);
      setSuccessMsg(res.message);
      loadHistory(); // refresh history list
    } catch (err) {
      setError(err.message);
    } finally {
      setMarking(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await api.logout();
      setMember(null);
      setStep('mobile');
      setMobileNumber('');
      setOtp('');
      setTodayAttendance(null);
      if (onLogout) onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="portal-container">
      {/* Top Header */}
      <div className="portal-header">
        <div className="portal-brand">
          <img src="/synapz-logo.png" alt="Synapz Logo" className="portal-brand-logo" />
          <div>
            <h3>SYNAPZ MEMBER PORTAL</h3>
            <span className="datum-tag datum-tag--dark">DIGITAL ATTENDANCE & CABIN ACCESS</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {member && (
            <button type="button" onClick={handleLogoutClick} className="btn btn-ghost-light btn-sm">
              Log Out
            </button>
          )}
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close portal" style={{ position: 'static' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="portal-body">
        {/* Error and Success Alerts */}
        {error && (
          <div className="portal-alert portal-alert--error" role="alert">
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="portal-alert portal-alert--success" role="status">
            <span style={{ fontSize: '1.2rem' }}>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: ENTER MOBILE NUMBER */}
        {step === 'mobile' && (
          <div className="portal-card">
            <span className="datum-tag" style={{ marginBottom: '0.75rem' }}>MEMBER AUTHENTICATION</span>
            <h2 className="portal-card-title">Access Your Study Desk</h2>
            <p className="portal-card-desc">
              Enter your registered 10-digit mobile number. We will send a secure one-time verification code.
            </p>

            <form onSubmit={handleRequestOtp} className="portal-form">
              <div className="portal-input-group">
                <label htmlFor="member-mobile">Mobile Number (India)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ padding: '0.75rem 0.85rem', backgroundColor: 'var(--parchment-tint)', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', border: '1px solid var(--border-light)' }}>
                    +91
                  </span>
                  <input
                    id="member-mobile"
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="94927 22891"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem 1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)', fontSize: '1rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <small style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                  Demo Aspirant: <strong>9492722891</strong> (Seat C) or <strong>9876543210</strong> (Seat 13)
                </small>
              </div>

              <button type="submit" disabled={loading} className="btn btn-terracotta" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Sending Code...' : 'Send Verification Code ↗'}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: ENTER OTP */}
        {step === 'otp' && (
          <div className="portal-card">
            <span className="datum-tag" style={{ marginBottom: '0.75rem' }}>SECURE VERIFICATION</span>
            <h2 className="portal-card-title">Enter 6-Digit Code</h2>
            <p className="portal-card-desc">
              We sent a 6-digit code to <strong>+91 {mobileNumber}</strong>.
            </p>

            {devOtpHint && (
              <div style={{ padding: '0.65rem 1rem', backgroundColor: 'var(--lavender-tint)', borderRadius: 'var(--radius-xs)', marginBottom: '1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink)' }}>
                [Dev Mode] Verification Code: <strong>{devOtpHint}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="portal-form">
              <div className="portal-input-group">
                <label htmlFor="member-otp">One-Time Password (OTP)</label>
                <input
                  id="member-otp"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem', fontFamily: 'var(--font-mono)', padding: '0.75rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)' }}
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-terracotta" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Verifying...' : 'Verify & Open Dashboard ↗'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem' }}>
                <button type="button" onClick={() => setStep('mobile')} className="btn-portal-link" style={{ border: 'none', padding: 0 }}>
                  ← Change Number
                </button>
                <button type="button" onClick={handleRequestOtp} disabled={loading} className="btn-portal-link" style={{ border: 'none', padding: 0 }}>
                  Resend Code
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: MEMBER DASHBOARD */}
        {step === 'dashboard' && member && (
          <div className="portal-dashboard-grid">
            {/* Member Profile Overview Card */}
            <div className="portal-card" style={{ background: 'var(--chalk)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <span className="datum-tag">MEMBER IDENTIFIER: {member.memberCode}</span>
                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.1rem', color: 'var(--ink)', margin: '0.25rem 0' }}>
                    {member.fullName}
                  </h2>
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.88rem' }}>
                    Target: <strong>{member.studyPurpose || 'Academic / Competitive Preparation'}</strong>
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                  <div className="portal-seat-pill">
                    <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>ALLOTTED CABIN</span>
                    <strong style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: 'var(--terracotta)' }}>
                      SEAT {member.allottedSeatNumber || 'N/A'}
                    </strong>
                  </div>
                  <span className={`status-badge status-badge--${member.status.toLowerCase()}`}>
                    ● {member.status}
                  </span>
                </div>
              </div>
            </div>

            {/* THE ONE-TAP ATTENDANCE CARD */}
            <div className="attendance-action-card">
              <span className="datum-tag datum-tag--dark" style={{ marginBottom: '0.5rem' }}>
                TODAY'S ATTENDANCE · ASIA/KOLKATA TIMEZONE
              </span>
              
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.85rem', color: 'var(--parchment)', marginBottom: '0.5rem' }}>
                Daily Study Session Check-In
              </h3>

              <p style={{ color: 'rgba(242, 238, 229, 0.7)', fontSize: '0.92rem', marginBottom: '1.75rem', maxWidth: '540px' }}>
                Tap once upon reaching your cabin to register your daily attendance. The backend records your identity, assigned seat number, and accurate server timestamp.
              </p>

              {checkingAttendance ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--parchment)' }}>
                  Verifying today's attendance status...
                </div>
              ) : todayAttendance ? (
                /* Attendance already completed today */
                <div className="attendance-completed-banner">
                  <div className="completed-icon">✓</div>
                  <div>
                    <h4 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1B4D2E', marginBottom: '0.2rem' }}>
                      Attendance Completed for Today
                    </h4>
                    <p style={{ fontSize: '0.88rem', color: '#2B5738' }}>
                      Recorded at <strong>{todayAttendance.formattedTime} IST</strong> for Allotted Cabin <strong>Seat {todayAttendance.seatNumber}</strong>.
                    </p>
                    <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#3E6B4B', textTransform: 'uppercase', marginTop: '0.25rem', display: 'inline-block' }}>
                      DATE: {todayAttendance.attendanceDate} · METHOD: SELF SERVICE
                    </span>
                  </div>
                </div>
              ) : (
                /* Attendance not yet marked */
                <div>
                  <button
                    type="button"
                    disabled={marking || member.status !== 'ACTIVE'}
                    onClick={handleMarkAttendance}
                    className="btn btn-terracotta attendance-big-btn"
                  >
                    {marking ? (
                      <span>Recording Attendance...</span>
                    ) : (
                      <>
                        <span style={{ fontSize: '1.3rem' }}>⚡</span>
                        <span>Mark Today's Attendance</span>
                      </>
                    )}
                  </button>
                  <div style={{ marginTop: '0.85rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(242, 238, 229, 0.6)' }}>
                    TIMESTAMP WILL BE GENERATED BY SERVER CLOCK (Asia/Kolkata)
                  </div>
                </div>
              )}
            </div>

            {/* Attendance History Section */}
            <div className="portal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <span className="datum-tag">ATTENDANCE LOG</span>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem', color: 'var(--ink)' }}>
                    Your Recent Study Sessions
                  </h3>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Total Sessions: {attendanceHistory.length}
                </span>
              </div>

              {attendanceHistory.length === 0 ? (
                <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                  No previous check-in records found. Mark your attendance above to start your log.
                </p>
              ) : (
                <div className="portal-table-wrapper">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Seat</th>
                        <th>Check-In Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map(item => (
                        <tr key={item.id}>
                          <td><strong>{item.date}</strong></td>
                          <td><span className="seat-badge">{item.seatNumber}</span></td>
                          <td>{item.formattedTime}</td>
                          <td>
                            <span className="status-chip status-chip--present">
                              ✓ Checked In
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
