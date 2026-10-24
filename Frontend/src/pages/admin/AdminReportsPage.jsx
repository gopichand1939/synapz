import React, { useState } from 'react';
import { api } from '../../portal/api';

export default function AdminReportsPage() {
  const getTodayKolkata = () => {
    try {
      const now = new Date();
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const today = getTodayKolkata();
  const [rangeStart, setRangeStart] = useState('2026-10-01');
  const [rangeEnd, setRangeEnd] = useState(today);

  const todayExportUrl = api.exportAttendanceUrl({ type: 'daily', date: today });
  const rangeExportUrl = api.exportAttendanceUrl({
    type: 'range',
    startDate: rangeStart,
    endDate: rangeEnd
  });
  const allHistoryExportUrl = api.exportAttendanceUrl({ type: 'range' });

  return (
    <div className="admin-page-wrap">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-heading">Reports & Data Exports</h1>
          <p className="admin-subheading">
            Audit-grade CSV exports for attendance compliance, cabin occupancy, and membership registers.
          </p>
        </div>
      </div>

      <div className="reports-cards-grid">
        {/* Card 1: Today's Daily Register */}
        <div className="report-card">
          <div className="report-icon-box">📅</div>
          <div className="report-content">
            <h3 className="report-title">Today's Attendance Register</h3>
            <p className="report-desc">
              Exports all check-in entries recorded for <strong>{today}</strong>, including exact check-in times in Asia/Kolkata, member IDs, names, and allotted cabin numbers.
            </p>
            <div className="report-action">
              <a
                href={todayExportUrl}
                download={`synapz_attendance_${today}.csv`}
                className="btn btn-terracotta"
              >
                📥 Download Today's CSV
              </a>
            </div>
          </div>
        </div>

        {/* Card 2: Custom Date Range */}
        <div className="report-card">
          <div className="report-icon-box">🗓️</div>
          <div className="report-content">
            <h3 className="report-title">Custom Date Range Attendance</h3>
            <p className="report-desc">
              Generate a multi-day attendance audit spreadsheet for weekly or monthly compliance reviews.
            </p>
            <div className="range-inputs-row" style={{ display: 'flex', gap: '0.8rem', margin: '1rem 0' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
                <input
                  type="date"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(e.target.value)}
                  className="form-input form-input-sm"
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
                <input
                  type="date"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(e.target.value)}
                  className="form-input form-input-sm"
                />
              </div>
            </div>
            <div className="report-action">
              <a
                href={rangeExportUrl}
                download={`synapz_attendance_${rangeStart}_to_${rangeEnd}.csv`}
                className="btn btn-ink"
              >
                📥 Download Range CSV
              </a>
            </div>
          </div>
        </div>

        {/* Card 3: Complete Historical Archive */}
        <div className="report-card">
          <div className="report-icon-box">📚</div>
          <div className="report-content">
            <h3 className="report-title">Full Historical Attendance Archive</h3>
            <p className="report-desc">
              Complete archive of all historical member check-ins since inception, formatted with UTC timestamp and Kolkata local time snapshots.
            </p>
            <div className="report-action">
              <a
                href={allHistoryExportUrl}
                download="synapz_attendance_full_archive.csv"
                className="btn btn-outline-clean"
              >
                📥 Download Complete Archive CSV
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Security Notice */}
      <div className="csv-security-notice" style={{ marginTop: '2rem' }}>
        <span className="notice-icon">🛡️</span>
        <div className="notice-text">
          <strong>Spreadsheet Formula Injection Prevention:</strong> All CSV exports are sanitized against formula injection vulnerabilities (e.g. <code>=</code>, <code>+</code>, <code>-</code>, <code>@</code>) in accordance with OWASP security guidelines.
        </div>
      </div>
    </div>
  );
}
