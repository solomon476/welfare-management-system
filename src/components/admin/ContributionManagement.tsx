import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  FileText,
  Download,
  X,
  ShieldCheck,
  Clock,
  Filter
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Contribution, PaymentCategory, PaymentMethod, PaymentStatus, OrganizationSettings, UserRole, Member } from '../../types';

interface ContributionManagementProps {
  settings: OrganizationSettings;
  userRole: UserRole;
  isRecordOpen: boolean;
  setIsRecordOpen: (open: boolean) => void;
}

export const ContributionManagement: React.FC<ContributionManagementProps> = ({
  settings,
  userRole,
  isRecordOpen,
  setIsRecordOpen
}) => {
  const [contributions, setContributions] = useState<Contribution[]>(StorageService.getContributions());
  const [members] = useState<Member[]>(StorageService.getMembers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Reversal Modal
  const [reversingItem, setReversingItem] = useState<Contribution | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Form State for Record Payment
  const [formData, setFormData] = useState({
    memberId: members[0]?.id || '',
    amount: settings.monthlyDuesAmount,
    paymentDate: new Date().toISOString().split('T')[0],
    category: 'monthly_dues' as PaymentCategory,
    paymentMethod: 'mpesa' as PaymentMethod,
    referenceNumber: '',
    notes: ''
  });

  const [refDuplicateWarning, setRefDuplicateWarning] = useState<string | null>(null);

  const refreshData = () => {
    setContributions(StorageService.getContributions());
  };

  const handleRefChange = (ref: string) => {
    setFormData(prev => ({ ...prev, referenceNumber: ref }));
    if (!ref.trim()) {
      setRefDuplicateWarning(null);
      return;
    }
    const found = contributions.find(
      c => c.referenceNumber.toLowerCase() === ref.trim().toLowerCase() && c.status !== 'reversed'
    );
    if (found) {
      setRefDuplicateWarning(`Warning: Reference number "${ref}" is already recorded on payment ${found.id} for ${found.memberName}.`);
    } else {
      setRefDuplicateWarning(null);
    }
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.amount || !formData.referenceNumber) {
      alert('Please fill all required fields including payment reference.');
      return;
    }

    const member = members.find(m => m.id === formData.memberId);
    if (!member) return;

    StorageService.recordContribution({
      memberId: member.id,
      memberName: member.fullName,
      membershipNumber: member.membershipNumber,
      amount: Number(formData.amount),
      paymentDate: formData.paymentDate,
      category: formData.category,
      paymentMethod: formData.paymentMethod,
      referenceNumber: formData.referenceNumber.trim().toUpperCase(),
      notes: formData.notes
    });

    refreshData();
    setIsRecordOpen(false);
    setFormData({
      memberId: members[0]?.id || '',
      amount: settings.monthlyDuesAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      category: 'monthly_dues',
      paymentMethod: 'mpesa',
      referenceNumber: '',
      notes: ''
    });
    setRefDuplicateWarning(null);
  };

  const handleVerify = (id: string) => {
    if (confirm('Verify this payment against the official bank or M-Pesa transaction statement?')) {
      StorageService.verifyContribution(id);
      refreshData();
    }
  };

  const handleReverseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingItem || !reversalReason.trim()) {
      alert('Please state a reason for this non-destructive reversal.');
      return;
    }

    StorageService.reverseContribution(reversingItem.id, reversalReason.trim());
    refreshData();
    setReversingItem(null);
    setReversalReason('');
  };

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Member', 'Membership No', 'Date', 'Amount', 'Category', 'Method', 'Reference', 'Status', 'Recorded By', 'Verified By'];
    const rows = filteredContributions.map(c => [
      c.id,
      `"${c.memberName}"`,
      c.membershipNumber,
      c.paymentDate,
      c.amount,
      c.category,
      c.paymentMethod,
      c.referenceNumber,
      c.status,
      `"${c.recordedBy}"`,
      `"${c.verifiedBy || 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solian_Wolves_Contributions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredContributions = contributions.filter(c => {
    const matchesSearch =
      c.memberName.toLowerCase().includes(search.toLowerCase()) ||
      c.membershipNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalVerified = filteredContributions
    .filter(c => c.status === 'verified')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalRecorded = filteredContributions
    .filter(c => c.status === 'recorded')
    .reduce((sum, c) => sum + c.amount, 0);

  const canVerify = ['admin', 'finance_officer'].includes(userRole);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Contributions & Payment Records</h2>
          <p>PRD 4.2: Record external receipts with traceable verification and reversal audit controls</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsRecordOpen(true)}>
            <Plus size={15} />
            <span>Record External Payment</span>
          </button>
        </div>
      </div>

      {/* Verification Notice banner */}
      <div className="notice-banner notice-warning">
        <Clock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Accounting Control (PAY-06 & PAY-07):</strong> The system strictly distinguishes between a payment that has been entered (<em>Recorded</em>) and one that has been reconciled against the bank statement (<em>Verified</em>). Only verified funds enter formal treasury reports.
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem' }}>
            <CheckCircle2 size={16} />
            <span>Verified Treasury Receipts</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {settings.currency} {totalVerified.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '16px 20px', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 600, fontSize: '0.8rem' }}>
            <Clock size={16} />
            <span>Recorded (Awaiting Bank/M-Pesa Verification)</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {settings.currency} {totalRecorded.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by member name, receipt ref, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="verified">Verified Only</option>
          <option value="recorded">Pending Verification</option>
          <option value="reversed">Reversed / Voided</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="monthly_dues">Monthly Dues</option>
          <option value="benevolent_levy">Benevolent Levy</option>
          <option value="emergency_fund">Emergency Fund</option>
          <option value="registration_fee">Registration Fee</option>
        </select>
      </div>

      {/* Table (Desktop View) */}
      <div className="table-container desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt Ref</th>
              <th>Member Details</th>
              <th>Date</th>
              <th>Category</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Verification Status</th>
              <th>Audit Trail</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredContributions.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No payment records found matching the criteria.
                </td>
              </tr>
            ) : (
              filteredContributions.map(con => (
                <tr key={con.id}>
                  <td>
                    <span className="code-badge">{con.referenceNumber}</span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>{con.id}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.88rem' }}>{con.memberName}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{con.membershipNumber}</div>
                  </td>
                  <td>{con.paymentDate}</td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                      {con.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="code-badge" style={{ textTransform: 'uppercase' }}>
                      {con.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: con.status === 'reversed' ? 'var(--text-muted)' : 'var(--text-main)' }}>
                      {settings.currency} {con.amount.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    <span className={`status-pill pill-${con.status}`}>
                      <span className="status-dot" />
                      {con.status}
                    </span>
                    {con.reversalReason && (
                      <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '2px', maxWidth: '160px' }} title={con.reversalReason}>
                        Reversed: {con.reversalReason.slice(0, 24)}...
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem' }}>Rec: {con.recordedBy}</div>
                    {con.verifiedBy && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--success)' }}>
                        Ver: {con.verifiedBy}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {con.status === 'recorded' && canVerify && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleVerify(con.id)}
                          title="Verify external bank/M-Pesa payment"
                        >
                          <CheckCircle2 size={13} />
                          <span>Verify</span>
                        </button>
                      )}

                      {con.status !== 'reversed' && canVerify && (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setReversingItem(con)}
                          title="Correct/Reverse entry with audit reason (PAY-07)"
                        >
                          <RotateCcw size={13} />
                          <span>Reverse</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Phone View: Native Mobile Card List (Zero Horizontal Scroll) */}
      <div className="mobile-card-list mobile-only">
        {filteredContributions.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No payment records found matching the criteria.
          </div>
        ) : (
          filteredContributions.map(con => (
            <div key={con.id} className="mobile-record-card">
              <div className="mobile-card-header">
                <div>
                  <span className="code-badge">{con.referenceNumber}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '6px' }}>{con.paymentDate}</span>
                </div>
                <span className={`status-pill pill-${con.status}`}>
                  <span className="status-dot" />
                  {con.status}
                </span>
              </div>

              <div className="mobile-card-main">
                <div>
                  <div className="mobile-card-title">{con.memberName}</div>
                  <div className="mobile-card-subtitle">
                    {con.membershipNumber} · {con.category.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="mobile-card-amount" style={{ color: con.status === 'reversed' ? 'var(--text-muted)' : 'var(--primary)' }}>
                  {settings.currency} {con.amount.toLocaleString()}
                </div>
              </div>

              <div className="mobile-card-grid">
                <div>
                  <div className="mobile-card-grid-item-label">Payment Method</div>
                  <div className="mobile-card-grid-item-value" style={{ textTransform: 'uppercase' }}>{con.paymentMethod}</div>
                </div>
                <div>
                  <div className="mobile-card-grid-item-label">Audit / Verification</div>
                  <div className="mobile-card-grid-item-value">
                    {con.verifiedBy ? `Ver: ${con.verifiedBy}` : `Rec: ${con.recordedBy}`}
                  </div>
                </div>
              </div>

              {con.reversalReason && (
                <div style={{ fontSize: '0.74rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Reversed:</strong> {con.reversalReason}
                </div>
              )}

              {canVerify && con.status !== 'reversed' && (
                <div className="mobile-card-actions">
                  {con.status === 'recorded' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleVerify(con.id)}
                    >
                      <CheckCircle2 size={15} />
                      <span>Verify Payment</span>
                    </button>
                  )}
                  <button
                    className="btn btn-outline-danger"
                    onClick={() => setReversingItem(con)}
                  >
                    <RotateCcw size={15} />
                    <span>Reverse Entry</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal: Record External Payment */}
      {isRecordOpen && (
        <div className="modal-overlay" onClick={() => setIsRecordOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleRecordSubmit}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Record External Payment</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PRD 4.2: Enter payment received via M-Pesa, bank, cash or cheque
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsRecordOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {refDuplicateWarning && (
                  <div className="notice-banner notice-warning" style={{ marginBottom: '14px' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>{refDuplicateWarning}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Member *</label>
                  <select
                    className="form-select"
                    value={formData.memberId}
                    onChange={e => setFormData({ ...formData, memberId: e.target.value })}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.membershipNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Amount ({settings.currency}) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="form-input"
                      value={formData.amount}
                      onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Payment *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={formData.paymentDate}
                      onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Category *</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value as PaymentCategory })}
                    >
                      <option value="monthly_dues">Monthly Dues</option>
                      <option value="benevolent_levy">Benevolent Levy</option>
                      <option value="emergency_fund">Emergency Fund</option>
                      <option value="registration_fee">Registration Fee</option>
                      <option value="special_contribution">Special Project Contribution</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Mode *</label>
                    <select
                      className="form-select"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                    >
                      <option value="mpesa">M-Pesa</option>
                      <option value="bank_transfer">Direct Bank Transfer (EFT/RTGS)</option>
                      <option value="cash">Cash (Physical Receipt)</option>
                      <option value="cheque">Banker's Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">External Reference / Receipt Number *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. QKJ891024L or Bank Slip Ref"
                    value={formData.referenceNumber}
                    onChange={e => handleRefChange(e.target.value)}
                  />
                  <div className="form-hint">
                    Reference is matched to prevent duplicate entry of external receipts (PAY-03).
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes / Breakdown</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="e.g. October monthly dues paid in advance..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsRecordOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Payment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reversal / Correction with reason (PAY-07) */}
      {reversingItem && (
        <div className="modal-overlay" onClick={() => setReversingItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleReverseSubmit}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Reverse Payment Record: {reversingItem.referenceNumber}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PRD 4.2 PAY-07: Non-destructive correction with traceable audit reason
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setReversingItem(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="notice-banner notice-warning">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    This action will mark the record as <strong>Reversed</strong> without deleting history. The reversal event will be logged in the permanent audit trail.
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.84rem' }}>
                  <div><strong>Member:</strong> {reversingItem.memberName} ({reversingItem.membershipNumber})</div>
                  <div><strong>Amount:</strong> {settings.currency} {reversingItem.amount.toLocaleString()}</div>
                  <div><strong>Reference:</strong> {reversingItem.referenceNumber}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Mandatory Reason for Reversal *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    placeholder="e.g. Duplicate entry by officer, incorrect M-Pesa transaction code, or bank bounced cheque..."
                    value={reversalReason}
                    onChange={e => setReversalReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setReversingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Confirm Reversal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
