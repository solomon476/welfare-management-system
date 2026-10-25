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
  PlusCircle,
  HelpCircle,
  ArrowRightLeft,
  ShieldCheck
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  currentTab,
  setCurrentTab,
  userRole,
  pendingRequestsCount,
  pendingContributionsCount,
  setActivePortal
}) => {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-wrapper">
          <div className="brand-icon">SW</div>
          <div className="brand-text">
            <h1>Solian Wolves</h1>
            <p>Welfare System</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {activePortal === 'admin' ? (
          <>
            <div className="nav-section-title">Operations</div>
            
            <button
              className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentTab('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'members' ? 'active' : ''}`}
              onClick={() => setCurrentTab('members')}
            >
              <Users size={18} />
              <span>Members Register</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('contributions')}
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
              onClick={() => setCurrentTab('welfare')}
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
              onClick={() => setCurrentTab('finance')}
            >
              <DollarSign size={18} />
              <span>Financial Ledger</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'reports' ? 'active' : ''}`}
              onClick={() => setCurrentTab('reports')}
            >
              <BarChart3 size={18} />
              <span>Reports & Statements</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'audit' ? 'active' : ''}`}
              onClick={() => setCurrentTab('audit')}
            >
              <History size={18} />
              <span>Audit Trail (NFR-05)</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => setCurrentTab('settings')}
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
              onClick={() => setCurrentTab('member_dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>My Overview</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'my_contributions' ? 'active' : ''}`}
              onClick={() => setCurrentTab('my_contributions')}
            >
              <CreditCard size={18} />
              <span>My Contributions</span>
            </button>

            <button
              className={`nav-item ${currentTab === 'my_requests' ? 'active' : ''}`}
              onClick={() => setCurrentTab('my_requests')}
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
              onClick={() => setCurrentTab('member_profile')}
            >
              <User size={18} />
              <span>Profile & Beneficiary</span>
            </button>

            <div className="nav-section-title">Guidance</div>

            <button
              className={`nav-item ${currentTab === 'welfare_rules' ? 'active' : ''}`}
              onClick={() => setCurrentTab('welfare_rules')}
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
            onClick={() => setActivePortal(activePortal === 'admin' ? 'member' : 'admin')}
            className="portal-switch-btn"
          >
            <ArrowRightLeft size={14} />
            <span>Switch to {activePortal === 'admin' ? 'Member' : 'Admin'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
