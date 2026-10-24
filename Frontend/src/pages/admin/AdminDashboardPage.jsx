import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function fetchDashboard() {
      try {
        const [metricRes, attendanceRes] = await Promise.all([
          api.getAdminMetrics(),
          api.getDailyAttendance()
        ]);
        if (!isMounted) return;
        setMetrics(metricRes.metrics);
        const records = attendanceRes.presentRecords || attendanceRes.attendance || [];
        setTodayAttendance(records);
      } catch (err) {
        console.error('Fetch admin dashboard error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDashboard();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return <LoadingSpinner text="Computing reading room metrics..." />;
  }

  return (
    <div className="admin-page-wrap">
      {/* Page Title & Quick Actions */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">Executive Overview</h1>
          <p className="admin-subheading">
            Live attendance audit and 32-cabin utilization for Synapz Study Zone.
          </p>
        </div>
        <div className="header-action-group">
          <Link to="/admin/members/register" className="btn btn-terracotta">
            + Register New Member
          </Link>
          <Link to="/admin/attendance" className="btn btn-ink">
            📅 View Daily Register
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap bg-parchment">👥</div>
          <div className="kpi-data">
            <span className="kpi-label">Active Members</span>
            <span className="kpi-value">{metrics?.activeMembers ?? 0}</span>
            <span className="kpi-meta">out of {metrics?.totalMembers ?? 0} registered</span>
          </div>
        </div>

        <div className="kpi-card kpi-highlight">
          <div className="kpi-icon-wrap bg-olive-light">⚡</div>
          <div className="kpi-data">
            <span className="kpi-label">Today's Check-Ins</span>
            <span className="kpi-value">{metrics?.todayAttendance ?? 0}</span>
            <span className="kpi-meta">Recorded in Asia/Kolkata</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap bg-terracotta-light">⏳</div>
          <div className="kpi-data">
            <span className="kpi-label">Not Checked In Today</span>
            <span className="kpi-value">{metrics?.notCheckedInToday ?? 0}</span>
            <span className="kpi-meta">Active members absent today</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap bg-parchment">🪑</div>
          <div className="kpi-data">
            <span className="kpi-label">Cabin Occupancy</span>
            <span className="kpi-value">
              {metrics?.allottedSeats ?? 0} <span className="kpi-sub">/ {metrics?.totalSeats ?? 32}</span>
            </span>
            <span className="kpi-meta">{metrics?.availableSeats ?? 0} cabins available</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="admin-shortcuts-grid">
        <Link to="/admin/members" className="shortcut-card">
          <span className="shortcut-icon">👥</span>
          <div className="shortcut-text">
            <span className="shortcut-title">Manage Members</span>
            <span className="shortcut-desc">View, edit, search, and toggle member active status.</span>
          </div>
          <span className="shortcut-arrow">→</span>
        </Link>

        <Link to="/admin/attendance" className="shortcut-card">
          <span className="shortcut-icon">📅</span>
          <div className="shortcut-text">
            <span className="shortcut-title">Daily Attendance</span>
            <span className="shortcut-desc">Review today's and past dates check-in registers.</span>
          </div>
          <span className="shortcut-arrow">→</span>
        </Link>

        <Link to="/admin/seats" className="shortcut-card">
          <span className="shortcut-icon">🪑</span>
          <div className="shortcut-text">
            <span className="shortcut-title">32-Seat Floor Plan</span>
            <span className="shortcut-desc">Real-time cabin layout, allotments, and assignments.</span>
          </div>
          <span className="shortcut-arrow">→</span>
        </Link>

        <Link to="/admin/reports" className="shortcut-card">
          <span className="shortcut-icon">📑</span>
          <div className="shortcut-text">
            <span className="shortcut-title">CSV Reports Center</span>
            <span className="shortcut-desc">Export daily records and roster spreadsheets.</span>
          </div>
          <span className="shortcut-arrow">→</span>
        </Link>
      </div>

      {/* Today's Recent Check-ins List */}
      <div className="admin-compact-table-card" style={{ marginTop: '1.5rem' }}>
        <div className="table-toolbar-compact">
          <div>
            <strong style={{ fontSize: '0.92rem', color: 'var(--ink)' }}>Today's Check-In Activity</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginLeft: '0.75rem' }}>
              Real-time attendance stream for today ({todayAttendance.length} present)
            </span>
          </div>
          <Link to="/admin/attendance" className="btn btn-sm btn-outline-clean">
            Full Daily Register →
          </Link>
        </div>

        {todayAttendance.length === 0 ? (
          <div className="empty-state-compact">
            <p>No members have checked in yet for today.</p>
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
                  <th>Verified Timestamp</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.slice(0, 15).map((row, idx) => (
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
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                        {row.formattedDateTime || (row.checkInAt ? new Date(row.checkInAt).toLocaleString('en-IN') : '—')}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge-compact status-present">● Checked In</span>
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
        )}
      </div>
    </div>
  );
}
