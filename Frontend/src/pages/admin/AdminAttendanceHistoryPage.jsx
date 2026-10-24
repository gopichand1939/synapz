import React, { useState, useEffect } from 'react';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function AdminAttendanceHistoryPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [seatNumber, setSeatNumber] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date formatting helpers
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—';
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

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (seatNumber) params.seatNumber = seatNumber;
      if (search.trim()) params.search = search.trim();

      const res = await api.getAttendanceHistory(params);
      if (res.success) {
        setRecords(res.records || []);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalRecords(res.total || 0);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handleClearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSeatNumber('');
    setSearch('');
    setTimeout(() => {
      api.getAttendanceHistory({ page: 1, limit: 20 }).then(res => {
        if (res.success) {
          setRecords(res.records || []);
          setPage(res.page);
          setTotalPages(res.totalPages);
          setTotalRecords(res.total);
        }
      });
    }, 10);
  };

  const exportUrl = api.exportAttendanceUrl({
    type: 'range',
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    seatNumber: seatNumber || undefined,
    search: search.trim() || undefined
  });

  return (
    <div className="attendance-page-shell">
      {/* Header with Right-Side Actions */}
      <div className="attendance-header-wrap">
        <div className="attendance-title-block">
          <div className="admin-breadcrumb-tag">ADMINISTRATION / ATTENDANCE ARCHIVE</div>
          <h1 className="admin-heading">Attendance History Archive</h1>
          <p className="admin-subheading">
            Audit logs and verified historical sessions across all reading room members ({totalRecords} records).
          </p>
        </div>

        <div className="attendance-header-actions-right">
          <a href={exportUrl} className="btn btn-terracotta btn-sm" download="synapz_attendance_history.csv">
            📥 Export Filtered CSV
          </a>
        </div>
      </div>

      {/* Filter Card */}
      <div className="admin-compact-table-card">
        <form onSubmit={handleFilterSubmit} style={{ padding: '0.85rem 1rem', borderBottom: '1px solid var(--border-light)', backgroundColor: '#FAF8F5' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <label htmlFor="filter-start" style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                From Date
              </label>
              <input
                id="filter-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', borderRadius: '3px' }}
              />
            </div>

            <div>
              <label htmlFor="filter-end" style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                To Date
              </label>
              <input
                id="filter-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', borderRadius: '3px' }}
              />
            </div>

            <div style={{ width: '110px' }}>
              <label htmlFor="filter-seat" style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Cabin
              </label>
              <input
                id="filter-seat"
                type="text"
                placeholder="e.g. 24, C"
                value={seatNumber}
                onChange={(e) => setSeatNumber(e.target.value.toUpperCase())}
                className="form-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', borderRadius: '3px' }}
              />
            </div>

            <div style={{ flex: '1', minWidth: '180px' }}>
              <label htmlFor="filter-query" style={{ display: 'block', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Search Member
              </label>
              <input
                id="filter-query"
                type="text"
                placeholder="Name, mobile, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.82rem', borderRadius: '3px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="btn btn-sm btn-ink" style={{ padding: '0.4rem 0.85rem' }}>
                Apply Filters
              </button>
              {(startDate || endDate || seatNumber || search) && (
                <button type="button" onClick={handleClearFilters} className="btn btn-sm btn-ghost" style={{ padding: '0.4rem 0.85rem' }}>
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Results Table */}
        {loading ? (
          <LoadingSpinner text="Searching attendance history..." />
        ) : records.length === 0 ? (
          <div className="empty-state-compact">
            <p>No historical records found for the selected search parameters.</p>
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
                  <th>Verified Timestamp</th>
                  <th>Status</th>
                  <th>Method</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="row-index">{(page - 1) * 20 + idx + 1}</td>
                    <td>
                      <span className="cabin-tag">Cabin {r.seatNumber || r.seatNumberSnapshot || '—'}</span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--ink)' }}>{r.memberName || r.fullName}</strong>
                    </td>
                    <td>
                      <span className="member-code-badge">{r.memberCode}</span>
                    </td>
                    <td>
                      <span className="font-mono text-muted text-sm">+91 {r.mobileNumber}</span>
                    </td>
                    <td>
                      <span className="time-badge-compact">{r.checkInTime || r.formattedTime || r.time} IST</span>
                    </td>
                    <td>
                      <span className="date-text-compact">{formatDateDisplay(r.attendanceDate || r.date)}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                        {r.formattedDateTime || (r.checkInAt ? new Date(r.checkInAt).toLocaleString('en-IN') : '—')}
                      </span>
                    </td>
                    <td>
                      <span className="status-badge-compact status-present">● Present</span>
                    </td>
                    <td>
                      <span className="method-tag-compact">
                        {r.method === 'MEMBER_SELF_SERVICE' ? 'Self Check-in' : (r.method || 'System')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="table-pagination-bar">
            <span className="pagination-info">
              Page {page} of {totalPages} ({totalRecords} records)
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchHistory(page - 1)}
                className="btn btn-sm btn-outline-clean"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchHistory(page + 1)}
                className="btn btn-sm btn-outline-clean"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
