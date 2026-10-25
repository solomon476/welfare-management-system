import React, { useState } from 'react';
import { Settings, Save, Shield, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { OrganizationSettings, UserRole } from '../../types';

interface OrgSettingsViewProps {
  settings: OrganizationSettings;
  onSave: (updated: OrganizationSettings) => void;
  userRole: UserRole;
}

export const OrgSettingsView: React.FC<OrgSettingsViewProps> = ({ settings, onSave, userRole }) => {
  const [formData, setFormData] = useState<OrganizationSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const canEdit = userRole === 'admin';

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Organization & Welfare Policy Settings</h2>
          <p>PRD 4.5 ADM-08: Configure association baseline, statutory registration, monthly dues, and assistance limits</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="notice-banner notice-success">
          <CheckCircle2 size={18} />
          <div>Settings successfully updated and recorded in the audit trail.</div>
        </div>
      )}

      {!canEdit && (
        <div className="notice-banner notice-warning">
          <div>Read-only mode: Only users with the Administrator role can modify organization policies.</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Association Identity Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Association Identity</h3>
            <p className="card-subtitle">Public metadata and official legal details</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Association Legal Name</label>
              <input
                type="text"
                disabled={!canEdit}
                className="form-input"
                value={formData.orgName}
                onChange={e => setFormData({ ...formData, orgName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration / Society Number</label>
              <input
                type="text"
                disabled={!canEdit}
                className="form-input"
                value={formData.registrationNumber}
                onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mission / Tagline</label>
            <input
              type="text"
              disabled={!canEdit}
              className="form-input"
              value={formData.tagline}
              onChange={e => setFormData({ ...formData, tagline: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Official Contact Email</label>
              <input
                type="email"
                disabled={!canEdit}
                className="form-input"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Official Phone Number</label>
              <input
                type="text"
                disabled={!canEdit}
                className="form-input"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Physical Secretariat Address</label>
            <input
              type="text"
              disabled={!canEdit}
              className="form-input"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
        </div>

        {/* Contribution & Benefit Rules */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Contribution Rules & Benefit Ceilings</h3>
            <p className="card-subtitle">PRD 4.2 PAY-08 & 4.3 WEL-08: Configurable policy thresholds</p>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Accounting Currency Code</label>
              <input
                type="text"
                disabled={!canEdit}
                className="form-input"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Standard Monthly Dues Rate ({formData.currency})</label>
              <input
                type="number"
                disabled={!canEdit}
                className="form-input"
                value={formData.monthlyDuesAmount}
                onChange={e => setFormData({ ...formData, monthlyDuesAmount: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Bereavement Benefit Cap ({formData.currency})</label>
              <input
                type="number"
                disabled={!canEdit}
                className="form-input"
                value={formData.maxBereavementBenefit}
                onChange={e => setFormData({ ...formData, maxBereavementBenefit: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Medical Emergency Cap ({formData.currency})</label>
              <input
                type="number"
                disabled={!canEdit}
                className="form-input"
                value={formData.maxMedicalBenefit}
                onChange={e => setFormData({ ...formData, maxMedicalBenefit: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Max Education Hardship Cap ({formData.currency})</label>
              <input
                type="number"
                disabled={!canEdit}
                className="form-input"
                value={formData.maxEducationBenefit}
                onChange={e => setFormData({ ...formData, maxEducationBenefit: Number(e.target.value) })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Committee Approval Quorum (Min Approvers)</label>
              <input
                type="number"
                disabled={!canEdit}
                className="form-input"
                value={formData.approvalQuorum}
                onChange={e => setFormData({ ...formData, approvalQuorum: Number(e.target.value) })}
              />
            </div>
          </div>

          {canEdit && (
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={15} />
                <span>Save Organization Policies</span>
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
