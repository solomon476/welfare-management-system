import React from 'react';
import {
  Bell,
  Shield,
  UserCheck,
  RefreshCw,
  Sun,
  Moon,
  ExternalLink,
  ChevronDown
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
  onResetData
}) => {
  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-title-badge">
          <Shield size={14} />
          <span>{settings.orgName}</span>
        </div>

        {/* Portal Switcher Tabs */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActivePortal('admin')}
            style={{
              padding: '5px 14px',
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
            Admin Portal
          </button>
          <button
            onClick={() => setActivePortal('member')}
            style={{
              padding: '5px 14px',
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
            Member Portal
          </button>
        </div>
      </div>

      <div className="header-right">
        {/* Reset Demo Data Button */}
        <button
          onClick={onResetData}
          title="Reset to default demonstration records"
          className="btn btn-ghost btn-sm"
          style={{ gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}
        >
          <RefreshCw size={13} />
          <span>Reset Demo</span>
        </button>

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
          <div className="user-details">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role-tag">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '2px' }} />
        </div>
      </div>
    </header>
  );
};
