import React from 'react';
import { CreditCard, Printer, Download, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, OrganizationSettings } from '../../types';

interface MyContributionsProps {
  member: Member;
  settings: OrganizationSettings;
}

export const MyContributions: React.FC<MyContributionsProps> = ({ member, settings }) => {
  const contributions = StorageService.getContributions()
    .filter(c => c.memberId === member.id && c.status !== 'reversed');

  const balance = StorageService.calculateMemberBalance(member.id);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const headers = ['Record ID', 'Payment Date', 'Category', 'Payment Method', 'Reference Number', 'Amount', 'Status'];
    const rows = contributions.map(c => [
      c.id,
      c.paymentDate,
      c.category,
      c.paymentMethod,
      c.referenceNumber,
      c.amount,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statement_${member.membershipNumber}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content">
      {/* Print Statement Header */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{settings.orgName}</h1>
        <p style={{ fontSize: '0.82rem' }}>Registration: {settings.registrationNumber} · {settings.address}</p>
        <div style={{ marginTop: '12px', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <div><strong>Member Name:</strong> {member.fullName}</div>
          <div><strong>Membership No:</strong> {member.membershipNumber} | <strong>National ID:</strong> {member.nationalId}</div>
          <div><strong>Statement Date:</strong> {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>My Contribution Statement</h2>
          <p>PRD 4.2 PAY-04: View all payments recorded for your membership with verified receipt references</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Official Statement</span>
          </button>
          <button className="btn btn-primary" onClick={handleDownloadCSV}>
            <Download size={15} />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Account Standing Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Receipts</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {settings.currency} {balance.verifiedPaid.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Confirmed by Association Treasury
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Verification</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {settings.currency} {balance.pendingVerification.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Recorded and awaiting bank reconciliation
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Dues Rate</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
            {settings.currency} {balance.monthlyDuesRate.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Standard membership monthly dues
          </div>
        </div>
      </div>

      {/* Desktop View: Multi-Column Table */}
      <div className="table-container desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt Reference</th>
              <th>Date</th>
              <th>Category</th>
              <th>Payment Mode</th>
              <th>Amount Paid</th>
              <th>Status</th>
              <th>Recording Officer</th>
            </tr>
          </thead>
          <tbody>
            {contributions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No payment records found under your membership number.
                </td>
              </tr>
            ) : (
              contributions.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="code-badge">{c.referenceNumber}</span>
                  </td>
                  <td>{c.paymentDate}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.category.replace('_', ' ')}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>{c.paymentMethod}</td>
                  <td>
                    <strong>{settings.currency} {c.amount.toLocaleString()}</strong>
                  </td>
                  <td>
                    <span className={`status-pill pill-${c.status}`}>
                      <span className="status-dot" />
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {c.recordedBy}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Phone View: Native Mobile Card List (Zero Horizontal Scroll) */}
      <div className="mobile-card-list mobile-only">
        {contributions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No payment records found under your membership number.
          </div>
        ) : (
          contributions.map(c => (
            <div key={c.id} className="mobile-record-card">
              <div className="mobile-card-header">
                <span className="code-badge">{c.referenceNumber}</span>
                <span className={`status-pill pill-${c.status}`}>
                  <span className="status-dot" />
                  {c.status}
                </span>
              </div>
              <div className="mobile-card-main">
                <div>
                  <div className="mobile-card-title">{c.category.replace('_', ' ').toUpperCase()}</div>
                  <div className="mobile-card-subtitle">{c.paymentDate} · {c.paymentMethod.toUpperCase()}</div>
                </div>
                <div className="mobile-card-amount">
                  {settings.currency} {c.amount.toLocaleString()}
                </div>
              </div>
              <div className="mobile-card-grid">
                <div>
                  <div className="mobile-card-grid-item-label">Payment Mode</div>
                  <div className="mobile-card-grid-item-value">{c.paymentMethod.toUpperCase()}</div>
                </div>
                <div>
                  <div className="mobile-card-grid-item-label">Recorded By</div>
                  <div className="mobile-card-grid-item-value">{c.recordedBy}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Print Signature Footer */}
      <div className="print-only" style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <p>Verified By Secretariat: _____________________________</p>
          <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Official Association Seal & Date</p>
        </div>
        <div>
          <p>Member Signature: _____________________________</p>
        </div>
      </div>
    </div>
  );
};
