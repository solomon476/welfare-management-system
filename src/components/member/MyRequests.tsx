import React, { useState } from 'react';
import { HeartHandshake, Plus, Clock, CheckCircle2, AlertCircle, FileText, X } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, OrganizationSettings, WelfareRequest } from '../../types';

interface MyRequestsProps {
  member: Member;
  settings: OrganizationSettings;
  onOpenApply: () => void;
}

export const MyRequests: React.FC<MyRequestsProps> = ({ member, settings, onOpenApply }) => {
  const [requests, setRequests] = useState<WelfareRequest[]>(
    StorageService.getWelfareRequests().filter(r => r.memberId === member.id)
  );

  const [selectedReq, setSelectedReq] = useState<WelfareRequest | null>(null);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Track My Welfare Applications</h2>
          <p>PRD 4.3 WEL-05 & WEL-06: Monitor review status, committee feedback, and disbursement schedule</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={onOpenApply}>
            <Plus size={15} />
            <span>New Assistance Request</span>
          </button>
        </div>
      </div>

      {/* Requests Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {requests.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <HeartHandshake size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>No Applications on Record</h3>
            <p style={{ fontSize: '0.86rem', marginTop: '4px' }}>
              When you submit a welfare assistance request, its progress and committee decisions will be displayed here.
            </p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '16px' }} onClick={onOpenApply}>
              Apply Now
            </button>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="code-badge" style={{ fontSize: '0.84rem' }}>{req.id}</span>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, textTransform: 'capitalize' }}>
                    {req.category.replace('_', ' ')} Application
                  </h3>
                  <span className={`status-pill pill-${req.status}`}>
                    <span className="status-dot" />
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Submitted on {req.submissionDate}
                </div>
              </div>

              {/* Request Narrative */}
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                {req.description}
              </p>

              {/* Financial Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: 'var(--bg-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Amount Requested:</span>
                  <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.94rem' }}>
                    {settings.currency} {req.amountRequested.toLocaleString()}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Sanctioned / Approved:</span>
                  <strong style={{ display: 'block', color: req.amountApproved ? 'var(--success)' : 'var(--text-secondary)', fontSize: '0.94rem' }}>
                    {req.amountApproved ? `${settings.currency} ${req.amountApproved.toLocaleString()}` : 'Under Evaluation'}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Payout Route:</span>
                  <strong style={{ display: 'block' }}>{req.bankOrMpesaPayoutDetails || 'Direct'}</strong>
                </div>

                {req.disbursementId && (
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Disbursement Ref:</span>
                    <strong style={{ display: 'block', color: 'var(--primary)' }}>{req.disbursementId}</strong>
                  </div>
                )}
              </div>

              {/* Traceable Decision Timeline */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Review History & Status Updates (WEL-06)
                </span>
                <div className="timeline" style={{ marginTop: '10px' }}>
                  {req.decisions.map(d => (
                    <div key={d.id} className="timeline-item">
                      <div className="timeline-header">
                        <strong>{d.officerRole}</strong>
                        <span>·</span>
                        <span>{d.timestamp}</span>
                        <span className={`status-pill pill-${d.status}`} style={{ fontSize: '0.66rem' }}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="timeline-body">
                        {d.notes}
                        {d.amountApproved && (
                          <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                            Sanctioned Amount: {settings.currency} {d.amountApproved.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
