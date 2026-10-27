import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  HeartHandshake,
  Menu,
  FileText,
  User,
  LogOut,
  X
} from 'lucide-react';

interface MobileBottomNavProps {
  activePortal: 'admin' | 'member';
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingRequestsCount: number;
  pendingContributionsCount: number;
  onOpenMobileMenu: () => void;
  onLogout?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePortal,
  currentTab,
  setCurrentTab,
  pendingRequestsCount,
  pendingContributionsCount,
  onOpenMobileMenu,
  onLogout
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutRequest = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* Logout Confirmation Sheet */}
      {showLogoutConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'flex-end',
          background: 'rgba(0,0,0,0.55)',
        }} onClick={() => setShowLogoutConfirm(false)}>
          <div
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 24px 40px',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
              border: '1px solid var(--border-subtle)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border-color)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px',
                background: 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ef4444', flexShrink: 0
              }}>
                <LogOut size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Sign Out</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  You will be returned to the login screen
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '13px', borderRadius: '10px', border: '1.5px solid var(--border-color)',
                  background: 'transparent', color: 'var(--text-main)', fontSize: '0.92rem',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <X size={16} /> Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                style={{
                  flex: 1, padding: '13px', borderRadius: '10px', border: 'none',
                  background: '#ef4444', color: '#fff', fontSize: '0.92rem',
                  fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '6px'
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        {activePortal === 'admin' ? (
          <>
            <button
              className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
              aria-label="Dashboard"
            >
              <div className="bottom-nav-icon-wrapper">
                <LayoutDashboard size={20} />
              </div>
              <span>Dashboard</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'members' ? 'active' : ''}`}
              onClick={() => setCurrentTab('members')}
              aria-label="Members"
            >
              <div className="bottom-nav-icon-wrapper">
                <Users size={20} />
              </div>
              <span>Members</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('contributions')}
              aria-label="Contributions"
            >
              <div className="bottom-nav-icon-wrapper">
                <CreditCard size={20} />
                {pendingContributionsCount > 0 && (
                  <span className="bottom-nav-badge">{pendingContributionsCount}</span>
                )}
              </div>
              <span>Payments</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'welfare' ? 'active' : ''}`}
              onClick={() => setCurrentTab('welfare')}
              aria-label="Welfare"
            >
              <div className="bottom-nav-icon-wrapper">
                <HeartHandshake size={20} />
                {pendingRequestsCount > 0 && (
                  <span className="bottom-nav-badge">{pendingRequestsCount}</span>
                )}
              </div>
              <span>Welfare</span>
            </button>

            <button
              className="bottom-nav-item"
              onClick={onOpenMobileMenu}
              aria-label="More Options"
            >
              <div className="bottom-nav-icon-wrapper">
                <Menu size={20} />
              </div>
              <span>More</span>
            </button>
          </>
        ) : (
          <>
            <button
              className={`bottom-nav-item ${currentTab === 'member_dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('member_dashboard')}
              aria-label="Home"
            >
              <div className="bottom-nav-icon-wrapper">
                <LayoutDashboard size={20} />
              </div>
              <span>Home</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'my_contributions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('my_contributions')}
              aria-label="My Contributions"
            >
              <div className="bottom-nav-icon-wrapper">
                <CreditCard size={20} />
              </div>
              <span>Dues</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'my_requests' ? 'active' : ''}`}
              onClick={() => setCurrentTab('my_requests')}
              aria-label="Assistance"
            >
              <div className="bottom-nav-icon-wrapper">
                <HeartHandshake size={20} />
                {pendingRequestsCount > 0 && (
                  <span className="bottom-nav-badge">{pendingRequestsCount}</span>
                )}
              </div>
              <span>Claims</span>
            </button>

            <button
              className={`bottom-nav-item ${currentTab === 'member_profile' ? 'active' : ''}`}
              onClick={() => setCurrentTab('member_profile')}
              aria-label="My Profile"
            >
              <div className="bottom-nav-icon-wrapper">
                <User size={20} />
              </div>
              <span>Profile</span>
            </button>

            {/* Sign Out — always visible in member portal */}
            <button
              className="bottom-nav-item"
              onClick={handleLogoutRequest}
              aria-label="Sign Out"
              style={{ color: '#ef4444' }}
            >
              <div className="bottom-nav-icon-wrapper" style={{ color: '#ef4444' }}>
                <LogOut size={20} />
              </div>
              <span style={{ color: '#ef4444' }}>Sign Out</span>
            </button>
          </>
        )}
      </nav>
    </>
  );
};
