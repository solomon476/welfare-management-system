import React from 'react';
import { BookOpen, ShieldCheck, Heart, AlertCircle, FileCheck, CheckCircle2 } from 'lucide-react';
import { OrganizationSettings } from '../../types';

interface WelfareRulesProps {
  settings: OrganizationSettings;
}

export const WelfareRules: React.FC<WelfareRulesProps> = ({ settings }) => {
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title-group">
          <h2>Association Welfare Constitution & Bylaws</h2>
          <p>Governing policies, eligibility rules, benefit ceilings, and application guidelines</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Section 1 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">1. Membership & Contribution Obligations</h3>
            <ShieldCheck size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p>
              <strong>1.1 Good Standing Requirement:</strong> A member must maintain regular monthly contributions of <strong>{settings.currency} {settings.monthlyDuesAmount.toLocaleString()}</strong> to remain eligible for welfare assistance.
            </p>
            <p>
              <strong>1.2 Waiting Period:</strong> New members must complete a continuous 3-month probationary period from the date of registration before becoming eligible for non-emergency welfare benefits.
            </p>
            <p>
              <strong>1.3 External Payment Policy:</strong> Payments entered via M-Pesa or bank transfer are initially marked as <em>Recorded</em> and become recognized in formal standing once verified by the Treasury.
            </p>
          </div>
        </div>

        {/* Section 2 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">2. Welfare Assistance Categories & Benefit Limits</h3>
            <Heart size={18} color="var(--danger)" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>Bereavement Support</strong>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', margin: '6px 0' }}>
                Up to {settings.currency} {settings.maxBereavementBenefit.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Granted upon demise of a registered member, spouse, or biological child. Requires certified burial permit or death notification.
              </p>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>Medical & Hospitalization</strong>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)', margin: '6px 0' }}>
                Up to {settings.currency} {settings.maxMedicalBenefit.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Support for major surgery, critical care, or in-patient admission exceeding 4 days. Requires medical discharge summary and hospital invoice.
              </p>
            </div>

            <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>Education Hardship</strong>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', margin: '6px 0' }}>
                Up to {settings.currency} {settings.maxEducationBenefit.toLocaleString()}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Emergency clearance assistance for final examinations or sudden economic distress. Subject to institutional fee statement validation.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">3. Committee Review & Payout Protocols</h3>
            <FileCheck size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p>
              <strong>3.1 Quorum:</strong> Applications require approval by at least <strong>{settings.approvalQuorum} designated approvers</strong> from the Welfare Advisory Committee before funds are released.
            </p>
            <p>
              <strong>3.2 Traceable Disbursements:</strong> All disbursements are executed directly to the applicant's verified M-Pesa line or bank account and permanently linked to a financial voucher number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
