import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function MemberDashboardPage() {
  const { member } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [todayStatus, setTodayStatus] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);

  // Fetch today's attendance status & history
  useEffect(() => {
    let isMounted = true;
    async function fetchData() {
      try {
        const [todayRes, historyRes] = await Promise.all([
          api.getTodayAttendance(),
          api.getMemberHistory()
        ]);
        if (!isMounted) return;

        const att = todayRes?.attendance || todayRes?.record;
        const isMarked = Boolean(todayRes?.marked || todayRes?.hasCheckedInToday || att);
        if (isMarked && att) {
          setTodayStatus({
            hasCheckedInToday: true,
            attendanceDate: att.attendanceDate,
            checkInTime: att.formattedTime || att.checkInTime || 'Recorded',
            formattedDateTime: att.formattedDateTime,
            seatNumber: att.seatNumber || att.seatNumberSnapshot || member?.allottedSeatNumber,
            method: att.method || 'MEMBER_SELF_SERVICE'
          });
        } else {
          setTodayStatus({ hasCheckedInToday: false });
        }

        setRecentRecords(historyRes?.records ? historyRes.records.slice(0, 5) : []);
      } catch (err) {
        console.error('Fetch dashboard error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchData();
    return () => { isMounted = false; };
  }, [member]);

  const handleCheckIn = async () => {
    if (checkingIn || todayStatus?.hasCheckedInToday) return;

    setCheckingIn(true);

    try {
      const res = await api.markAttendance();
      if (res.success) {
        const att = res.attendance || res.record || {};
        const recordedTime = att.formattedTime || att.checkInTime || 'Recorded';
        const seat = att.seatNumber || att.seatNumberSnapshot || member?.allottedSeatNumber;
        const formattedDate = att.formattedDateTime || todayFormatted;

        setTodayStatus({
          hasCheckedInToday: true,
          attendanceDate: att.attendanceDate,
          checkInTime: recordedTime,
          formattedDateTime: formattedDate,
          seatNumber: seat,
          method: att.method || 'MEMBER_SELF_SERVICE'
        });
        toast.success(
          'Attendance Recorded!',
          res.message || `Today's attendance recorded at ${recordedTime} IST for Cabin ${seat}.`
        );
        // Refresh recent records
        const updatedHistory = await api.getMemberHistory();
        if (updatedHistory?.records) {
          setRecentRecords(updatedHistory.records.slice(0, 5));
        }
      } else {
        toast.error('Check-in Notice', res.error || res.message || 'Failed to mark attendance.');
      }
    } catch (err) {
      toast.error('Check-in Error', err.message || 'Check-in failed. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Retrieving today's attendance status..." />;
  }

  // Format today's date in Asia/Kolkata
  const todayFormatted = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const isCheckedIn = todayStatus?.hasCheckedInToday;

  return (
    <div className="member-page-container">
      {/* Welcome Banner */}
      <div className="member-welcome-banner">
        <div className="welcome-text-wrap">
          <span className="welcome-greeting">Focus Session</span>
          <h1 className="welcome-name">Welcome back, {member?.fullName}</h1>
          <div className="welcome-meta">
            <span className="meta-pill member-code-pill">ID: {member?.memberCode}</span>
            <span className="meta-pill seat-pill">Cabin: {member?.allottedSeatNumber || 'Unassigned'}</span>
            <span className="meta-pill status-pill status-active">Active Member</span>
          </div>
        </div>
        <div className="welcome-date-wrap">
          <span className="date-label">Today in Madhurawada</span>
          <span className="date-val">{todayFormatted}</span>
        </div>
      </div>

      {/* Main One-Tap Attendance Action Card */}
      <div className={`attendance-hero-card ${isCheckedIn ? 'is-completed' : 'is-pending'}`}>
        <div className="card-top-row">
          <div className="status-indicator-wrap">
            <span className={`status-badge-dot ${isCheckedIn ? 'bg-olive' : 'bg-terracotta'}`} />
            <span className="status-badge-text">
              {isCheckedIn ? "Today's Attendance Recorded" : 'Check-in Pending for Today'}
            </span>
          </div>
          <span className="card-seat-tag">Cabin {member?.allottedSeatNumber}</span>
        </div>

        <div className="card-center-action">
          {isCheckedIn ? (
            <div className="attendance-confirmed-box">
              <div className="confirmed-icon">✓</div>
              <h2 className="confirmed-title">You are Checked In Today</h2>
              <p className="confirmed-subtitle">
                Recorded at <strong>{todayStatus?.checkInTime} IST</strong> for Cabin {todayStatus?.seatNumber || member?.allottedSeatNumber}.
              </p>
              {todayStatus?.formattedDateTime && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--olive)', fontWeight: 600 }}>
                  <span>✓ Verified: {todayStatus.formattedDateTime}</span>
                </div>
              )}
              <div className="attendance-guarantee-note">
                <span>🛡️ Single daily attendance recorded in accordance with Synapz Study Zone regulations.</span>
              </div>
            </div>
          ) : (
            <div className="attendance-action-box">
              <h2 className="action-title">Tap to Mark Today's Attendance</h2>
              <p className="action-description">
                Tap once when you arrive at your study cabin to record your daily focus session.
              </p>
              <button
                type="button"
                onClick={handleCheckIn}
                disabled={checkingIn}
                className="btn btn-terracotta btn-checkin-large"
                id="btn-mark-today-attendance"
              >
                {checkingIn ? (
                  <span className="btn-loading-wrap">
                    <span className="spinner-mini" />
                    Recording check-in...
                  </span>
                ) : (
                  <>
                    <span className="btn-checkin-icon">👆</span>
                    <span>Mark Today's Attendance</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Cabin Info & Recent History */}
      <div className="member-dashboard-grid">
        {/* Cabin Card */}
        <div className="info-card cabin-info-card">
          <div className="card-header-clean">
            <h3 className="card-title">Study Cabin Assignment</h3>
            <span className="card-tag">Dedicated</span>
          </div>
          <div className="cabin-big-display">
            <div className="cabin-box">
              <span className="cabin-label">Cabin</span>
              <span className="cabin-number">{member?.allottedSeatNumber || '—'}</span>
            </div>
            <div className="cabin-details-list">
              <div className="detail-row">
                <span className="detail-name">Member Name</span>
                <span className="detail-value">{member?.fullName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-name">Registered Mobile</span>
                <span className="detail-value">+91 {member?.mobileNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-name">Target / Purpose</span>
                <span className="detail-value">{member?.studyPurpose || 'Academic / Competitive Prep'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-name">Shift Timing</span>
                <span className="detail-value">06:00 AM – 10:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Attendance History Widget */}
        <div className="info-card history-preview-card">
          <div className="card-header-clean">
            <h3 className="card-title">Recent Attendance History</h3>
            <Link to="/member/attendance" className="card-link">
              View All History →
            </Link>
          </div>

          {recentRecords.length === 0 ? (
            <div className="empty-state-simple">
              <p>No prior attendance records found. Tap the check-in button above to record your first day!</p>
            </div>
          ) : (
            <div className="recent-records-list">
              {recentRecords.map((rec) => (
                <div key={rec.id} className="recent-record-row">
                  <div className="rec-left">
                    <span className="rec-check-icon">✓</span>
                    <div className="rec-date-wrap">
                      <span className="rec-date">{rec.attendanceDate}</span>
                      <span className="rec-time">{rec.checkInTime} IST</span>
                    </div>
                  </div>
                  <div className="rec-right">
                    <span className="rec-seat">Seat {rec.seatNumber}</span>
                    <span className="rec-status-badge">Present</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
