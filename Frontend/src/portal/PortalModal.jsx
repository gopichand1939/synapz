import React, { useState, useEffect } from 'react';
import MemberPortal from './MemberPortal';
import AdminPortal from './AdminPortal';
import { api } from './api';

export default function PortalModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [portalType, setPortalType] = useState('member'); // 'member' | 'admin'
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check initial auth session
    api.getSession()
      .then(res => {
        if (res.authenticated) {
          setSession(res);
        }
      })
      .catch(() => {});

    // Listen for custom trigger events from the vanilla public site
    const handleOpenMember = () => {
      setPortalType('member');
      setIsOpen(true);
      window.location.hash = 'portal';
      document.body.style.overflow = 'hidden';
    };

    const handleOpenAdmin = () => {
      setPortalType('admin');
      setIsOpen(true);
      window.location.hash = 'admin';
      document.body.style.overflow = 'hidden';
    };

    const handleClose = () => {
      setIsOpen(false);
      if (window.location.hash === '#portal' || window.location.hash === '#admin') {
        history.replaceState(null, null, ' ');
      }
      document.body.style.overflow = '';
    };

    window.addEventListener('openMemberPortal', handleOpenMember);
    window.addEventListener('openAdminPortal', handleOpenAdmin);
    window.addEventListener('closePortal', handleClose);

    // Check hash on load
    if (window.location.hash === '#portal' || window.location.pathname === '/portal') {
      handleOpenMember();
    } else if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
      handleOpenAdmin();
    }

    // Hashchange listener
    const onHashChange = () => {
      if (window.location.hash === '#portal') handleOpenMember();
      else if (window.location.hash === '#admin') handleOpenAdmin();
    };
    window.addEventListener('hashchange', onHashChange);

    // Global esc key
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('openMemberPortal', handleOpenMember);
      window.removeEventListener('openAdminPortal', handleOpenAdmin);
      window.removeEventListener('closePortal', handleClose);
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const handleCloseModal = () => {
    setIsOpen(false);
    if (window.location.hash === '#portal' || window.location.hash === '#admin') {
      history.replaceState(null, null, ' ');
    }
    document.body.style.overflow = '';
  };

  if (!isOpen) return null;

  return (
    <div className="portal-overlay" role="dialog" aria-modal="true">
      <div className="portal-modal-window">
        {portalType === 'member' ? (
          <MemberPortal
            initialMember={session?.role === 'MEMBER' ? session.user : null}
            onLogout={() => setSession(null)}
            onClose={handleCloseModal}
          />
        ) : (
          <AdminPortal
            initialAdmin={session?.role === 'ADMIN' || session?.role === 'STAFF' ? session.user : null}
            onLogout={() => setSession(null)}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
}
