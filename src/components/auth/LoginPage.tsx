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
  UserPlus,
  User,
  Sparkles
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
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [identifiedUser, setIdentifiedUser] = useState<UserAccount | null>(null);
  const [activeView, setActiveView] = useState<'login' | 'join' | 'activate' | 'forgot'>('login');

  // Member Self-Registration ("Join Normally")
  const [joinName, setJoinName] = useState('');
  const [joinPhone, setJoinPhone] = useState('');
  const [joinNationalId, setJoinNationalId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinConfirmPassword, setJoinConfirmPassword] = useState('');
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

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
      setErrorMsg('Please enter your phone number or member number.');
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
      }, 700);
    } else {
      setErrorMsg(result.message || 'Invalid phone number or password. Please verify your credentials.');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinName.trim()) {
      setErrorMsg('Please enter your full official name.');
      return;
    }
    if (!joinPhone.trim()) {
      setErrorMsg('Please enter your valid phone number.');
      return;
    }
    if (joinPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (joinPassword !== joinConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await StorageService.registerNewMember(
      joinName.trim(),
      joinPhone.trim(),
      joinPassword,
      joinNationalId.trim()
    );
    setIsLoading(false);

    if (result.success && result.user) {
      setJoinSuccess(result.message || 'Registered successfully! You are now a member.');
      setIdentifier(joinPhone.trim());
      setPassword(joinPassword);
      setTimeout(() => {
        setJoinSuccess(null);
        setActiveView('login');
      }, 2000);
    } else {
      setErrorMsg(result.message || 'Registration failed. Please try again.');
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
      }, 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryId.trim()) {
      setErrorMsg('Please enter your phone number or email.');
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
        padding: '16px',
        background: 'radial-gradient(ellipse at 50% 25%, rgba(37, 99, 235, 0.15) 0%, rgba(9, 13, 22, 0.98) 75%)',
        position: 'relative'
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '32px clamp(18px, 5vw, 30px)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--border-subtle)',
          borderRadius: '16px',
          position: 'relative'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
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
            {activeView === 'join'
              ? 'Join as a Member of Solian Welfare'
              : activeView === 'activate'
              ? 'Activate Your Invited Account'
              : activeView === 'forgot'
              ? 'Recover Account Access'
              : 'Sign in with your phone number and password'}
          </p>
        </div>

        {/* Live Role Identification Notification */}
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
              Assigned Role: <strong>{getRoleDisplayName(identifiedUser.role)}</strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Accessing your authorized portal...
            </div>
          </div>
        )}

        {/* Success Alerts */}
        {joinSuccess && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{joinSuccess}</span>
          </div>
        )}

        {activationSuccess && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
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
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px'
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{recoverySuccess}</span>
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

        {/* VIEW 1: SIGN IN (CLEAN & SIMPLE) */}
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
                  placeholder="Enter phone number (e.g. 0799589508)"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 38px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-main)',
                    fontSize: '0.9rem'
                  }}
                  required
                  autoFocus
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
                  onClick={() => { setActiveView('forgot'); setErrorMsg(null); }}
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
                  placeholder="Enter password"
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
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {/* Navigation to Join / Activate */}
            <div style={{ marginTop: '22px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setActiveView('join'); setErrorMsg(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                New member? <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Join Solian Welfare</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveView('activate'); setErrorMsg(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                Have an invitation token? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Activate Account</span>
              </button>
            </div>
          </form>
        )}

        {/* VIEW 2: JOIN NORMALLY (MEMBER SELF-REGISTRATION) */}
        {activeView === 'join' && (
          <form onSubmit={handleJoin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. Samuel Kipchumba"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="e.g. 0712345678"
                  value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                National ID Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 32456789"
                value={joinNationalId}
                onChange={(e) => setJoinNationalId(e.target.value)}
                style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Create Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="Re-type password"
                  value={joinConfirmPassword}
                  onChange={(e) => setJoinConfirmPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 12px 11px 38px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-elevated)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '8px' }}
            >
              {isLoading ? 'Registering...' : 'Join Solian Welfare'}
              <UserPlus size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                Already registered? <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* VIEW 3: ACTIVATE ACCOUNT WITH TOKEN */}
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

        {/* VIEW 4: FORGOT PASSWORD */}
        {activeView === 'forgot' && (
          <form onSubmit={handleRecovery}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '18px' }}>
              Enter your registered phone number or email address to recover your password.
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
      </div>
    </div>
  );
};
