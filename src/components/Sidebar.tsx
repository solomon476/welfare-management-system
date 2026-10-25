import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  HeartHandshake,
  DollarSign,
  BarChart3,
  History,
  Settings,
  User,
  FileText,
  ArrowRightLeft,
  ShieldCheck,
  X
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  activePortal: 'admin' | 'member';
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  userRole: UserRole;
  pendingRequestsCount: number;
  pendingContributionsCount: number;
  setActivePortal: (portal: 'admin' | 'member') => void;
  isMobileNavOpen?: boolean;
  onCloseMobileNav?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  currentTab,
  setCurrentTab,
  userRole,
  pendingRequestsCount,
  pendingContributionsCount,
  setActivePortal,
  isMobileNavOpen = false,
  onCloseMobileNav
}) => {
  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    if (onCloseMobileNav) onCloseMobileNav();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div
          onClick={onCloseMobileNav}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 35
          }}
        />
      )}

      <aside className={`app-sidebar ${isMobileNavOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="brand-wrapper">
            <div className="brand-icon">SW</div>
            <div className="brand-text">
              <h1>Solian Wolves</h1>
              <p>Welfare System</p>
            </div>
          </div>

          {onCloseMobileNav && (
            <button
              className="btn btn-ghost btn-sm mobile-close-btn"
              onClick={onCloseMobileNav}
              style={{ display: isMobileNavOpen ? 'flex' : 'none' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {activePortal === 'admin' ? (
            <>
              <div className="nav-section-title">Operations</div>
              
              <button
                className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'members' ? 'active' : ''}`}
                onClick={() => handleNavClick('members')}
              >
                <Users size={18} />
                <span>Members Register</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'contributions' ? 'active' : ''}`}
                onClick={() => handleNavClick('contributions')}
              >
                <CreditCard size={18} />
                <span>Contributions</span>
                {pendingContributionsCount > 0 && (
                  <span className="badge-count" style={{ background: 'var(--warning)', color: '#000' }}>
                    {pendingContributionsCount}
                  </span>
                )}
              </button>

              <button
                className={`nav-item ${currentTab === 'welfare' ? 'active' : ''}`}
                onClick={() => handleNavClick('welfare')}
              >
                <HeartHandshake size={18} />
                <span>Welfare Assistance</span>
                {pendingRequestsCount > 0 && (
                  <span className="badge-count" style={{ background: 'var(--primary)', color: '#fff' }}>
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <div className="nav-section-title">Finance & Controls</div>

              <button
                className={`nav-item ${currentTab === 'finance' ? 'active' : ''}`}
                onClick={() => handleNavClick('finance')}
              >
                <DollarSign size={18} />
                <span>Financial Ledger</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleNavClick('reports')}
              >
                <BarChart3 size={18} />
                <span>Reports & Statements</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'audit' ? 'active' : ''}`}
                onClick={() => handleNavClick('audit')}
              >
                <History size={18} />
                <span>Audit Trail (NFR-05)</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('settings')}
              >
                <Settings size={18} />
                <span>Association Settings</span>
              </button>
            </>
          ) : (
            <>
              <div className="nav-section-title">Member Services</div>

              <button
                className={`nav-item ${currentTab === 'member_dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('member_dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>My Overview</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'my_contributions' ? 'active' : ''}`}
                onClick={() => handleNavClick('my_contributions')}
              >
                <CreditCard size={18} />
                <span>My Contributions</span>
              </button>

              <button
                className={`nav-item ${currentTab === 'my_requests' ? 'active' : ''}`}
                onClick={() => handleNavClick('my_requests')}
              >
                <HeartHandshake size={18} />
                <span>Track Assistance</span>
                {pendingRequestsCount > 0 && (
                  <span className="badge-count" style={{ background: 'var(--primary)', color: '#fff' }}>
                    {pendingRequestsCount}
                  </span>
                )}
              </button>

              <button
                className={`nav-item ${currentTab === 'member_profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('member_profile')}
              >
                <User size={18} />
                <span>Profile & Beneficiary</span>
              </button>

              <div className="nav-section-title">Guidance</div>

              <button
                className={`nav-item ${currentTab === 'welfare_rules' ? 'active' : ''}`}
                onClick={() => handleNavClick('welfare_rules')}
              >
                <FileText size={18} />
                <span>Welfare Constitution</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer Portal Switcher */}
        <div className="sidebar-footer">
          <div className="portal-switch-card">
            <div className="portal-switch-label">Currently in</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              <ShieldCheck size={16} color="var(--primary)" />
              <span>{activePortal === 'admin' ? 'Administrative Portal' : 'Member Portal'}</span>
            </div>
            <button
              onClick={() => {
                setActivePortal(activePortal === 'admin' ? 'member' : 'admin');
                if (onCloseMobileNav) onCloseMobileNav();
              }}
              className="portal-switch-btn"
            >
              <ArrowRightLeft size={14} />
              <span>Switch to {activePortal === 'admin' ? 'Member' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
