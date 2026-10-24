import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function MemberAttendancePage() {
  const { member } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('ALL');

  const todayIso = useMemo(() => {
    try {
      const now = new Date();
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
      return parts; // YYYY-MM-DD
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.getMemberHistory()
      .then(res => {
        if (!isMounted) return;
        const recs = res.records || [];
        setRecords(recs);
        setTotalRecords(res.totalRecords ?? res.count ?? recs.length);
      })
      .catch(err => console.error('Fetch attendance history error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Today record
  const todayRecord = useMemo(() => {
    return records.find(r => (r.attendanceDate || r.date) === todayIso);
  }, [records, todayIso]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const d = r.attendanceDate || r.date;
      if (selectedDate) {
        return d === selectedDate;
      }
      if (filterMonth !== 'ALL') {
        return d && d.startsWith(filterMonth);
      }
      return true;
    });
  }, [records, selectedDate, filterMonth]);

  // Date query match (when a specific date is selected)
  const dateQueryResult = useMemo(() => {
    if (!selectedDate) return null;
    const match = records.find(r => (r.attendanceDate || r.date) === selectedDate);
    return {
      searchedDate: selectedDate,
      found: Boolean(match),
      record: match
    };
  }, [records, selectedDate]);

  if (loading) {
    return <LoadingSpinner text="Loading your attendance history..." />;
  }

  const handleQuickToday = () => {
    setSelectedDate(todayIso);
    setFilterMonth('ALL');
  };

  const handleClearFilters = () => {
    setSelectedDate('');
    setFilterMonth('ALL');
  };

  return (
    <div className="member-page-container">
      {/* Page Header */}
      <div className="member-attendance-header">
        <div>
          <span className="datum-tag datum-tag--dark" style={{ color: 'var(--terracotta)' }}>
            CABIN {member?.allottedSeatNumber || 'C'} · ATTENDANCE LOGS
          </span>
          <h1 className="page-title" style={{ fontFamily: 'var(--font-sans)', fontWeight: 800 }}>
            My Attendance Records
          </h1>
          <p className="page-subtitle">
            Verified check-in history and date-based attendance verification for Synapz Study Zone.
          </p>
        </div>

        {/* Top Summary KPI Cards */}
        <div className="member-kpi-strip">
          <div className="member-kpi-card">
            <span className="member-kpi-val">{totalRecords || records.length}</span>
            <span className="member-kpi-label">TOTAL DAYS PRESENT</span>
          </div>

          <div className="member-kpi-card">
            <span className="member-kpi-val" style={{ color: todayRecord ? '#2E7D32' : 'var(--terracotta)' }}>
              {todayRecord ? '✓ PRESENT' : 'PENDING'}
            </span>
            <span className="member-kpi-label">TODAY'S STATUS</span>
          </div>

          <div className="member-kpi-card">
            <span className="member-kpi-val">Cabin {member?.allottedSeatNumber || 'C'}</span>
            <span className="member-kpi-label">ASSIGNED CABIN</span>
          </div>
        </div>
      </div>

      {/* Date-Based Attendance Checker Card */}
      <div className="attendance-date-checker-card">
        <div className="checker-top">
          <div className="checker-title-wrap">
            <span className="checker-icon">📅</span>
            <div>
              <h2 className="checker-title">Check Date-Based Attendance</h2>
              <span className="checker-subtitle">Select a specific date or month to verify your recorded attendance.</span>
            </div>
          </div>

          <div className="checker-quick-buttons">
            <button
              type="button"
              onClick={handleQuickToday}
              className={`pill-btn ${selectedDate === todayIso ? 'active' : ''}`}
            >
              Today ({todayIso})
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className={`pill-btn ${!selectedDate && filterMonth === 'ALL' ? 'active' : ''}`}
            >
              All Time ({records.length})
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="checker-controls-row">
          <div className="checker-control-group">
            <label htmlFor="specific-date-picker" className="checker-label">
              Select Specific Date:
            </label>
            <input
              id="specific-date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                if (e.target.value) setFilterMonth('ALL');
              }}
              className="checker-date-input"
            />
          </div>

          <div className="checker-control-group">
            <label htmlFor="month-select-filter" className="checker-label">
              Or Filter by Month:
            </label>
            <select
              id="month-select-filter"
              value={filterMonth}
              disabled={Boolean(selectedDate)}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="checker-select-input"
            >
              <option value="ALL">All Recorded Months</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          </div>

          {(selectedDate || filterMonth !== 'ALL') && (
            <div className="checker-control-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-clear-date-filter"
              >
                ✕ Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Date Result Banner */}
        {dateQueryResult && (
          <div className={`date-audit-banner ${dateQueryResult.found ? 'is-present' : 'is-absent'}`}>
            <span className="audit-icon">{dateQueryResult.found ? '✓' : '⚠️'}</span>
            <div className="audit-details">
              <strong>
                {dateQueryResult.found 
                  ? `Attendance Verified for ${dateQueryResult.searchedDate}` 
                  : `No Attendance Recorded for ${dateQueryResult.searchedDate}`}
              </strong>
              <span>
                {dateQueryResult.found 
                  ? `Recorded at ${dateQueryResult.record.checkInTime || dateQueryResult.record.formattedTime} IST for Cabin ${dateQueryResult.record.seatNumber || member?.allottedSeatNumber} (Self Check-in).` 
                  : `You did not check in on this date. In-cabin attendance is recorded daily between 06:00 am and 10:00 pm IST.`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance History Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="table-count" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
              {filteredRecords.length} {filteredRecords.length === 1 ? 'RECORD' : 'RECORDS'} DISPLAYED
            </span>
            {selectedDate && (
              <span className="filter-active-tag">Date: {selectedDate}</span>
            )}
            {!selectedDate && filterMonth !== 'ALL' && (
              <span className="filter-active-tag">Month: {filterMonth}</span>
            )}
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="empty-state-simple" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', marginBottom: '0.5rem' }}>📭</span>
            <p style={{ fontWeight: 600, color: 'var(--ink)' }}>No attendance records found for this selection.</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
              Try selecting another date or click "All Time" to view your entire check-in history.
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn btn-terracotta btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Reset to All Records
            </button>
          </div>
        ) : (
          <div className="responsive-table-wrapper">
            <table className="synapz-table admin-compact-table">
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>CHECK-IN TIME</th>
                  <th>CABIN SNAPSHOT</th>
                  <th>STATUS</th>
                  <th>VERIFICATION METHOD</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => (
                  <tr key={rec.id}>
                    <td>
                      <span className="font-mono font-medium" style={{ fontWeight: 700 }}>
                        {rec.attendanceDate || rec.date}
                      </span>
                    </td>
                    <td>
                      <span className="badge-time">
                        {rec.checkInTime || rec.formattedTime || rec.time} IST
                      </span>
                    </td>
                    <td>
                      <span className="seat-cell-pill">
                        Cabin {rec.seatNumber || rec.seatNumberSnapshot || member?.allottedSeatNumber}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge status-present">
                        ✓ PRESENT
                      </span>
                    </td>
                    <td>
                      <span className="method-tag">
                        {rec.method === 'MEMBER_SELF_SERVICE' ? 'Self Check-in' : (rec.method || 'Self Check-in')}
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
  );
}
