import React from 'react';
import {
  Users,
  CreditCard,
  HeartHandshake,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  FileCheck,
  PlusCircle,
  ShieldAlert,
  Download
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, Contribution, WelfareRequest, OrganizationSettings } from '../../types';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
  settings: OrganizationSettings;
  onOpenRecordPayment: () => void;
  onOpenNewMember: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onNavigate,
  settings,
  onOpenRecordPayment,
  onOpenNewMember
}) => {
  const stats = StorageService.getSystemStats();
  const contributions = StorageService.getContributions().slice(0, 5);
  const requests = StorageService.getWelfareRequests().slice(0, 4);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Administrative Dashboard</h2>
          <p>Real-time oversight of members, verified contributions, welfare pipelines, and treasury balance</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => onNavigate('reports')}>
            <Download size={15} />
            <span>Operational Reports</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenRecordPayment}>
            <PlusCircle size={15} />
            <span>Record Payment</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenNewMember} style={{ background: '#10b981' }}>
            <Users size={15} />
            <span>Register Member</span>
          </button>
        </div>
      </div>

      {/* PRD Section 4.4 & 4.2 Accounting Boundary Callout */}
      <div className="notice-banner notice-info">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>PRD Compliance Note:</strong> In accordance with Sections 4.2 & 4.4, the system strictly separates <em>Recorded Payments</em> (entered externally) from <em>Verified Transactions</em> (reconciled by Finance). The treasury balance of <strong>{settings.currency} {stats.operationalBalance.toLocaleString()}</strong> represents the internal operational ledger.
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ '--accent-color': '#3b82f6' } as any}>
          <div className="metric-header">
            <span className="metric-title">Total Membership</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(59, 130, 246, 0.12)', '--metric-color': '#3b82f6' } as any}>
              <Users size={18} />
            </div>
          </div>
          <div className="metric-value">{stats.totalMembers}</div>
          <div className="metric-subtext">
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{stats.activeMembers} active</span>
            <span>·</span>
            <span>{stats.pendingMembers} pending verification</span>
          </div>
        </div>

        <div className="metric-card" style={{ '--accent-color': '#10b981' } as any}>
          <div className="metric-header">
            <span className="metric-title">Verified Collections</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(16, 185, 129, 0.12)', '--metric-color': '#10b981' } as any}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="metric-value">
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
              {settings.currency}
            </span>
            {stats.totalVerifiedIncome.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>Verified external payments reconciled</span>
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
            {stats.totalPendingContributions.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <button
              onClick={() => onNavigate('contributions')}
              style={{ background: 'none', border: 'none', color: '#fbbf24', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Review recorded items →
            </button>
          </div>
        </div>

        <div className="metric-card" style={{ '--accent-color': '#8b5cf6' } as any}>
          <div className="metric-header">
            <span className="metric-title">Welfare Disbursed</span>
            <div className="metric-icon-box" style={{ '--metric-bg': 'rgba(139, 92, 246, 0.12)', '--metric-color': '#8b5cf6' } as any}>
              <HeartHandshake size={18} />
            </div>
          </div>
          <div className="metric-value">
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '4px' }}>
              {settings.currency}
            </span>
            {stats.disbursedRequestsTotal.toLocaleString()}
          </div>
          <div className="metric-subtext">
            <span>{stats.pendingRequestsCount} applications in pipeline</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Welfare Pipeline & Recent Contributions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Welfare Requests Summary Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Welfare Assistance Pipeline</h3>
              <p className="card-subtitle">Active requests awaiting review and approval</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('welfare')}>
              View All ({requests.length}) →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {requests.map(req => (
              <div
                key={req.id}
                onClick={() => onNavigate('welfare')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="code-badge">{req.id}</span>
                    <strong style={{ fontSize: '0.88rem' }}>{req.memberName}</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {req.category.replace('_', ' ').toUpperCase()} · {settings.currency} {req.amountRequested.toLocaleString()}
                  </div>
                </div>

                <div>
                  <span className={`status-pill pill-${req.status}`}>
                    <span className="status-dot" />
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contributions Card */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Payment Records</h3>
              <p className="card-subtitle">External member payments recorded into system</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('contributions')}>
              Full Register →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contributions.map(con => (
              <div
                key={con.id}
                onClick={() => onNavigate('contributions')}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.88rem' }}>{con.memberName}</strong>
                    <span className="code-badge">{con.referenceNumber}</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {con.paymentDate} · {con.paymentMethod.toUpperCase()} · Rec by: {con.recordedBy}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: con.status === 'reversed' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                    {settings.currency} {con.amount.toLocaleString()}
                  </div>
                  <span className={`status-pill pill-${con.status}`} style={{ marginTop: '2px' }}>
                    <span className="status-dot" />
                    {con.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
