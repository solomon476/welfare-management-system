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
    if (!joinName.trim()) { setErrorMsg('Please enter your full official name.'); return; }
    if (!joinPhone.trim()) { setErrorMsg('Please enter your valid phone number.'); return; }
    if (joinPassword.length < 6) { setErrorMsg('Password must be at least 6 characters long.'); return; }
    if (joinPassword !== joinConfirmPassword) { setErrorMsg('Passwords do not match.'); return; }

    setIsLoading(true);
    setErrorMsg(null);

    const result = await StorageService.registerNewMember(
      joinName.trim(), joinPhone.trim(), joinPassword, joinNationalId.trim()
    );
    setIsLoading(false);

    if (result.success && result.user) {
      setJoinSuccess(result.message || 'Registered successfully! You are now a member.');
      setIdentifier(joinPhone.trim());
      setPassword(joinPassword);
      setTimeout(() => { setJoinSuccess(null); setActiveView('login'); }, 2000);
    } else {
      setErrorMsg(result.message || 'Registration failed. Please try again.');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationToken.trim()) { setErrorMsg('Please enter your invitation activation token.'); return; }
    if (newPassword.length < 8) { setErrorMsg('Password must be at least 8 characters long.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }

    setIsLoading(true);
    setErrorMsg(null);
    const result = await StorageService.activateAccount(activationToken.trim(), newPassword, activationName);
    setIsLoading(false);

    if (result.success) {
      setActivationSuccess(result.message);
      setTimeout(() => { setActiveView('login'); setActivationSuccess(null); }, 2000);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryId.trim()) { setErrorMsg('Please enter your phone number or email.'); return; }
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
      case 'admin': return 'Administrator';
      case 'secretary': return 'Executive Secretary';
      case 'finance_officer': return 'Finance Officer';
      case 'welfare_officer': return 'Welfare Officer';
      case 'approver': case 'welfare_approver': return 'Welfare Approver';
      case 'auditor': return 'Auditor';
      case 'member': default: return 'Welfare Member';
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 14px 14px 42px',
    borderRadius: '10px',
    border: '1.5px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  };

  const inputNoIconStyle: React.CSSProperties = {
    ...inputStyle,
    padding: '14px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const fieldStyle: React.CSSProperties = { marginBottom: '14px' };

  const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'rgba(255,255,255,0.35)',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #0d1b2a 0%, #07121c 40%, #001a0e 100%)',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }}>
      {/* Top Decorative Band */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '220px',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(0,122,61,0.45) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 24px 32px',
        maxWidth: '480px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}>

        {/* ── Brand Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #007a3d 0%, #005c2e 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 12px 36px rgba(0,122,61,0.45)',
            marginBottom: '16px',
          }}>
            <Shield size={30} />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 800,
            margin: '0 0 6px 0',
            color: '#fff',
            letterSpacing: '-0.02em',
          }}>
            {settings.orgName}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', margin: 0 }}>
            {activeView === 'join'
              ? 'Create your member account'
              : activeView === 'activate'
              ? 'Activate your invited account'
              : activeView === 'forgot'
              ? 'Recover account access'
              : 'Sign in to your welfare portal'}
          </p>
        </div>

        {/* ── Identity Verified Banner ── */}
        {identifiedUser && (
          <div style={{
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.35)',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <CheckCircle2 size={18} />
              <span>Welcome, {identifiedUser.name}</span>
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.85, marginTop: '3px' }}>
              Role: {getRoleDisplayName(identifiedUser.role)} — Redirecting...
            </div>
          </div>
        )}

        {/* ── Success Alerts ── */}
        {(joinSuccess || activationSuccess || recoverySuccess) && (
          <div style={{
            padding: '13px 16px',
            borderRadius: '12px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            color: '#34d399',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{joinSuccess || activationSuccess || recoverySuccess}</span>
          </div>
        )}

        {/* ── Error Alert ── */}
        {errorMsg && (
          <div style={{
            padding: '13px 16px',
            borderRadius: '12px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ══════════════════════════════════
            VIEW 1: SIGN IN
        ══════════════════════════════════ */}
        {activeView === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={iconStyle} />
                <input
                  type="tel"
                  placeholder="e.g. 0799589508"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={inputStyle}
                  required
                  autoComplete="tel"
                  inputMode="tel"
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={labelStyle}>Password</label>
                <button
                  type="button"
                  onClick={() => { setActiveView('forgot'); setErrorMsg(null); }}
                  style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={iconStyle} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || identifiedUser !== null}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '12px',
                border: 'none',
                background: isLoading || identifiedUser ? 'rgba(0,122,61,0.5)' : 'linear-gradient(135deg, #007a3d 0%, #005c2e 100%)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: isLoading || identifiedUser ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(0,122,61,0.4)',
                transition: 'all 0.2s',
              }}
            >
              {isLoading ? 'Signing In...' : identifiedUser ? '✓ Verified!' : (
                <><span>Sign In</span><ArrowRight size={18} /></>
              )}
            </button>

            {/* Bottom links */}
            <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '22px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                onClick={() => { setActiveView('join'); setErrorMsg(null); }}
                style={{ background: 'none', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#fff', fontSize: '0.88rem', cursor: 'pointer', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <UserPlus size={16} />
                New member? <strong>Join Solian Welfare</strong>
              </button>
              <button
                type="button"
                onClick={() => { setActiveView('activate'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Have an invitation token? <span style={{ color: '#4ade80' }}>Activate Account</span>
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════
            VIEW 2: JOIN (SELF-REGISTRATION)
        ══════════════════════════════════ */}
        {activeView === 'join' && (
          <form onSubmit={handleJoin}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={iconStyle} />
                <input type="text" placeholder="e.g. Samuel Kipchumba" value={joinName}
                  onChange={(e) => setJoinName(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Phone Number</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={iconStyle} />
                <input type="tel" placeholder="e.g. 0712345678" value={joinPhone}
                  onChange={(e) => setJoinPhone(e.target.value)} style={inputStyle} required inputMode="tel" />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>National ID <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
              <input type="text" placeholder="e.g. 32456789" value={joinNationalId}
                onChange={(e) => setJoinNationalId(e.target.value)} style={inputNoIconStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Create Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={iconStyle} />
                <input type="password" placeholder="At least 6 characters" value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={17} style={iconStyle} />
                <input type="password" placeholder="Re-type password" value={joinConfirmPassword}
                  onChange={(e) => setJoinConfirmPassword(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #007a3d 0%, #005c2e 100%)',
              color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 8px 24px rgba(0,122,61,0.4)',
            }}>
              {isLoading ? 'Registering...' : <><UserPlus size={18} /><span>Join Solian Welfare</span></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button type="button" onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════
            VIEW 3: ACTIVATE WITH TOKEN
        ══════════════════════════════════ */}
        {activeView === 'activate' && (
          <form onSubmit={handleActivate}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Invitation Token</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={17} style={iconStyle} />
                <input type="text" placeholder="Enter single-use invite token" value={activationToken}
                  onChange={(e) => setActivationToken(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
              <input type="text" placeholder="Confirm your full name" value={activationName}
                onChange={(e) => setActivationName(e.target.value)} style={inputNoIconStyle} />
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Set Password <span style={{ opacity: 0.5, fontWeight: 400 }}>(min 8 chars)</span></label>
              <input type="password" placeholder="Choose personal password" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)} style={inputNoIconStyle} required />
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input type="password" placeholder="Re-type password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} style={inputNoIconStyle} required />
            </div>

            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #007a3d 0%, #005c2e 100%)',
              color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 8px 24px rgba(0,122,61,0.4)',
            }}>
              {isLoading ? 'Activating...' : <><CheckCircle2 size={18} /><span>Activate &amp; Set Password</span></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button type="button" onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════
            VIEW 4: FORGOT PASSWORD
        ══════════════════════════════════ */}
        {activeView === 'forgot' && (
          <form onSubmit={handleRecovery}>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: '20px' }}>
              Enter your registered phone number or email to receive recovery instructions.
            </p>
            <div style={{ marginBottom: '22px' }}>
              <label style={labelStyle}>Phone Number or Email</label>
              <div style={{ position: 'relative' }}>
                <Phone size={17} style={iconStyle} />
                <input type="text" placeholder="e.g. 0799589508" value={recoveryId}
                  onChange={(e) => setRecoveryId(e.target.value)} style={inputStyle} required />
              </div>
            </div>

            <button type="submit" disabled={isLoading} style={{
              width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #007a3d 0%, #005c2e 100%)',
              color: '#fff', fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 8px 24px rgba(0,122,61,0.4)',
            }}>
              {isLoading ? 'Processing...' : <><HelpCircle size={18} /><span>Send Recovery Instructions</span></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button type="button" onClick={() => { setActiveView('login'); setErrorMsg(null); }}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', cursor: 'pointer' }}>
                ← Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '16px 24px', color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem' }}>
        Solian Wolves Welfare Management System © 2024
      </div>
    </div>
  );
};
