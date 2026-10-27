import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { UserAccount, OrganizationSettings } from '../../types';

interface LoginPageProps {
  settings: OrganizationSettings;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'login' | 'activate' | 'forgot'>('login');

  // Account Activation State
  const [activationToken, setActivationToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationName, setActivationName] = useState('');
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Password Recovery State
  const [recoveryId, setRecoveryId] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Membership Number or registered Email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await StorageService.loginWithCredentials(identifier.trim(), password);
    setIsLoading(false);

    if (result.success && result.user) {
      onLoginSuccess(result.user);
    } else {
      setErrorMsg(result.message || 'Invalid credentials. Please verify your details.');
    }
  };

  const handleQuickLogin = async (demoId: string, demoPass: string) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMsg(null);
    const result = await StorageService.loginWithCredentials(demoId, demoPass);
    setIsLoading(false);
    if (result.success && result.user) {
      onLoginSuccess(result.user);
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationToken.trim()) {
      setErrorMsg('Please enter your invitation activation token.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    const result = await StorageService.activateAccount(activationToken.trim(), newPassword, activationName);
    setIsLoading(false);

    if (result.success) {
      setActivationSuccess(result.message);
      setTimeout(() => {
        setActiveView('login');
        setActivationSuccess(null);
      }, 3000);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryId.trim()) {
      setErrorMsg('Please enter your Membership Number or Email.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const resp = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: recoveryId.trim() })
      });
      const data = await resp.json().catch(() => ({}));
      setIsLoading(false);
      setRecoverySuccess(data.message || 'If an account exists, recovery instructions have been dispatched.');
    } catch {
      setIsLoading(false);
      setRecoverySuccess('Recovery instructions have been prepared for this account.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(59, 130, 246, 0.12) 0%, rgba(9, 13, 22, 0.98) 70%)',
        position: 'relative'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--border-subtle)',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)',
              marginBottom: '14px'
            }}
          >
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {settings.orgName}
          </h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '4px 0 10px 0', padding: '3px 10px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.72rem', fontWeight: 600 }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
            Production Access Gateway · SSL Encrypted
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            Role-Based Access Control · Persistent Session Portal
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-elevated)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveView('login'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeView === 'login' ? 'var(--primary)' : 'transparent',
              color: activeView === 'login' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveView('activate'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeView === 'activate' ? 'var(--primary)' : 'transparent',
              color: activeView === 'activate' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Activate Invite
          </button>
          <button
            type="button"
            onClick={() => { setActiveView('forgot'); setErrorMsg(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: '7px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeView === 'forgot' ? 'var(--primary)' : 'transparent',
              color: activeView === 'forgot' ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s ease'
            }}
          >
            Recovery
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Notifications */}
        {activationSuccess && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{activationSuccess}</span>
          </div>
        )}

        {recoverySuccess && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{recoverySuccess}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {activeView === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                Membership Number or Email
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="text"
                  placeholder="e.g. SW-M001 or member@solianwolves.org"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                  autoFocus
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setActiveView('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.74rem',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)'
                  }}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 12px 11px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px'
              }}
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* VIEW 2: ACTIVATE ACCOUNT */}
        {activeView === 'activate' && (
          <form onSubmit={handleActivate}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Invitation Token
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Enter single-use invite token"
                  value={activationToken}
                  onChange={(e) => setActivationToken(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Your Full Name (Optional confirmation)
              </label>
              <input
                type="text"
                placeholder="Confirm your full name"
                value={activationName}
                onChange={(e) => setActivationName(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Create Strong Password (min 8 characters)
              </label>
              <input
                type="password"
                placeholder="Choose personal password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}
            >
              {isLoading ? 'Activating...' : 'Activate & Set Password'}
              <CheckCircle2 size={16} />
            </button>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {activeView === 'forgot' && (
          <form onSubmit={handleRecovery}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              Enter your registered Membership Number or Email address. The system will dispatch secure password recovery instructions.
            </p>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Membership Number or Email
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. SW-M001 or member@solianwolves.org"
                  value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}
            >
              {isLoading ? 'Processing...' : 'Request Recovery Instructions'}
              <HelpCircle size={16} />
            </button>
          </form>
        )}

        {/* PRODUCTION MODE: Log-based & Role-based Access Banner & Directory */}
        {!settings.isDemoMode ? (
          <div
            style={{
              marginTop: '24px',
              paddingTop: '18px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Lock size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Production Mode · Log-Based Access Control
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                Authentication is strictly verified against the database. All login events, failed attempts, and administrative actions are logged in the immutable audit trail.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setShowDirectory(!showDirectory)}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}
              >
                {showDirectory ? 'Hide Registered Directory' : 'View Registered Accounts Reference'}
              </button>
            </div>

            {showDirectory && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.72rem'
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Select an account identifier to pre-fill login:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setIdentifier('SW-M001'); setPassword(''); }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', justifyContent: 'flex-start', padding: '6px 8px', border: '1px solid var(--border-subtle)' }}
                  >
                    👤 Member (SW-M001)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIdentifier('admin@solianwolves.org'); setPassword(''); }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', justifyContent: 'flex-start', padding: '6px 8px', border: '1px solid var(--border-subtle)' }}
                  >
                    🛡️ Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIdentifier('finance@solianwolves.org'); setPassword(''); }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', justifyContent: 'flex-start', padding: '6px 8px', border: '1px solid var(--border-subtle)' }}
                  >
                    💰 Finance Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIdentifier('welfare@solianwolves.org'); setPassword(''); }}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.7rem', justifyContent: 'flex-start', padding: '6px 8px', border: '1px solid var(--border-subtle)' }}
                  >
                    📋 Welfare Officer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DEMO COMMITTEE FAST LOGIN SWITCHER (ONLY IN DEMO MODE) */
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={11} color="#f59e0b" />
                Demo 1-Click Role Testing
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Auto-fill credentials</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleQuickLogin('SW-M001', 'member123')}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.72rem',
                  justifyContent: 'flex-start',
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 600 }}>👤 Member</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto' }}>SW-M001</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@solianwolves.org', 'admin123')}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.72rem',
                  justifyContent: 'flex-start',
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 600 }}>🛡️ Admin</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto' }}>Sarah</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('finance@solianwolves.org', 'finance123')}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.72rem',
                  justifyContent: 'flex-start',
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 600 }}>💰 Finance</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto' }}>Grace</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('welfare@solianwolves.org', 'welfare123')}
                className="btn btn-ghost btn-sm"
                style={{
                  fontSize: '0.72rem',
                  justifyContent: 'flex-start',
                  padding: '6px 10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  textAlign: 'left'
                }}
              >
                <span style={{ fontWeight: 600 }}>📋 Welfare</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', marginLeft: 'auto' }}>David</span>
              </button>
            </div>
          </div>
        )}

        {/* PWA Install Notice */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Smartphone size={13} />
          <span>Installable PWA • Works offline & on mobile home screen</span>
        </div>
      </div>
    </div>
  );
};
