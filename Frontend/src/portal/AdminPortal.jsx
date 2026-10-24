import React, { useState, useEffect } from 'react';
import { api } from './api';

export default function AdminPortal({ initialAdmin, onLogout, onClose }) {
  const [admin, setAdmin] = useState(initialAdmin);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'daily' | 'history' | 'register' | 'members' | 'seats'

  // Admin Login state
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Dashboard Overview state
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Daily Attendance state
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  });
  const [dailyData, setDailyData] = useState({ attendance: [], absentMembers: [], summary: {} });
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailySearch, setDailySearch] = useState('');

  // Attendance History state
  const [historyData, setHistoryData] = useState({ records: [], total: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historySeatFilter, setHistorySeatFilter] = useState('');

  // Member Registration Form state
  const [regForm, setRegForm] = useState({
    fullName: '',
    mobileNumber: '',
    seatNumber: '',
    studyPurpose: '',
    address: '',
    notes: ''
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regMessage, setRegMessage] = useState({ type: '', text: '' });

  // Members List state
  const [membersList, setMembersList] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState('');
  const [editingMember, setEditingMember] = useState(null);

  // Seat Management state
  const [seatsList, setSeatsList] = useState([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [assignModal, setAssignModal] = useState({ isOpen: false, seatNumber: '', memberId: '' });

  // Load data based on active tab
  useEffect(() => {
    if (admin) {
      if (activeTab === 'dashboard') loadMetrics();
      if (activeTab === 'daily') loadDailyAttendance();
      if (activeTab === 'history') loadHistory();
      if (activeTab === 'register' || activeTab === 'seats') loadSeats();
      if (activeTab === 'members') loadMembers();
    }
  }, [admin, activeTab]);

  useEffect(() => {
    if (admin && activeTab === 'daily') {
      loadDailyAttendance();
    }
  }, [selectedDate]);

  // Auth Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await api.loginAdmin(username, password);
      setAdmin(res.admin);
      setActiveTab('dashboard');
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setAdmin(null);
      if (onLogout) onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  // Data Fetchers
  const loadMetrics = async () => {
    setMetricsLoading(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res.metrics);
    } catch (err) {
      console.error(err);
    } finally {
      setMetricsLoading(false);
    }
  };

  const loadDailyAttendance = async () => {
    setDailyLoading(true);
    try {
      const res = await api.getDailyAttendance({ date: selectedDate, search: dailySearch });
      setDailyData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDailyLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const params = {};
      if (historyStartDate) params.startDate = historyStartDate;
      if (historyEndDate) params.endDate = historyEndDate;
      if (historySeatFilter) params.seatNumber = historySeatFilter;
      const res = await api.getAttendanceHistory(params);
      setHistoryData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadMembers = async () => {
    setMembersLoading(true);
    try {
      const params = {};
      if (memberSearch) params.search = memberSearch;
      if (memberStatusFilter) params.status = memberStatusFilter;
      const res = await api.listMembers(params);
      setMembersList(res.members || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMembersLoading(false);
    }
  };

  const loadSeats = async () => {
    setSeatsLoading(true);
    try {
      const res = await api.listSeats();
      setSeatsList(res.seats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSeatsLoading(false);
    }
  };

  // Register Member Handler
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegMessage({ type: '', text: '' });
    setRegLoading(true);
    try {
      const res = await api.registerMember(regForm);
      setRegMessage({ type: 'success', text: res.message });
      setRegForm({
        fullName: '',
        mobileNumber: '',
        seatNumber: '',
        studyPurpose: '',
        address: '',
        notes: ''
      });
      loadSeats();
      loadMetrics();
    } catch (err) {
      setRegMessage({ type: 'error', text: err.message });
    } finally {
      setRegLoading(false);
    }
  };

  // Change Member Status
  const handleStatusChange = async (memberId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change member status to ${newStatus}?`)) return;
    try {
      await api.updateMemberStatus(memberId, newStatus);
      loadMembers();
      loadMetrics();
      loadSeats();
    } catch (err) {
      alert(err.message);
    }
  };

  // Assign Seat Handler
  const handleAssignSeatSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.assignSeat(assignModal.seatNumber, assignModal.memberId);
      setAssignModal({ isOpen: false, seatNumber: '', memberId: '' });
      loadSeats();
      loadMembers();
      loadMetrics();
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV Export Trigger
  const handleExportCsv = (dateParam) => {
    const params = dateParam ? { date: dateParam } : {};
    if (!dateParam && historyStartDate && historyEndDate) {
      params.startDate = historyStartDate;
      params.endDate = historyEndDate;
    }
    const url = api.exportAttendanceUrl(params);
    window.open(url, '_blank');
  };

  // If not logged in as Admin, show login form
  if (!admin) {
    return (
      <div className="portal-container">
        <div className="portal-header">
          <div className="portal-brand">
            <img src="/synapz-logo.png" alt="Synapz Logo" className="portal-brand-logo" />
            <div>
              <h3>SYNAPZ ADMINISTRATION</h3>
              <span className="datum-tag datum-tag--dark">SECURE CONTROL CONSOLE</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close" style={{ position: 'static' }}>✕</button>
        </div>

        <div className="portal-body" style={{ maxWidth: '520px', margin: '2rem auto' }}>
          {authError && (
            <div className="portal-alert portal-alert--error" style={{ marginBottom: '1.5rem' }}>
              <span>⚠️</span>
              <span>{authError}</span>
            </div>
          )}

          <div className="portal-card">
            <span className="datum-tag" style={{ marginBottom: '0.75rem' }}>ADMIN ACCESS REQUIRED</span>
            <h2 className="portal-card-title">Sign In to Admin Portal</h2>
            <p className="portal-card-desc">
              Manage student registrations, seating allocations, daily attendance logs, and audit reports.
            </p>

            <form onSubmit={handleAdminLogin} className="portal-form">
              <div className="portal-input-group">
                <label htmlFor="admin-username">Username</label>
                <input
                  id="admin-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)' }}
                />
              </div>

              <div className="portal-input-group">
                <label htmlFor="admin-pw">Password</label>
                <input
                  id="admin-pw"
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xs)' }}
                />
                <small style={{ color: 'var(--ink-muted)', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                  Default Admin: username: <strong>admin</strong> | password: <strong>synapz@focus2026</strong>
                </small>
              </div>

              <button type="submit" disabled={authLoading} className="btn btn-terracotta" style={{ width: '100%', marginTop: '0.5rem' }}>
                {authLoading ? 'Verifying Credentials...' : 'Authenticate ↗'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard Main Layout
  return (
    <div className="portal-container admin-portal-wrapper">
      {/* Admin Top Header */}
      <div className="portal-header">
        <div className="portal-brand">
          <img src="/synapz-logo.png" alt="Synapz Logo" className="portal-brand-logo" />
          <div>
            <h3>SYNAPZ ADMIN CONSOLE</h3>
            <span className="datum-tag datum-tag--dark">LOGGED IN AS {admin.name} ({admin.role})</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={handleLogout} className="btn btn-ghost-light btn-sm">
            Sign Out
          </button>
          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close" style={{ position: 'static' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'is-active' : ''}`}
        >
          📊 Dashboard Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('daily')}
          className={`admin-tab-btn ${activeTab === 'daily' ? 'is-active' : ''}`}
        >
          📅 Daily Attendance
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`admin-tab-btn ${activeTab === 'history' ? 'is-active' : ''}`}
        >
          ⏱️ Attendance History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('register')}
          className={`admin-tab-btn ${activeTab === 'register' ? 'is-active' : ''}`}
        >
          ✍️ Register Member
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`admin-tab-btn ${activeTab === 'members' ? 'is-active' : ''}`}
        >
          👥 Members List
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seats')}
          className={`admin-tab-btn ${activeTab === 'seats' ? 'is-active' : ''}`}
        >
          🪑 Seat Management (32)
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="portal-body">
        
        {/* 1. DASHBOARD OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="datum-tag">REAL-TIME READING ROOM METRICS</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)' }}>
                  Operations Overview
                </h2>
              </div>
              <button type="button" onClick={loadMetrics} className="btn btn-ghost-dark btn-sm">
                ↻ Refresh Metrics
              </button>
            </div>

            {metricsLoading || !metrics ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading live operational data...</div>
            ) : (
              <div className="admin-metrics-grid">
                <div className="metric-card">
                  <span className="metric-card-label">TOTAL REGISTERED MEMBERS</span>
                  <span className="metric-card-val">{metrics.totalMembers}</span>
                  <span className="metric-card-sub">All-time member registrations</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">ACTIVE MEMBERS</span>
                  <span className="metric-card-val" style={{ color: 'var(--olive)' }}>{metrics.activeMembers}</span>
                  <span className="metric-card-sub">Members eligible for daily check-in</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">CHECKED IN TODAY (IST)</span>
                  <span className="metric-card-val" style={{ color: 'var(--terracotta)' }}>{metrics.todayAttendance}</span>
                  <span className="metric-card-sub">Confirmed digital attendance for today</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">NOT YET CHECKED IN TODAY</span>
                  <span className="metric-card-val" style={{ color: '#D9822B' }}>{metrics.notCheckedInToday}</span>
                  <span className="metric-card-sub">Active members pending check-in</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">TOTAL ALLOTTED SEATS</span>
                  <span className="metric-card-val">{metrics.allottedSeats} / {metrics.totalSeats}</span>
                  <span className="metric-card-sub">Assigned cabins out of 32 units</span>
                </div>
                <div className="metric-card">
                  <span className="metric-card-label">AVAILABLE SEATS</span>
                  <span className="metric-card-val" style={{ color: 'var(--olive)' }}>{metrics.availableSeats}</span>
                  <span className="metric-card-sub">Vacant cabins ready for allotment</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. DAILY ATTENDANCE SCREEN */}
        {activeTab === 'daily' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="datum-tag">DATE-WISE VERIFIED ATTENDANCE</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)' }}>
                  Daily Attendance Log
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', fontFamily: 'var(--font-mono)' }}
                />
                <button
                  type="button"
                  onClick={() => handleExportCsv(selectedDate)}
                  className="btn btn-terracotta btn-sm"
                >
                  📥 Export Day CSV
                </button>
              </div>
            </div>

            {/* Daily Summary Bar */}
            <div className="daily-stats-strip">
              <div>
                <span>Selected Date:</span> <strong>{selectedDate} (IST)</strong>
              </div>
              <div>
                <span>Present:</span> <strong style={{ color: 'var(--olive)' }}>{dailyData.summary?.totalPresent || 0}</strong>
              </div>
              <div>
                <span>Absent / Pending:</span> <strong style={{ color: '#D9822B' }}>{dailyData.summary?.totalAbsent || 0}</strong>
              </div>
              <div>
                <span>Total Active Roster:</span> <strong>{dailyData.summary?.totalActive || 0}</strong>
              </div>
            </div>

            {/* Search filter input */}
            <div style={{ margin: '1.25rem 0' }}>
              <input
                type="text"
                placeholder="Search attendees by name, mobile, seat, or ID..."
                value={dailySearch}
                onChange={(e) => {
                  setDailySearch(e.target.value);
                  loadDailyAttendance();
                }}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
              />
            </div>

            {dailyLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading daily attendance records...</div>
            ) : (
              <div>
                {/* Present Members Table */}
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--ink)', margin: '1.5rem 0 0.75rem' }}>
                  ✓ Checked-In Members ({dailyData.attendance?.length || 0})
                </h3>
                {dailyData.attendance?.length === 0 ? (
                  <p style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', padding: '1rem 0' }}>
                    No member has marked attendance yet for {selectedDate}.
                  </p>
                ) : (
                  <div className="portal-table-wrapper">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Member ID</th>
                          <th>Member Name</th>
                          <th>Seat</th>
                          <th>Mobile</th>
                          <th>Check-In Time (IST)</th>
                          <th>Method</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.attendance.map((rec) => (
                          <tr key={rec.id}>
                            <td><strong>{rec.memberCode}</strong></td>
                            <td>{rec.fullName}</td>
                            <td><span className="seat-badge">{rec.seatNumber}</span></td>
                            <td>{rec.mobileNumber}</td>
                            <td>{rec.checkInTime}</td>
                            <td><span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{rec.method}</span></td>
                            <td>
                              <span className="status-chip status-chip--present">
                                Verified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Absent Members Section */}
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', color: 'var(--ink)', margin: '2.5rem 0 0.75rem' }}>
                  ⏳ Active Members Not Checked In ({dailyData.absentMembers?.length || 0})
                </h3>
                {dailyData.absentMembers?.length === 0 ? (
                  <p style={{ color: 'var(--olive)', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                    100% Attendance! All active members have checked in for this date.
                  </p>
                ) : (
                  <div className="portal-table-wrapper">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>Member ID</th>
                          <th>Member Name</th>
                          <th>Allotted Seat</th>
                          <th>Mobile</th>
                          <th>Study Target</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailyData.absentMembers.map((m) => (
                          <tr key={m.id}>
                            <td>{m.memberCode}</td>
                            <td><strong>{m.fullName}</strong></td>
                            <td><span className="seat-badge">{m.allottedSeatNumber}</span></td>
                            <td>{m.mobileNumber}</td>
                            <td>{m.studyPurpose || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. ATTENDANCE HISTORY SCREEN */}
        {activeTab === 'history' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="datum-tag">HISTORICAL AUDIT & LOGS</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)' }}>
                  Attendance History
                </h2>
              </div>
              <button
                type="button"
                onClick={() => handleExportCsv()}
                className="btn btn-terracotta btn-sm"
              >
                📥 Export Filtered CSV
              </button>
            </div>

            {/* Filter Bar */}
            <div className="admin-filter-bar">
              <div className="filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={historyStartDate}
                  onChange={(e) => setHistoryStartDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={historyEndDate}
                  onChange={(e) => setHistoryEndDate(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label>Seat</label>
                <input
                  type="text"
                  placeholder="e.g. C or 13"
                  value={historySeatFilter}
                  onChange={(e) => setHistorySeatFilter(e.target.value)}
                />
              </div>
              <button type="button" onClick={loadHistory} className="btn btn-ghost-dark btn-sm" style={{ alignSelf: 'flex-end' }}>
                Filter Records
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading historical records...</div>
            ) : (
              <div>
                <div style={{ margin: '1rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
                  Total Recorded Sessions Found: <strong>{historyData.total}</strong>
                </div>

                <div className="portal-table-wrapper">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Member ID</th>
                        <th>Name</th>
                        <th>Seat</th>
                        <th>Mobile</th>
                        <th>Check-In Time</th>
                        <th>Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.records.map((r) => (
                        <tr key={r.id}>
                          <td><strong>{r.date}</strong></td>
                          <td>{r.memberCode}</td>
                          <td>{r.fullName}</td>
                          <td><span className="seat-badge">{r.seatNumber}</span></td>
                          <td>{r.mobileNumber}</td>
                          <td>{r.time}</td>
                          <td><span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{r.method}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. REGISTER MEMBER SCREEN */}
        {activeTab === 'register' && (
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <span className="datum-tag">STUDENT ADMISSION & SEAT ALLOCATION</span>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)', marginBottom: '0.5rem' }}>
              Register New Member
            </h2>
            <p style={{ color: 'var(--ink-muted)', fontSize: '0.92rem', marginBottom: '2rem' }}>
              Assign an allotted seat and register the student's mobile number for one-tap digital attendance access.
            </p>

            {regMessage.text && (
              <div className={`portal-alert portal-alert--${regMessage.type}`} style={{ marginBottom: '1.5rem' }}>
                <span>{regMessage.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{regMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="portal-card portal-form">
              <div className="portal-input-group">
                <label htmlFor="reg-name">Student Full Name *</label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="e.g. Ramesh Varma"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="portal-input-group">
                <label htmlFor="reg-mobile">Indian Mobile Number *</label>
                <input
                  id="reg-mobile"
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="10-digit number (e.g. 9492722891)"
                  value={regForm.mobileNumber}
                  onChange={(e) => setRegForm({ ...regForm, mobileNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', fontFamily: 'var(--font-mono)' }}
                />
                <small style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>
                  This mobile number will be used by the student to receive their login OTP.
                </small>
              </div>

              <div className="portal-input-group">
                <label htmlFor="reg-seat">Allotted Seat Number *</label>
                <select
                  id="reg-seat"
                  required
                  value={regForm.seatNumber}
                  onChange={(e) => setRegForm({ ...regForm, seatNumber: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', fontFamily: 'var(--font-mono)' }}
                >
                  <option value="">Select an available seat...</option>
                  {seatsList
                    .filter(s => s.status === 'AVAILABLE')
                    .map(s => (
                      <option key={s.id} value={s.seatNumber}>
                        Seat {s.seatNumber} ({s.zone})
                      </option>
                    ))}
                </select>
                <small style={{ color: 'var(--ink-muted)', fontSize: '0.75rem' }}>
                  Available seats: {seatsList.filter(s => s.status === 'AVAILABLE').length} of 32
                </small>
              </div>

              <div className="portal-input-group">
                <label htmlFor="reg-purpose">Target Examination / Purpose</label>
                <input
                  id="reg-purpose"
                  type="text"
                  placeholder="e.g. UPSC / NEET PG / GATE / State PSC / Coding"
                  value={regForm.studyPurpose}
                  onChange={(e) => setRegForm({ ...regForm, studyPurpose: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="portal-input-group">
                <label htmlFor="reg-address">Residential Address</label>
                <input
                  id="reg-address"
                  type="text"
                  placeholder="e.g. Midhilapuri Vuda Colony, Madhurawada"
                  value={regForm.address}
                  onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <div className="portal-input-group">
                <label htmlFor="reg-notes">Admin Notes</label>
                <textarea
                  id="reg-notes"
                  rows={2}
                  placeholder="Special requests, locker number, or fee details"
                  value={regForm.notes}
                  onChange={(e) => setRegForm({ ...regForm, notes: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
                />
              </div>

              <button type="submit" disabled={regLoading} className="btn btn-terracotta" style={{ width: '100%', marginTop: '0.5rem' }}>
                {regLoading ? 'Registering Student...' : 'Confirm Registration & Seat Allotment ↗'}
              </button>
            </form>
          </div>
        )}

        {/* 5. MEMBERS LIST & ROSTER */}
        {activeTab === 'members' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="datum-tag">MEMBER DIRECTORY & STATUS MANAGEMENT</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)' }}>
                  Registered Members
                </h2>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <select
                  value={memberStatusFilter}
                  onChange={(e) => setMemberStatusFilter(e.target.value)}
                  style={{ padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                <button type="button" onClick={loadMembers} className="btn btn-ghost-dark btn-sm">
                  Filter
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Search member by name, mobile, seat, or ID..."
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
                  loadMembers();
                }}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)' }}
              />
            </div>

            {membersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading member directory...</div>
            ) : (
              <div className="portal-table-wrapper">
                <table className="portal-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Mobile</th>
                      <th>Seat</th>
                      <th>Target Exam</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersList.map((m) => (
                      <tr key={m.id}>
                        <td><strong>{m.memberCode}</strong></td>
                        <td>{m.fullName}</td>
                        <td>{m.mobileNumber}</td>
                        <td><span className="seat-badge">{m.allottedSeatNumber || 'None'}</span></td>
                        <td>{m.studyPurpose || '—'}</td>
                        <td>
                          <span className={`status-badge status-badge--${m.status.toLowerCase()}`}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {m.status === 'ACTIVE' ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(m.id, 'SUSPENDED')}
                                className="btn-portal-link"
                                style={{ fontSize: '0.7rem', color: '#D9822B' }}
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(m.id, 'ACTIVE')}
                                className="btn-portal-link"
                                style={{ fontSize: '0.7rem', color: 'var(--olive)' }}
                              >
                                Activate
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStatusChange(m.id, 'INACTIVE')}
                              className="btn-portal-link"
                              style={{ fontSize: '0.7rem', color: '#B23A2B' }}
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. SEAT MANAGEMENT (32 SEATS) */}
        {activeTab === 'seats' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span className="datum-tag">FLOOR PLAN & WORKSTATION ALLOTMENT</span>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.2rem', color: 'var(--ink)' }}>
                  Seat Management (32 Cabins)
                </h2>
              </div>
              <button type="button" onClick={loadSeats} className="btn btn-ghost-dark btn-sm">
                ↻ Refresh Seats
              </button>
            </div>

            {seatsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>Loading seats data...</div>
            ) : (
              <div>
                <div className="seats-admin-grid">
                  {seatsList.map((seat) => {
                    const isAllotted = seat.status === 'ALLOTTED';
                    return (
                      <div
                        key={seat.id}
                        className={`admin-seat-card ${isAllotted ? 'admin-seat-card--allotted' : 'admin-seat-card--available'}`}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <strong style={{ fontSize: '1.35rem', fontFamily: 'var(--font-mono)' }}>
                            Seat {seat.seatNumber}
                          </strong>
                          <span style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                            {seat.zone}
                          </span>
                        </div>

                        {isAllotted && seat.member ? (
                          <div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', display: 'block' }}>Allotted Member:</span>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>{seat.member.fullName}</strong>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)' }}>
                              {seat.member.memberCode} · +91 {seat.member.mobileNumber}
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '0.5rem 0' }}>
                            <span style={{ color: 'var(--olive)', fontSize: '0.85rem', fontWeight: '600' }}>
                              ● Available for Allotment
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
