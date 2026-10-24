import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../portal/api';
import LoadingSpinner from '../components/shared/LoadingSpinner';

const ADMIN_NAV_ITEMS = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/admin/members', label: 'Members', icon: '👥' },
  { path: '/admin/members/register', label: 'Register Member', icon: '➕' },
  { path: '/admin/attendance', label: 'Daily Attendance', icon: '📅' },
  { path: '/admin/attendance/history', label: 'Attendance History', icon: '📜' },
  { path: '/admin/seats', label: 'Seat Management', icon: '🪑' },
  { path: '/admin/reports', label: 'Reports', icon: '📑' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // 1. Verify session on mount and ensure Admin role
  useEffect(() => {
    let isMounted = true;
    api.getSession()
      .then(res => {
        if (!isMounted) return;
        if (res.authenticated && (res.role === 'ADMIN' || res.role === 'STAFF')) {
          setAdminUser(res.user);
          setLoading(false);
        } else {
          navigate('/admin/login', { replace: true });
        }
      })
      .catch(() => {
        if (isMounted) navigate('/admin/login', { replace: true });
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
    navigate('/admin/login', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: 'var(--parchment)' }}>
        <LoadingSpinner text="Authenticating Administrative Workspace..." />
      </div>
    );
  }

  // Derive current page title
  const currentItem = ADMIN_NAV_ITEMS.find(item => location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path)));
  const pageTitle = currentItem ? currentItem.label : 'Admin Portal';

  return (
    <div className={`synapz-admin-shell ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div 
          className="admin-mobile-backdrop" 
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Persistent Desktop Sidebar & Responsive Mobile Drawer */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <div className="admin-brand">
            <div className="brand-dot" />
            <div className="brand-text">
              <span className="brand-title">SYNAPZ</span>
              <span className="brand-badge">ADMIN</span>
            </div>
          </div>
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

        <nav className="admin-nav-list" aria-label="Admin Navigation">
          <div className="nav-group-label">{!isCollapsed && 'MANAGEMENT'}</div>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isCollapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <button 
            type="button" 
            onClick={handleLogout} 
            className="admin-logout-btn"
            title="Log out of admin session"
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
              <span className="breadcrumb-root">Admin</span>
              <span className="breadcrumb-sep">/</span>
              <h1 className="breadcrumb-current">{pageTitle}</h1>
            </div>
          </div>

          <div className="topbar-right">
            {currentTime && (
              <div className="live-clock" title="Reading Room Local Clock (Asia/Kolkata)">
                <span className="clock-dot" />
                <span className="clock-time">{currentTime}</span>
                <span className="clock-zone">IST</span>
              </div>
            )}

            <div className="admin-user-pill">
              <div className="admin-avatar">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-info desktop-only">
                <span className="admin-name">{adminUser?.name || 'Administrator'}</span>
                <span className="admin-role">{adminUser?.role || 'SUPER ADMIN'}</span>
              </div>
            </div>

            <a href="/" className="topbar-site-link" target="_blank" rel="noopener noreferrer" title="View Public Website">
              <span>Website</span>
              <span style={{ fontSize: '0.85em' }}>↗</span>
            </a>
          </div>
        </header>

        {/* Page View Body */}
        <main className="admin-page-body">
          <Outlet context={{ adminUser }} />
        </main>
      </div>
    </div>
  );
}
