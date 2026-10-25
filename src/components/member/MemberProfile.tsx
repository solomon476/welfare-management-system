import React from 'react';
import { User, Shield, Phone, Mail, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { Member, OrganizationSettings } from '../../types';

interface MemberProfileProps {
  member: Member;
  settings: OrganizationSettings;
}

export const MemberProfile: React.FC<MemberProfileProps> = ({ member, settings }) => {
  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Member Profile & Beneficiary Registry</h2>
          <p>PRD 4.1 MEM-06: Permitted personal membership details and designated next-of-kin</p>
        </div>
      </div>

      {/* Two Column Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Personal Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Membership Identification</h3>
            <span className={`status-pill pill-${member.status}`}>
              <span className="status-dot" />
              {member.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.88rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Full Legal Name</span>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)', marginTop: '2px' }}>
                {member.fullName}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Membership Number</span>
                <div style={{ marginTop: '2px' }}>
                  <span className="code-badge">{member.membershipNumber}</span>
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>National ID Number</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{member.nationalId}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Phone Contact</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{member.phone}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Email Address</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{member.email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Membership Tier</span>
                <div style={{ fontWeight: 600, textTransform: 'capitalize', marginTop: '2px' }}>
                  {member.category.replace('_', ' ')}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Date Registered</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{member.dateJoined}</div>
              </div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase' }}>Monthly Commitment</span>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                {settings.currency} {member.monthlyCommitment.toLocaleString()} / month
              </div>
            </div>
          </div>
        </div>

        {/* Next of Kin / Beneficiary */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Designated Beneficiary / Next of Kin</h3>
            <Heart size={18} color="var(--danger)" />
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            In the event of bereavement or incapacitation, welfare benefits and emergency assistance are routed to your designated next-of-kin.
          </p>

          <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.86rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Next of Kin Full Name</span>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--text-main)', marginTop: '2px' }}>
                {member.nextOfKin?.name || 'Not on file'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Relationship</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {member.nextOfKin?.relationship || 'N/A'}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Primary Telephone</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>
                  {member.nextOfKin?.phone || 'N/A'}
                </div>
              </div>
            </div>

            {member.nextOfKin?.email && (
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', textTransform: 'uppercase' }}>Email Address</span>
                <div style={{ fontWeight: 600, marginTop: '2px' }}>{member.nextOfKin.email}</div>
              </div>
            )}
          </div>

          <div className="notice-banner notice-info" style={{ marginTop: '20px' }}>
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Kenya Data Protection Act Compliance (PRD Section 6):</strong> Member records and sensitive welfare circumstances are restricted to authorized welfare officers. Updates to legal identity or next-of-kin require secretariat validation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
