import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Phone,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { UserAccount, OrganizationSettings } from '../../types';

interface LoginPageProps {
  settings: OrganizationSettings;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ settings, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState('0799589508');
  const [password, setPassword] = useState('solianalphas');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<UserAccount | null>(null);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Please enter your Phone Number or Member Number.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await StorageService.loginWithCredentials(identifier.trim(), password);
    setIsLoading(false);

    if (result.success && result.user) {
      setIdentifiedUser(result.user);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 750);
    } else {
      setErrorMsg(result.message || 'Invalid phone number or password. Please verify your credentials.');
    }
  };

  const handleSelectAccount = (phoneNum: string, pass: string) => {
    setIdentifier(phoneNum);
    setPassword(pass);
    setErrorMsg(null);
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
      }, 2500);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryId.trim()) {
      setErrorMsg('Please enter your Phone Number or Email.');
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
      setRecoverySuccess(data.message || 'If this account exists, recovery instructions have been prepared.');
    } catch {
      setIsLoading(false);
      setRecoverySuccess('Recovery instructions prepared for this account.');
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator (Executive Authority)';
      case 'secretary':
        return 'Executive Secretary (Secretariat & Governance)';
      case 'finance_officer':
        return 'Finance Officer (Treasury & Verification)';
      case 'welfare_officer':
        return 'Welfare Officer (Applications Review)';
      case 'approver':
      case 'welfare_approver':
        return 'Welfare Approver (Trustee Approvals)';
      case 'auditor':
        return 'Auditor (Financial Oversight)';
      case 'member':
      default:
        return 'Welfare Member (Member Portal)';
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
        background: 'radial-gradient(ellipse at 50% 25%, rgba(37, 99, 235, 0.15) 0%, rgba(9, 13, 22, 0.98) 75%)',
        position: 'relative'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
          borderRadius: '16px',
          position: 'relative'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
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
              marginBottom: '12px'
            }}
          >
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {settings.orgName}
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            Sign in with Phone Number & Password
          </p>
        </div>

        {/* 1-Click Quick Select for Client Testing */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Fill Authorized Accounts:
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to test</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleSelectAccount('0799589508', 'solianalphas')}
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: identifier === '0799589508' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: identifier === '0799589508' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--text-main)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>🛡️ Solomon</div>
              <div style={{ fontSize: '0.64rem', color: 'var(--primary)' }}>Admin</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectAccount('0714729996', 'solianalphas')}
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: identifier === '0714729996' ? '1px solid #10b981' : '1px solid var(--border-subtle)',
                background: identifier === '0714729996' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--text-main)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>📋 Ian</div>
              <div style={{ fontSize: '0.64rem', color: '#10b981' }}>Secretary</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectAccount('0758018973', 'solianalphas')}
              style={{
                padding: '8px 6px',
                borderRadius: '8px',
                border: identifier === '0758018973' ? '1px solid #f59e0b' : '1px solid var(--border-subtle)',
                background: identifier === '0758018973' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-elevated)',
                cursor: 'pointer',
                textAlign: 'center',
                color: 'var(--text-main)',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>💰 Noella</div>
              <div style={{ fontSize: '0.64rem', color: '#f59e0b' }}>Finance</div>
            </button>
          </div>
        </div>

        {/* Live Role Identification Alert */}
        {identifiedUser && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              marginBottom: '18px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <CheckCircle2 size={18} />
              <span>Identity Verified: {identifiedUser.name}</span>
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
              Identified Role: <strong>{getRoleDisplayName(identifiedUser.role)}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Launching authorized portal...
            </div>
          </div>
        )}

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
              marginBottom: '18px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VIEW 1: SIGN IN */}
        {activeView === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px'
                }}
              >
                Phone Number (or Member Number)
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
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
                  placeholder="e.g. 0799589508"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.02em'
                  }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setActiveView('forgot')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password (e.g. solianalphas)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 38px 12px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || identifiedUser !== null}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '13px',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '8px'
              }}
            >
              {isLoading ? (
                'Identifying Account...'
              ) : identifiedUser ? (
                'Role Verified! Accessing...'
              ) : (
                <>
                  <span>Sign In & Identify Role</span>
                  <ArrowRight size={16} />
                </>
              )}
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
                Your Full Name (Optional)
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
                Set Password (min 8 characters)
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

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: FORGOT PASSWORD */}
        {activeView === 'forgot' && (
          <form onSubmit={handleRecovery}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              Enter your registered Phone Number or Email address to recover your password.
            </p>
            <div style={{ marginBottom: '22px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Phone Number or Email
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. 0799589508"
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
              {isLoading ? 'Processing...' : 'Send Recovery Instructions'}
              <HelpCircle size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer' }}
              >
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Bottom Helper Link for Invitations */}
        {activeView === 'login' && (
          <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => { setActiveView('activate'); setErrorMsg(null); }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              Received an invitation token? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Activate Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
