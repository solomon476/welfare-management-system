import React from 'react';
import {
  HeartHandshake,
  CreditCard,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileText,
  AlertCircle,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, OrganizationSettings, WelfareRequest } from '../../types';

interface MemberDashboardProps {
  member: Member;
  settings: OrganizationSettings;
  onNavigate: (tab: string) => void;
  onOpenApply: () => void;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  member,
  settings,
  onNavigate,
  onOpenApply
}) => {
  const balance = StorageService.calculateMemberBalance(member.id);
  const myContributions = StorageService.getContributions()
    .filter(c => c.memberId === member.id && c.status !== 'reversed')
    .slice(0, 4);

  const myRequests = StorageService.getWelfareRequests()
    .filter(r => r.memberId === member.id);

  const activeRequest = myRequests.find(r => r.status !== 'disbursed' && r.status !== 'rejected');

  return (
    <div className="page-content">
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 28px',
          marginBottom: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="code-badge" style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.8rem' }}>
              {member.membershipNumber}
            </span>
            <span className={`status-pill pill-${member.status}`}>
              <span className="status-dot" />
              {member.status}
            </span>
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
            Welcome back, {member.fullName}
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {member.category.replace('_', ' ').toUpperCase()} · Member since {member.dateJoined} · {settings.orgName}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => onNavigate('my_contributions')}>
            <FileText size={15} />
            <span>View Statement</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenApply}>
            <PlusCircle size={15} />
            <span>Apply for Assistance</span>
          </button>
        </div>
      </div>

      {/* Member KPIs */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ '--accent-color': '#10b981' } as any}>
          <div className="metric-header">
            <span className="metric-title">Verified In Treasury</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(16, 185, 129, 0.12)', '--metric-color': '#10b981' } as any}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value">
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
              {settings.currency}
            </span>
            {balance.verifiedPaid.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>Reconciled external payment records</span>
          </div>
        </div>

        <div className="metric-card" style={{ '--accent-color': '#f59e0b' } as any}>
          <div className="metric-header">
            <span className="metric-title">Pending Verification</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(245, 158, 11, 0.12)', '--metric-color': '#f59e0b' } as any}>
              <Clock size={18} />
            </div>
          </div>
          <div className="metric-value" style={{ color: '#fbbf24' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
              {settings.currency}
            </span>
            {balance.pendingVerification.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>Awaiting treasurer bank confirmation</span>
          </div>
        </div>

        <div className="metric-card" style={{ '--accent-color': '#3b82f6' } as any}>
          <div className="metric-header">
            <span className="metric-title">Monthly Commitment</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(59, 130, 246, 0.12)', '--metric-color': '#3b82f6' } as any}>
              <CreditCard size={18} />
            </div>
          </div>
          <div className="metric-value">
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
              {settings.currency}
            </span>
            {balance.monthlyDuesRate.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span style={{ color: 'var(--success)' }}>Account in Good Standing</span>
          </div>
        </div>

        <div className="metric-card" style={{ '--accent-color': '#8b5cf6' } as any}>
          <div className="metric-header">
            <span className="metric-title">Welfare Applications</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(139, 92, 246, 0.12)', '--metric-color': '#8b5cf6' } as any}>
              <HeartHandshake size={18} />
            </div>
          </div>
          <div className="metric-value">{myRequests.length}</div>
          <div className="metric-subtext">
            <span>{activeRequest ? '1 currently in review' : 'No active pending claims'}</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Active Welfare Claim Tracker & Recent Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Active Claim Tracker Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Welfare Assistance Status (WEL-05)</h3>
              <p className="card-subtitle">Track committee review and payout status</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('my_requests')}>
              View History →
            </button>
          </div>

          {activeRequest ? (
            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="code-badge">{activeRequest.id}</span>
                <span className={`status-pill pill-${activeRequest.status}`}>
                  <span className="status-dot" />
                  {activeRequest.status.replace('_', ' ')}
                </span>
              </div>
              <h4 style={{ fontSize: '0.94rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {activeRequest.category.replace('_', ' ')} Request
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                {activeRequest.description}
              </p>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                <span>Requested: <strong>{settings.currency} {activeRequest.amountRequested.toLocaleString()}</strong></span>
                {activeRequest.amountApproved && (
                  <span style={{ color: 'var(--success)' }}>
                    Approved: <strong>{settings.currency} {activeRequest.amountApproved.toLocaleString()}</strong>
                  </span>
                )}
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '12px' }}
                onClick={() => onNavigate('my_requests')}
              >
                Track Full Decision Timeline →
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)' }}>
              <HeartHandshake size={34} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ fontSize: '0.86rem' }}>You have no pending welfare claims.</p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={onOpenApply}>
                Submit New Application
              </button>
            </div>
          )}
        </div>

        {/* Recent Contributions Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">My Recent Contributions (PAY-04)</h3>
              <p className="card-subtitle">Official records entered by the treasury</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('my_contributions')}>
              Full Statement →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {myContributions.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No contributions recorded yet.</p>
            ) : (
              myContributions.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '0.86rem', textTransform: 'capitalize' }}>
                        {c.category.replace('_', ' ')}
                      </strong>
                      <span className="code-badge">{c.referenceNumber}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {c.paymentDate} · {c.paymentMethod.toUpperCase()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                      {settings.currency} {c.amount.toLocaleString()}
                    </div>
                    <span className={`status-pill pill-${c.status}`} style={{ marginTop: '2px' }}>
                      <span className="status-dot" />
                      {c.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
