import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../portal/api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { toast } from '../../components/shared/Toast';

export default function AdminMembersPage() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  // Date formatting helper
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const fetchMembers = async (p = 1, q = search, s = statusFilter) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 15 };
      if (q.trim()) params.search = q.trim();
      if (s) params.status = s;

      const res = await api.listMembers(params);
      if (res.success) {
        setMembers(res.members || []);
        setPage(res.page || 1);
        setTotalPages(res.totalPages || 1);
        setTotalMembers(res.total || 0);
      }
    } catch (err) {
      console.error('Fetch members error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(1, search, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMembers(1, search, statusFilter);
  };

  const handleStatusChange = async (memberId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMsg = `Are you sure you want to change member status to ${nextStatus}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.updateMemberStatus(memberId, nextStatus);
      if (res.success) {
        toast.success('Status Updated', `Member status changed to ${nextStatus}.`);
        fetchMembers(page, search, statusFilter);
      }
    } catch (err) {
      toast.error('Status Update Failed', err.message || 'Failed to update member status.');
    }
  };

  const activeCount = members.filter(m => m.status === 'ACTIVE').length;
  const suspendedCount = members.filter(m => m.status === 'SUSPENDED').length;

  return (
    <div className="attendance-page-shell">
      {/* Top Header with Right-Side Actions */}
      <div className="attendance-header-wrap">
        <div className="attendance-title-block">
          <div className="admin-breadcrumb-tag">ADMINISTRATION / MEMBERS ROSTER</div>
          <h1 className="admin-heading">Registered Members</h1>
          <p className="admin-subheading">
            Overview of all active and enrolled reading room members ({totalMembers} registered).
          </p>
        </div>

        <div className="attendance-header-actions-right">
          <Link to="/admin/members/register" className="btn btn-terracotta btn-sm">
            + Register New Member
          </Link>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="attendance-kpi-bar">
        <div className="kpi-pill">
          <span className="kpi-val">{totalMembers}</span>
          <span className="kpi-label">Total Registered</span>
        </div>
        <div className="kpi-pill kpi-pill-present">
          <span className="kpi-dot dot-present">●</span>
          <span className="kpi-val">{activeCount}</span>
          <span className="kpi-label">Active on Page</span>
        </div>
        {suspendedCount > 0 && (
          <div className="kpi-pill kpi-pill-absent">
            <span className="kpi-dot dot-absent">●</span>
            <span className="kpi-val">{suspendedCount}</span>
            <span className="kpi-label">Suspended</span>
          </div>
        )}
      </div>

      {/* Compact Tabular View Card */}
      <div className="admin-compact-table-card">
        {/* Table Toolbar */}
        <div className="table-toolbar-compact">
          <div className="tab-buttons-cluster">
            <button
              type="button"
              className={`tab-btn-pill ${statusFilter === '' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('')}
            >
              <span>All Members</span>
            </button>
            <button
              type="button"
              className={`tab-btn-pill ${statusFilter === 'ACTIVE' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('ACTIVE')}
            >
              <span>✓ Active</span>
            </button>
            <button
              type="button"
              className={`tab-btn-pill ${statusFilter === 'SUSPENDED' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('SUSPENDED')}
            >
              <span>⏳ Suspended</span>
            </button>
            <button
              type="button"
              className={`tab-btn-pill ${statusFilter === 'INACTIVE' ? 'is-active' : ''}`}
              onClick={() => setStatusFilter('INACTIVE')}
            >
              <span>Inactive</span>
            </button>
          </div>

          <form onSubmit={handleSearchSubmit} className="search-box-compact-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search name, mobile, cabin, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </form>
        </div>

        {loading ? (
          <LoadingSpinner text="Retrieving member roster..." />
        ) : members.length === 0 ? (
          <div className="empty-state-compact">
            <p>No members found matching your search or filter parameters.</p>
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
                  <th>Target / Study Prep</th>
                  <th>Status</th>
                  <th>Registered Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, idx) => (
                  <tr key={m.id}>
                    <td className="row-index">{(page - 1) * 15 + idx + 1}</td>
                    <td>
                      <span className="cabin-tag">
                        {m.allottedSeatNumber ? `Cabin ${m.allottedSeatNumber}` : 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <Link to={`/admin/members/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <strong style={{ color: 'var(--ink)' }}>{m.fullName}</strong>
                      </Link>
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
                      <span className={`status-badge-compact ${
                        m.status === 'ACTIVE' 
                          ? 'status-present' 
                          : m.status === 'SUSPENDED' 
                          ? 'status-absent' 
                          : ''
                      }`}>
                        ● {m.status}
                      </span>
                    </td>
                    <td>
                      <span className="date-text-compact">{formatDateDisplay(m.createdAt)}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Link
                          to={`/admin/members/${m.id}`}
                          className="btn btn-sm btn-ghost"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                          title="View Profile"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/members/${m.id}/edit`}
                          className="btn btn-sm btn-outline-clean"
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem' }}
                          title="Edit Member"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(m.id, m.status)}
                          className={`btn btn-sm ${m.status === 'ACTIVE' ? 'btn-ghost' : 'btn-terracotta'}`}
                          style={{ padding: '0.2rem 0.45rem', fontSize: '0.72rem' }}
                          title={m.status === 'ACTIVE' ? 'Suspend Access' : 'Activate Access'}
                        >
                          {m.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </div>
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
              Page {page} of {totalPages} ({totalMembers} total members)
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => fetchMembers(page - 1, search, statusFilter)}
                className="btn btn-sm btn-outline-clean"
              >
                ← Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => fetchMembers(page + 1, search, statusFilter)}
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
