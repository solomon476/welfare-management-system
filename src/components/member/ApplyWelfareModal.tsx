import React, { useState } from 'react';
import { HeartHandshake, X, Upload, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, WelfareCategory, RequestUrgency, OrganizationSettings } from '../../types';

interface ApplyWelfareModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  settings: OrganizationSettings;
  onSuccess: () => void;
}

export const ApplyWelfareModal: React.FC<ApplyWelfareModalProps> = ({
  isOpen,
  onClose,
  member,
  settings,
  onSuccess
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<WelfareCategory>('medical');
  const [urgency, setUrgency] = useState<RequestUrgency>('urgent');
  const [amountRequested, setAmountRequested] = useState<number>(20000);
  const [description, setDescription] = useState('');
  const [payoutDetails, setPayoutDetails] = useState(`M-Pesa ${member?.phone || ''} (${member?.fullName || 'Member'})`);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    'Supporting_Medical_Bill_Estimate.pdf'
  ]);

  const getCategoryCap = () => {
    switch (category) {
      case 'bereavement':
        return settings.maxBereavementBenefit;
      case 'medical':
        return settings.maxMedicalBenefit;
      case 'education_emergency':
        return settings.maxEducationBenefit;
      default:
        return 20000;
    }
  };

  const currentCap = getCategoryCap();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amountRequested <= 0) {
      alert('Please fill out the request details and amount requested.');
      return;
    }

    const documents = selectedDocs.map((doc, idx) => ({
      id: `DOC-SUB-${Date.now()}-${idx}`,
      name: doc,
      size: '1.2 MB',
      uploadedAt: new Date().toISOString().split('T')[0]
    }));

    StorageService.submitWelfareRequest({
      memberId: member?.id || 'SW-M001',
      memberName: member?.fullName || 'Welfare Member',
      membershipNumber: member?.membershipNumber || 'SW-MEMBER',
      category,
      urgency,
      amountRequested,
      description: description.trim(),
      documents,
      bankOrMpesaPayoutDetails: payoutDetails.trim()
    });

    onSuccess();
    onClose();
  };

  const handleAddSampleDoc = (docName: string) => {
    if (!selectedDocs.includes(docName)) {
      setSelectedDocs([...selectedDocs, docName]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div>
              <h3 className="modal-title">Submit Welfare Assistance Application</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                PRD 4.3 WEL-01 & WEL-02: Self-service member application with required documentation
              </p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body">
            {/* Notice of limits */}
            <div className="notice-banner notice-info">
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Bylaw Benefit Limit:</strong> For <em>{category.replace('_', ' ')}</em>, the constitution sets an assistance ceiling of <strong>{settings.currency} {currentCap.toLocaleString()}</strong>. Decisions are subject to committee quorum review.
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Welfare Assistance Category *</label>
                <select
                  className="form-select"
                  value={category}
                  onChange={e => {
                    const cat = e.target.value as WelfareCategory;
                    setCategory(cat);
                  }}
                >
                  <option value="medical">Medical & Hospitalization Co-Pay</option>
                  <option value="bereavement">Bereavement & Funeral Support</option>
                  <option value="education_emergency">Education / School Emergency</option>
                  <option value="disaster_relief">Disaster Relief / Property Loss</option>
                  <option value="general_assistance">General Compassionate Assistance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Tier *</label>
                <select
                  className="form-select"
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as RequestUrgency)}
                >
                  <option value="normal">Normal Review Schedule (7-14 Days)</option>
                  <option value="urgent">Urgent Review (48-72 Hours)</option>
                  <option value="emergency">Critical Emergency (Immediate 24 Hours)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount Requested ({settings.currency}) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={currentCap}
                  className="form-input"
                  value={amountRequested}
                  onChange={e => setAmountRequested(Number(e.target.value))}
                />
                <div className="form-hint">
                  Cannot exceed the constitutional category cap of {settings.currency} {currentCap.toLocaleString()}.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Preferred Payout Destination (M-Pesa or Bank) *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. M-Pesa 07XX XXX XXX or Bank Account & Branch"
                  value={payoutDetails}
                  onChange={e => setPayoutDetails(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Detailed Circumstances & Justification *</label>
              <textarea
                rows={4}
                required
                className="form-textarea"
                placeholder="Explain the circumstances, beneficiary relation, hospital/institution details, and reasons for assistance..."
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Document Upload Simulation */}
            <div className="form-group">
              <label className="form-label">Supporting Evidence & Documents (WEL-02)</label>
              <div style={{ background: 'var(--bg-elevated)', border: '1px dashed var(--border-medium)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Upload size={16} color="var(--primary)" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Attached Evidence Documents:</span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {selectedDocs.map((doc, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-subtle)',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <FileText size={14} color="var(--primary)" />
                      <span>{doc}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDocs(selectedDocs.filter(d => d !== doc))}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Attach quick sample verification documents:
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddSampleDoc('Hospital_Admission_Letter.pdf')}
                  >
                    + Hospital Admission Letter
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddSampleDoc('Official_Burial_Permit.pdf')}
                  >
                    + Burial Permit
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAddSampleDoc('University_Fee_Statement.pdf')}
                  >
                    + School Fee Statement
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
