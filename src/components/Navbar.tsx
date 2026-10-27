import React from 'react';
import {
  Bell,
  Shield,
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  Menu,
  Database,
  Sparkles,
  Users,
  LogOut
} from 'lucide-react';
import { UserAccount, OrganizationSettings } from '../types';

interface NavbarProps {
  currentUser: UserAccount;
  activePortal: 'admin' | 'member';
  setActivePortal: (portal: 'admin' | 'member') => void;
  onOpenRoleSwitcher: () => void;
  onOpenNotifications: () => void;
  unreadCount: number;
  settings: OrganizationSettings;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onResetData: () => void;
  onInitializeCleanSlate: () => void;
  isMobileNavOpen: boolean;
  setIsMobileNavOpen: (open: boolean) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activePortal,
  setActivePortal,
  onOpenRoleSwitcher,
  onOpenNotifications,
  unreadCount,
  settings,
  theme,
  setTheme,
  onResetData,
  onInitializeCleanSlate,
  isMobileNavOpen,
  setIsMobileNavOpen,
  onLogout
}) => {
  const isOfficer = ['admin', 'finance_officer', 'welfare_officer', 'approver', 'welfare_approver', 'auditor'].some(
    r => currentUser.role === r || (currentUser.roles && currentUser.roles.includes(r as any))
  );

  return (
    <>
      <header className="app-header">
      <div className="header-left">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          className="btn btn-ghost btn-sm mobile-menu-btn"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          title="Toggle Navigation Menu"
          style={{ padding: '6px' }}
        >
          <Menu size={20} />
        </button>

        <div className="header-title-badge">
          <Shield size={14} />
          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {settings.orgName}
          </span>
        </div>

        {/* Desktop Portal Switcher: Only visible to authorized Officers/Admins per PRD 4 */}
        {isOfficer ? (
          <div className="desktop-portal-tabs" style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActivePortal('admin')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activePortal === 'admin' ? 'var(--primary)' : 'transparent',
                color: activePortal === 'admin' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              Admin
            </button>
            <button
              onClick={() => setActivePortal('member')}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: activePortal === 'member' ? 'var(--primary)' : 'transparent',
                color: activePortal === 'member' ? '#ffffff' : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              Member
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--primary)'
            }}
          >
            <Users size={13} />
            <span>Member Portal</span>
          </div>
        )}
      </div>

      <div className="header-right">
        {/* Environment Badge & Mode Selector (Hidden on Mobile topbar, moved to drawer) */}
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {settings.isDemoMode ? (
            <>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Currently viewing demonstration committee data. Can be purged anytime."
              >
                <Sparkles size={11} />
                Demo Data
              </span>
              <button
                onClick={onInitializeCleanSlate}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '3px 7px' }}
                title="Purge all demo records and switch to pristine production database (0 records)"
              >
                <Database size={12} />
                <span>Start Blank Production</span>
              </button>
            </>
          ) : (
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)'
              }}
            >
              ● Production Mode
            </span>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-ghost btn-sm"
          title="Toggle Light / Dark theme"
          style={{ padding: '6px', borderRadius: 'var(--radius-full)' }}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications Button */}
        <button
          onClick={onOpenNotifications}
          className="btn btn-ghost btn-sm"
          title="View in-app notifications"
          style={{ position: 'relative', padding: '6px', borderRadius: 'var(--radius-full)' }}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                width: '16px',
                height: '16px',
                backgroundColor: 'var(--danger)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)'
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Active Role & User Switcher Trigger */}
        <div
          onClick={onOpenRoleSwitcher}
          className="user-profile-badge"
          title="Click to test different roles (Admin, Welfare Officer, Finance, Approver, Member)"
        >
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="user-avatar"
          />
          <div className="user-details hide-on-mobile">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role-tag">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px' }} />
        </div>

        {/* Sign Out Action Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-ghost btn-sm"
            title="Sign out of your session"
            style={{ padding: '6px', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>

    {/* Phone View: Dedicated Segmented Portal Bar (Only visible to authorized Officers per PRD 4) */}
    {isOfficer && (
      <div className="mobile-portal-bar">
        <button
          className={`mobile-portal-btn ${activePortal === 'admin' ? 'active' : ''}`}
          onClick={() => setActivePortal('admin')}
        >
          <Shield size={14} />
          <span>Administrative Portal</span>
        </button>
        <button
          className={`mobile-portal-btn ${activePortal === 'member' ? 'active' : ''}`}
          onClick={() => setActivePortal('member')}
        >
          <Users size={14} />
          <span>Member Portal</span>
        </button>
      </div>
    )}
  </>
);
};
