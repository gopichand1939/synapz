import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../portal/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const MEMBER_NAV_ITEMS = [
  { path: '/member/dashboard', label: 'Dashboard', icon: '⚡' },
  { path: '/member/attendance', label: 'My Attendance', icon: '📅' },
  { path: '/member/profile', label: 'My Profile', icon: '👤' },
  { path: '/member/change-password', label: 'Change Password', icon: '🔒' }
];

export default function MemberLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // 1. Verify session on mount and ensure Member role
  useEffect(() => {
    let isMounted = true;
    api.getSession()
      .then(res => {
        if (!isMounted) return;
        if (res.authenticated && res.role === 'MEMBER') {
          setMember(res.user);
          setLoading(false);
        } else {
          navigate('/member/login', { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) navigate('/member/login', { replace: true });
      });

    return () => { isMounted = false; };
  }, [navigate]);

  // 2. Live Kolkata time clock
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const formatted = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now);
        setCurrentTime(formatted);
      } catch {
        setCurrentTime('');
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route change & manage body scroll lock
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Logout warning:', e);
    }
    navigate('/member/login', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--parchment)' }}>
        <LoadingSpinner text="Connecting to Synapz Member Portal..." />
      </div>
    );
  }

  // Derive current page title for breadcrumb
  const currentItem = MEMBER_NAV_ITEMS.find(item => location.pathname === item.path || location.pathname.startsWith(item.path));
  const pageTitle = currentItem ? currentItem.label : 'Member Portal';

  const initials = member?.fullName 
    ? member.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'M';

  return (
    <div className={`synapz-admin-shell synapz-member-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="admin-mobile-backdrop" 
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar for Member Portal */}
      <aside className={`admin-sidebar member-sidebar ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="admin-sidebar-header">
          <Link to="/member/dashboard" className="admin-brand">
            <div className="brand-dot" />
            <div className="brand-text">
              <span className="brand-title">SYNAPZ</span>
              <span className="brand-badge member-badge">MEMBER</span>
            </div>
          </Link>
          <button 
            type="button" 
            className="sidebar-collapse-btn desktop-only" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? '→' : '←'}
          </button>
          <button 
            type="button" 
            className="mobile-close-btn mobile-only" 
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close mobile navigation"
          >
            ✕
          </button>
        </div>

        {/* Sidebar Navigation Items */}
        <nav className="admin-nav-list" aria-label="Member Navigation">
          <div className="nav-group-label">{!isCollapsed && 'STUDENT PORTAL'}</div>
          {MEMBER_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Logout */}
        <div className="admin-sidebar-footer">
          <button 
            type="button" 
            onClick={handleLogout} 
            className="admin-logout-btn"
            title="Log out of student session"
          >
            <span className="nav-icon">🚪</span>
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-content-shell">
        {/* Top Header */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button 
              type="button" 
              className="mobile-menu-trigger mobile-only"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <div className="topbar-breadcrumbs">
              <span className="breadcrumb-root">Member</span>
              <span className="breadcrumb-sep">/</span>
              <h1 className="breadcrumb-current">{pageTitle}</h1>
            </div>
          </div>

          <div className="topbar-right">
            {currentTime && (
              <div className="live-clock desktop-only" title="Reading Room Local Clock (Asia/Kolkata)">
                <span className="clock-dot" />
                <span className="clock-time">{currentTime}</span>
                <span className="clock-zone">IST</span>
              </div>
            )}

            <div className="member-seat-badge" title="Your Allotted Cabin">
              <span className="seat-icon">🪑</span>
              <span className="seat-label">Cabin</span>
              <span className="seat-number">{member?.allottedSeatNumber || 'Unassigned'}</span>
            </div>

            <div className="admin-user-pill">
              <div className="admin-avatar" style={{ backgroundColor: 'var(--terracotta)' }}>
                {initials}
              </div>
              <div className="admin-info desktop-only">
                <span className="admin-name">{member?.fullName || 'Member'}</span>
                <span className="admin-role">{member?.memberCode || 'ACTIVE'}</span>
              </div>
            </div>

            <a href="/" className="topbar-site-link" target="_blank" rel="noopener noreferrer" title="View Public Website">
              <span>Website</span>
              <span style={{ fontSize: '0.85em' }}>↗</span>
            </a>

            <button 
              type="button" 
              onClick={handleLogout} 
              className="member-logout-btn" 
              title="Log out of student session"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Body View */}
        <main className="admin-page-body">
          <Outlet context={{ member, setMember }} />
        </main>
      </div>
    </div>
  );
}
