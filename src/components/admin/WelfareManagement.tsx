import React, { useState } from 'react';
import {
  HeartHandshake,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  X,
  FileCheck,
  UserCheck,
  ChevronRight,
  Shield,
  Send
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { WelfareRequest, WelfareStatus, OrganizationSettings, UserRole } from '../../types';

interface WelfareManagementProps {
  settings: OrganizationSettings;
  userRole: UserRole;
}

export const WelfareManagement: React.FC<WelfareManagementProps> = ({ settings, userRole }) => {
  const [requests, setRequests] = useState<WelfareRequest[]>(StorageService.getWelfareRequests());
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Review / Decision Modal
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);

  // Decision Form State
  const [decisionNotes, setDecisionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);

  // Disbursement Modal State
  const [disbursingRequest, setDisbursingRequest] = useState<WelfareRequest | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<'bank_transfer' | 'mpesa' | 'cash' | 'cheque'>('mpesa');
  const [disburseRef, setDisburseRef] = useState('');

  const refreshData = () => {
    setRequests(StorageService.getWelfareRequests());
  };

  const handleOpenReview = (req: WelfareRequest) => {
    setSelectedRequest(req);
    setApprovedAmount(req.amountApproved || req.amountRequested);
    setDecisionNotes('');
  };

  const handleStatusChange = (newStatus: WelfareStatus) => {
    if (!selectedRequest) return;
    if (!decisionNotes.trim()) {
      alert('Please add review notes or committee remarks for traceability.');
      return;
    }

    StorageService.updateWelfareRequestStatus(
      selectedRequest.id,
      newStatus,
      decisionNotes.trim(),
      newStatus === 'approved' ? approvedAmount : undefined
    );

    refreshData();
    setSelectedRequest(null);
    setDecisionNotes('');
  };

  const handleDisburseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disbursingRequest || !disburseRef.trim()) {
      alert('Please enter a disbursement transaction reference.');
      return;
    }

    StorageService.disburseWelfareRequest(disbursingRequest.id, disburseMethod, disburseRef.trim());
    refreshData();
    setDisbursingRequest(null);
    setDisburseRef('');
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.memberName.toLowerCase().includes(search.toLowerCase()) ||
      r.membershipNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusTab === 'all' || r.status === statusTab;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const canApprove = ['admin', 'approver'].includes(userRole);
  const canDisburse = ['admin', 'finance_officer'].includes(userRole);
  const canReview = ['admin', 'welfare_officer', 'approver'].includes(userRole);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return <span className="status-pill pill-rejected">Emergency</span>;
      case 'urgent':
        return <span className="status-pill pill-under_review">Urgent</span>;
      default:
        return <span className="status-pill pill-active">Normal</span>;
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Welfare Assistance & Requests</h2>
          <p>PRD 4.3: Controlled multi-stage application review, eligibility checking, and disbursement linking</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', overflowX: 'auto', paddingBottom: '6px' }}>
        {[
          { id: 'all', label: 'All Requests' },
          { id: 'submitted', label: 'New Submitted' },
          { id: 'under_review', label: 'Under Review' },
          { id: 'more_info_required', label: 'More Info Needed' },
          { id: 'approved', label: 'Approved (Ready to Disburse)' },
          { id: 'disbursed', label: 'Disbursed / Completed' },
          { id: 'rejected', label: 'Declined' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusTab(tab.id)}
            style={{
              padding: '8px 14px',
              border: 'none',
              background: 'transparent',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: statusTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: statusTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by applicant name, request ID, or details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Welfare Categories</option>
          <option value="bereavement">Bereavement Support</option>
          <option value="medical">Medical Assistance</option>
          <option value="education_emergency">Education Emergency</option>
          <option value="disaster_relief">Disaster Relief</option>
          <option value="general_assistance">General Assistance</option>
        </select>
      </div>

      {/* Requests Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Applicant Member</th>
              <th>Category</th>
              <th>Urgency</th>
              <th>Amount Req / App</th>
              <th>Submitted Date</th>
              <th>Current Status</th>
              <th>Payout Route</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No welfare applications found for this filter.
                </td>
              </tr>
            ) : (
              filteredRequests.map(req => (
                <tr key={req.id}>
                  <td>
                    <span className="code-badge">{req.id}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.88rem' }}>{req.memberName}</strong>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{req.membershipNumber}</div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                      {req.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{getUrgencyBadge(req.urgency)}</td>
                  <td>
                    <div><strong>{settings.currency} {req.amountRequested.toLocaleString()}</strong></div>
                    {req.amountApproved !== undefined && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                        App: {settings.currency} {req.amountApproved.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td>{req.submissionDate}</td>
                  <td>
                    <span className={`status-pill pill-${req.status}`}>
                      <span className="status-dot" />
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.74rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.bankOrMpesaPayoutDetails || 'Not specified'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenReview(req)}
                        title="Review Documents and Status History"
                      >
                        <FileCheck size={13} />
                        <span>Review</span>
                      </button>

                      {req.status === 'approved' && canDisburse && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setDisbursingRequest(req);
                            setDisburseRef('');
                          }}
                          title="Execute Disbursement to Financial Ledger (WEL-07)"
                        >
                          <DollarSign size={13} />
                          <span>Disburse</span>
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

      {/* Modal: Review & Committee Decision (WEL-03 to WEL-06) */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="code-badge">{selectedRequest.id}</span>
                <h3 className="modal-title">Welfare Claim Review: {selectedRequest.memberName}</h3>
                <span className={`status-pill pill-${selectedRequest.status}`}>
                  <span className="status-dot" />
                  {selectedRequest.status.replace('_', ' ')}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRequest(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {/* Request Overview */}
              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Category:</span>
                    <strong style={{ display: 'block', textTransform: 'capitalize' }}>{selectedRequest.category.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Amount Requested:</span>
                    <strong style={{ display: 'block', color: 'var(--primary)' }}>
                      {settings.currency} {selectedRequest.amountRequested.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Urgency Tier:</span>
                    <div style={{ marginTop: '2px' }}>{getUrgencyBadge(selectedRequest.urgency)}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Payout Route:</span>
                    <strong style={{ display: 'block' }}>{selectedRequest.bankOrMpesaPayoutDetails || 'N/A'}</strong>
                  </div>
                </div>

                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.84rem' }}>
                  <strong style={{ color: 'var(--text-main)' }}>Description & Circumstances:</strong>
                  <p style={{ marginTop: '4px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {selectedRequest.description}
                  </p>
                </div>
              </div>

              {/* Supporting Documents (WEL-02) */}
              <div style={{ marginBottom: '18px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                  Supporting Verification Documents ({selectedRequest.documents.length})
                </h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedRequest.documents.map(doc => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.8rem'
                      }}
                    >
                      <FileText size={18} color="var(--primary)" />
                      <div>
                        <div style={{ fontWeight: 600 }}>{doc.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.size} · Verified format</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Timeline (WEL-06) */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '8px' }}>
                  Traceable Audit & Decision Log (WEL-06)
                </h4>
                <div className="timeline">
                  {selectedRequest.decisions.map(d => (
                    <div key={d.id} className="timeline-item">
                      <div className="timeline-header">
                        <strong>{d.officerName}</strong>
                        <span>({d.officerRole})</span>
                        <span>·</span>
                        <span>{d.timestamp}</span>
                        <span className={`status-pill pill-${d.status}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="timeline-body">
                        {d.notes}
                        {d.amountApproved && (
                          <div style={{ fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
                            Approved Sanction: {settings.currency} {d.amountApproved.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decision Action Input */}
              {selectedRequest.status !== 'disbursed' && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '10px', color: 'var(--text-main)' }}>
                    Add Review Decision / Action
                  </h4>

                  {canApprove && (
                    <div className="form-group">
                      <label className="form-label">
                        Approved Amount ({settings.currency}) — (Category Cap: {settings.currency} {
                          selectedRequest.category === 'bereavement' ? settings.maxBereavementBenefit.toLocaleString() :
                          selectedRequest.category === 'medical' ? settings.maxMedicalBenefit.toLocaleString() :
                          settings.maxEducationBenefit.toLocaleString()
                        })
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        value={approvedAmount}
                        onChange={e => setApprovedAmount(Number(e.target.value))}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Committee Remarks / Officer Notes *</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      placeholder="Add formal justification, verification notes, or information requested from member..."
                      value={decisionNotes}
                      onChange={e => setDecisionNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    {canReview && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleStatusChange('under_review')}
                      >
                        Mark Under Review
                      </button>
                    )}

                    {canReview && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#c084fc' }}
                        onClick={() => handleStatusChange('more_info_required')}
                      >
                        Request More Information
                      </button>
                    )}

                    {canApprove && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusChange('approved')}
                      >
                        <CheckCircle2 size={13} />
                        <span>Approve Assistance</span>
                      </button>
                    )}

                    {canApprove && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleStatusChange('rejected')}
                      >
                        <XCircle size={13} />
                        <span>Decline Request</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setSelectedRequest(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Disbursement to Financial Ledger (WEL-07 & FIN-03) */}
      {disbursingRequest && (
        <div className="modal-overlay" onClick={() => setDisbursingRequest(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleDisburseSubmit}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Disburse Welfare Assistance</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PRD 4.3 WEL-07 & 4.4 FIN-03: Link approved request to expenditure transaction
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDisbursingRequest(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div><strong>Applicant:</strong> {disbursingRequest.memberName}</div>
                  <div><strong>Request ID:</strong> {disbursingRequest.id}</div>
                  <div><strong>Category:</strong> {disbursingRequest.category.replace('_', ' ')}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                    Sanctioned Amount: {settings.currency} {(disbursingRequest.amountApproved || disbursingRequest.amountRequested).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '4px', color: 'var(--text-muted)' }}>
                    Recipient Payout Destination: <strong>{disbursingRequest.bankOrMpesaPayoutDetails || 'Direct'}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Disbursement Channel *</label>
                  <select
                    className="form-select"
                    value={disburseMethod}
                    onChange={e => setDisburseMethod(e.target.value as any)}
                  >
                    <option value="mpesa">M-Pesa B2C / Direct Mobile</option>
                    <option value="bank_transfer">Bank EFT / RTGS</option>
                    <option value="cheque">Official Association Cheque</option>
                    <option value="cash">Petty Cash Voucher</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Transaction Reference *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. MPESA-B2C-902184 or BANK-EFT-9910"
                    value={disburseRef}
                    onChange={e => setDisburseRef(e.target.value)}
                  />
                  <div className="form-hint">
                    This reference will be permanently recorded in the financial expenditure ledger.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setDisbursingRequest(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
