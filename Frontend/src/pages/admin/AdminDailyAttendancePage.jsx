import React, { useState, useEffect } from 'react';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function AdminDailyAttendancePage() {
  // Today in Asia/Kolkata YYYY-MM-DD
  const getTodayKolkata = () => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const [selectedDate, setSelectedDate] = useState(getTodayKolkata());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PRESENT'); // 'PRESENT' | 'ABSENT'
  const [search, setSearch] = useState('');
  const [data, setData] = useState({
    presentRecords: [],
    absentMembers: [],
    totalPresent: 0,
    totalAbsent: 0
  });

  // Date formatting helpers
  const formatDateDisplayLong = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat('en-IN', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
    } catch (e) {}
    return dateStr;
  };

  const formatDateDisplayShort = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        return new Intl.DateTimeFormat('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }).format(d);
      }
    } catch (e) {}
    return dateStr;
  };

  const fetchAttendance = async (date = selectedDate) => {
    setLoading(true);
    try {
      const res = await api.getDailyAttendance({ date });
      if (res.success) {
        const records = res.attendance || res.presentRecords || [];
        const absent = res.absentMembers || [];
        const presentCount = res.totalPresent ?? res.summary?.totalPresent ?? records.length;
        const absentCount = res.totalAbsent ?? res.summary?.totalAbsent ?? absent.length;

        setData({
          presentRecords: records,
          absentMembers: absent,
          totalPresent: presentCount,
          totalAbsent: absentCount
        });
      }
    } catch (err) {
      console.error('Fetch daily attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(selectedDate);
  }, [selectedDate]);

  // Previous Day Navigation (Timezone-safe)
  const handlePrevDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${dt}`);
  };

  // Next Day Navigation (Timezone-safe)
  const handleNextDay = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dt = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${dt}`);
  };

  // Reset to Today
  const handleToday = () => {
    setSelectedDate(getTodayKolkata());
  };

  // Filter Present Records
  const filteredPresent = data.presentRecords.filter(r => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (r.fullName || r.memberName || '').toLowerCase();
    const mobile = (r.mobileNumber || '').toLowerCase();
    const code = (r.memberCode || '').toLowerCase();
    const seat = (r.seatNumber || '').toLowerCase();
    return name.includes(q) || mobile.includes(q) || code.includes(q) || seat.includes(q);
  });

  // Filter Absent Members
  const filteredAbsent = data.absentMembers.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const name = (m.fullName || m.memberName || '').toLowerCase();
    const mobile = (m.mobileNumber || '').toLowerCase();
    const code = (m.memberCode || '').toLowerCase();
    const seat = (m.allottedSeatNumber || m.seatNumber || '').toLowerCase();
    return name.includes(q) || mobile.includes(q) || code.includes(q) || seat.includes(q);
  });

  const exportUrl = api.exportAttendanceUrl({ type: 'daily', date: selectedDate });
  const isToday = selectedDate === getTodayKolkata();

  return (
    <div className="attendance-page-shell">
      {/* Top Header with Right-Side Actions */}
      <div className="attendance-header-wrap">
        <div className="attendance-title-block">
          <div className="admin-breadcrumb-tag">ADMINISTRATION / DAILY ATTENDANCE</div>
          <h1 className="admin-heading">Daily Attendance Register</h1>
          <p className="admin-subheading">
            Date-wise student check-in verification and physical occupancy audit.
          </p>
        </div>

        {/* Action Controls Aligned to the RIGHT */}
        <div className="attendance-header-actions-right">
          {/* Date Navigator Cluster */}
          <div className="date-navigator-cluster">
            <button
              type="button"
              onClick={handlePrevDay}
              className="btn-nav-arrow"
              title="Previous Day"
              aria-label="Previous Day"
            >
              ‹
            </button>

            <label htmlFor="daily-datepicker" className="date-display-badge" title="Click to select another date">
              <span className="calendar-icon">📅</span>
              <span className="date-text-formatted">{formatDateDisplayLong(selectedDate)}</span>
              <input
                id="daily-datepicker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-picker-hidden-input"
              />
            </label>

            <button
              type="button"
              onClick={handleNextDay}
              className="btn-nav-arrow"
              title="Next Day"
              aria-label="Next Day"
            >
              ›
            </button>

            <button
              type="button"
              onClick={handleToday}
              className={`btn-today-shortcut ${isToday ? 'is-active' : ''}`}
              title="Jump to today"
            >
              Today
            </button>
          </div>

          {/* Export CSV Button */}
          <a
            href={exportUrl}
            className="btn btn-terracotta btn-sm"
            download={`synapz_attendance_${selectedDate}.csv`}
            title="Download CSV for this date"
          >
            📥 Export Date CSV
          </a>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="attendance-kpi-bar">
        <div className="kpi-pill kpi-pill-present">
          <span className="kpi-dot dot-present">●</span>
          <span className="kpi-val">{data.totalPresent}</span>
          <span className="kpi-label">Present Checked-In</span>
        </div>
        <div className="kpi-pill kpi-pill-absent">
          <span className="kpi-dot dot-absent">●</span>
          <span className="kpi-val">{data.totalAbsent}</span>
          <span className="kpi-label">Active Not Checked In</span>
        </div>
        <div className="kpi-pill">
          <span className="kpi-val">{data.totalPresent + data.totalAbsent}</span>
          <span className="kpi-label">Total Assigned Seats</span>
        </div>
      </div>

      {/* Compact Tabular View Card */}
      <div className="admin-compact-table-card">
        {/* Table Toolbar */}
        <div className="table-toolbar-compact">
          <div className="tab-buttons-cluster">
            <button
              type="button"
              className={`tab-btn-pill ${activeTab === 'PRESENT' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('PRESENT')}
            >
              <span>✓ Present Members</span>
              <span className="tab-badge">{data.totalPresent}</span>
            </button>
            <button
              type="button"
              className={`tab-btn-pill ${activeTab === 'ABSENT' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('ABSENT')}
            >
              <span>⏳ Not Checked In</span>
              <span className="tab-badge">{data.totalAbsent}</span>
            </button>
          </div>

          <div className="search-box-compact-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by name, cabin, mobile, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <LoadingSpinner text={`Retrieving attendance for ${formatDateDisplayShort(selectedDate)}...`} />
        ) : activeTab === 'PRESENT' ? (
          filteredPresent.length === 0 ? (
            <div className="empty-state-compact">
              <p>No check-in records found for {formatDateDisplayLong(selectedDate)}.</p>
              {isToday && (
                <p style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                  Members can check in from their mobile portal once they arrive at their cabin.
                </p>
              )}
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="admin-compact-table">
                <thead>
                  <tr>
                    <th className="row-index">#</th>
                    <th>Cabin</th>
                    <th>Member Name</th>
                    <th>Member ID</th>
                    <th>Mobile</th>
                    <th>Check-In Time</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Method</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPresent.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="row-index">{idx + 1}</td>
                      <td>
                        <span className="cabin-tag">Cabin {row.seatNumber || '—'}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--ink)' }}>{row.memberName || row.fullName}</strong>
                      </td>
                      <td>
                        <span className="member-code-badge">{row.memberCode}</span>
                      </td>
                      <td>
                        <span className="font-mono text-muted text-sm">+91 {row.mobileNumber}</span>
                      </td>
                      <td>
                        <span className="time-badge-compact">{row.checkInTime || row.formattedTime || row.time} IST</span>
                      </td>
                      <td>
                        <span className="date-text-compact">{formatDateDisplayShort(row.attendanceDate)}</span>
                      </td>
                      <td>
                        <span className="status-badge-compact status-present">● Present</span>
                      </td>
                      <td>
                        <span className="method-tag-compact">
                          {row.method === 'MEMBER_SELF_SERVICE' ? 'Self Check-in' : (row.method || 'System')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredAbsent.length === 0 ? (
            <div className="empty-state-compact">
              <p>🎉 All active members have checked in for {formatDateDisplayLong(selectedDate)}! 100% attendance recorded.</p>
            </div>
          ) : (
            <div className="responsive-table-wrapper">
              <table className="admin-compact-table">
                <thead>
                  <tr>
                    <th className="row-index">#</th>
                    <th>Allotted Cabin</th>
                    <th>Member Name</th>
                    <th>Member ID</th>
                    <th>Mobile</th>
                    <th>Target / Study Prep</th>
                    <th>Membership</th>
                    <th>Today's Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAbsent.map((m, idx) => (
                    <tr key={m.id}>
                      <td className="row-index">{idx + 1}</td>
                      <td>
                        <span className="cabin-tag">Cabin {m.allottedSeatNumber || m.seatNumber || '—'}</span>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--ink)' }}>{m.fullName || m.memberName}</strong>
                      </td>
                      <td>
                        <span className="member-code-badge">{m.memberCode}</span>
                      </td>
                      <td>
                        <span className="font-mono text-muted text-sm">+91 {m.mobileNumber}</span>
                      </td>
                      <td>
                        <span className="text-muted text-sm">{m.studyPurpose || 'Academic Prep'}</span>
                      </td>
                      <td>
                        <span className="status-badge-compact status-present">● Active</span>
                      </td>
                      <td>
                        <span className="status-badge-compact status-absent">⏳ Not Checked In</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
