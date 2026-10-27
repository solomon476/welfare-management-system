import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Eye,
  Edit,
  AlertTriangle,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  UserCheck,
  Shield
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { Member, MemberStatus, MemberCategory, OrganizationSettings, UserRole } from '../../types';

interface MemberManagementProps {
  settings: OrganizationSettings;
  userRole: UserRole;
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  settings,
  userRole,
  isCreateOpen,
  setIsCreateOpen
}) => {
  const [members, setMembers] = useState<Member[]>(StorageService.getMembers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Detail Modal
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Edit Modal
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form State for Create Member
  const [formData, setFormData] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    email: '',
    category: 'full_member' as MemberCategory,
    status: 'active' as MemberStatus,
    dateJoined: new Date().toISOString().split('T')[0],
    monthlyCommitment: settings.monthlyDuesAmount,
    kinName: '',
    kinRelation: 'Spouse',
    kinPhone: '',
    notes: ''
  });

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const refreshData = () => {
    setMembers(StorageService.getMembers());
  };

  // Duplicate detection on form changes (MEM-05)
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (['nationalId', 'phone', 'email'].includes(field)) {
        const check = StorageService.checkDuplicateMember(
          updated.nationalId,
          updated.phone,
          updated.email,
          editingMember?.id
        );
        if (check.isDuplicate && check.matchedMember) {
          setDuplicateWarning(`Duplicate detected: Matches existing member ${check.matchedMember.fullName} (${check.matchedMember.membershipNumber}) on ${check.field}`);
        } else {
          setDuplicateWarning(null);
        }
      }
      return updated;
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.nationalId || !formData.phone) {
      alert('Please fill all required fields.');
      return;
    }

    const dup = StorageService.checkDuplicateMember(formData.nationalId, formData.phone, formData.email);
    if (dup.isDuplicate) {
      if (!confirm(`Warning: A duplicate record was detected on ${dup.field}. Do you still want to proceed?`)) {
        return;
      }
    }

    StorageService.createMember({
      fullName: formData.fullName,
      nationalId: formData.nationalId,
      phone: formData.phone,
      email: formData.email,
      category: formData.category,
      status: formData.status,
      dateJoined: formData.dateJoined,
      monthlyCommitment: Number(formData.monthlyCommitment),
      nextOfKin: {
        name: formData.kinName || 'N/A',
        relationship: formData.kinRelation || 'Relative',
        phone: formData.kinPhone || formData.phone
      },
      notes: formData.notes
    });

    refreshData();
    setIsCreateOpen(false);
    setFormData({
      fullName: '',
      nationalId: '',
      phone: '',
      email: '',
      category: 'full_member',
      status: 'active',
      dateJoined: new Date().toISOString().split('T')[0],
      monthlyCommitment: settings.monthlyDuesAmount,
      kinName: '',
      kinRelation: 'Spouse',
      kinPhone: '',
      notes: ''
    });
    setDuplicateWarning(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    StorageService.updateMember(editingMember.id, {
      fullName: editingMember.fullName,
      phone: editingMember.phone,
      email: editingMember.email,
      status: editingMember.status,
      category: editingMember.category,
      monthlyCommitment: editingMember.monthlyCommitment,
      notes: editingMember.notes
    });

    refreshData();
    setEditingMember(null);
  };

  const handleExportCSV = () => {
    const headers = ['Membership No', 'Full Name', 'National ID', 'Phone', 'Email', 'Category', 'Status', 'Date Joined', 'Commitment'];
    const rows = filteredMembers.map(m => [
      m.membershipNumber,
      `"${m.fullName}"`,
      m.nationalId,
      m.phone,
      m.email,
      m.category,
      m.status,
      m.dateJoined,
      m.monthlyCommitment
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solian_Wolves_Members_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredMembers = members.filter(m => {
    const q = search.toLowerCase();
    const matchesSearch =
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.membershipNumber || '').toLowerCase().includes(q) ||
      (m.nationalId || '').includes(search) ||
      (m.phone || '').includes(search) ||
      (m.email || '').toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Member Registry</h2>
          <p>PRD 4.1: Maintain unique membership records, eligibility statuses, and audit traceability</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            <Plus size={15} />
            <span>Add New Member</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, membership no, ID or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending Approval</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          <option value="full_member">Full Member</option>
          <option value="associate">Associate</option>
          <option value="senior">Senior</option>
          <option value="youth">Youth</option>
        </select>
      </div>

      {/* Members Table (Desktop View) */}
      <div className="table-container desktop-only">
        <table className="data-table">
          <thead>
            <tr>
              <th>Membership ID</th>
              <th>Member Name</th>
              <th>National ID</th>
              <th>Contact Details</th>
              <th>Category</th>
              <th>Status</th>
              <th>Date Joined</th>
              <th>Monthly Dues</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No members found matching your search criteria.
                </td>
              </tr>
            ) : (
              filteredMembers.map(member => (
                <tr key={member.id}>
                  <td>
                    <span className="code-badge">{member.membershipNumber}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.88rem' }}>{member.fullName}</strong>
                  </td>
                  <td>{member.nationalId}</td>
                  <td>
                    <div style={{ fontSize: '0.78rem' }}>{member.phone}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.email}</div>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                      {member.category.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill pill-${member.status}`}>
                      <span className="status-dot" />
                      {member.status}
                    </span>
                  </td>
                  <td>{member.dateJoined}</td>
                  <td>
                    <strong>{settings.currency} {member.monthlyCommitment.toLocaleString()}</strong>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="View Full Profile"
                        onClick={() => setSelectedMember(member)}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Edit Details"
                        onClick={() => setEditingMember(member)}
                      >
                        <Edit size={13} />
                      </button>
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
        {filteredMembers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No members found matching your search criteria.
          </div>
        ) : (
          filteredMembers.map(member => (
            <div key={member.id} className="mobile-record-card">
              <div className="mobile-card-header">
                <div>
                  <span className="code-badge">{member.membershipNumber}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '6px' }}>Nat ID: {member.nationalId}</span>
                </div>
                <span className={`status-pill pill-${member.status}`}>
                  <span className="status-dot" />
                  {member.status}
                </span>
              </div>

              <div className="mobile-card-main">
                <div>
                  <div className="mobile-card-title">{member.fullName}</div>
                  <div className="mobile-card-subtitle">
                    {member.phone} · {member.category.replace('_', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="mobile-card-amount">
                  {settings.currency} {member.monthlyCommitment.toLocaleString()}
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>per month</div>
                </div>
              </div>

              <div className="mobile-card-grid">
                <div>
                  <div className="mobile-card-grid-item-label">Joined</div>
                  <div className="mobile-card-grid-item-value">{member.dateJoined}</div>
                </div>
                <div>
                  <div className="mobile-card-grid-item-label">Email</div>
                  <div className="mobile-card-grid-item-value">{member.email || 'N/A'}</div>
                </div>
              </div>

              <div className="mobile-card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedMember(member)}
                >
                  <Eye size={15} />
                  <span>View Profile</span>
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditingMember(member)}
                >
                  <Edit size={15} />
                  <span>Edit Details</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create New Member (MEM-01 & MEM-05) */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleCreateSubmit}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Register New Welfare Member</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PRD 4.1: Assign unique membership number with automated duplicate prevention
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsCreateOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                {duplicateWarning && (
                  <div className="notice-banner notice-warning" style={{ marginBottom: '16px' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <div>{duplicateWarning}</div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Kipchoge Keino"
                      value={formData.fullName}
                      onChange={e => handleFieldChange('fullName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">National ID Number *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. 29482910"
                      value={formData.nationalId}
                      onChange={e => handleFieldChange('nationalId', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      placeholder="+254 7XX XXX XXX"
                      value={formData.phone}
                      onChange={e => handleFieldChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="member@example.com"
                      value={formData.email}
                      onChange={e => handleFieldChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Membership Category</label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => handleFieldChange('category', e.target.value)}
                    >
                      <option value="full_member">Full Member (Default)</option>
                      <option value="associate">Associate Member</option>
                      <option value="senior">Senior Citizen Member</option>
                      <option value="youth">Youth / Student Tier</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Commitment ({settings.currency})</label>
                    <input
                      type="number"
                      className="form-input"
                      value={formData.monthlyCommitment}
                      onChange={e => handleFieldChange('monthlyCommitment', e.target.value)}
                    />
                  </div>
                </div>

                <h4 style={{ fontSize: '0.88rem', margin: '14px 0 10px', color: 'var(--text-main)' }}>
                  Beneficiary / Next of Kin (PRD 4.1)
                </h4>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Next of Kin Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Beatrice Chebet"
                      value={formData.kinName}
                      onChange={e => handleFieldChange('kinName', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Relationship</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Spouse, Sibling, Child"
                      value={formData.kinRelation}
                      onChange={e => handleFieldChange('kinRelation', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Next of Kin Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+254 7XX XXX XXX"
                    value={formData.kinPhone}
                    onChange={e => handleFieldChange('kinPhone', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Officer Notes</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="Reference notes, sponsor, or registration remarks..."
                    value={formData.notes}
                    onChange={e => handleFieldChange('notes', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Member Profile (MEM-02 & MEM-06) */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="code-badge" style={{ fontSize: '0.85rem' }}>
                  {selectedMember.membershipNumber}
                </span>
                <h3 className="modal-title">{selectedMember.fullName}</h3>
                <span className={`status-pill pill-${selectedMember.status}`}>
                  <span className="status-dot" />
                  {selectedMember.status}
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMember(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member Details</div>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>National ID:</strong> {selectedMember.nationalId}</div>
                    <div><strong>Phone:</strong> {selectedMember.phone}</div>
                    <div><strong>Email:</strong> {selectedMember.email}</div>
                    <div><strong>Tier:</strong> {selectedMember.category.replace('_', ' ')}</div>
                    <div><strong>Joined Date:</strong> {selectedMember.dateJoined}</div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next of Kin / Beneficiary</div>
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
                    <div><strong>Name:</strong> {selectedMember.nextOfKin?.name || 'Not provided'}</div>
                    <div><strong>Relationship:</strong> {selectedMember.nextOfKin?.relationship || 'N/A'}</div>
                    <div><strong>Contact:</strong> {selectedMember.nextOfKin?.phone || 'N/A'}</div>
                    <div><strong>Monthly Dues:</strong> {settings.currency} {selectedMember.monthlyCommitment.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Balance Summary */}
              {(() => {
                const bal = StorageService.calculateMemberBalance(selectedMember.id);
                return (
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Total Contributed Records</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                          {settings.currency} {bal.totalPaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Verified with Treasury</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                          {settings.currency} {bal.verifiedPaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>Pending Verification</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                          {settings.currency} {bal.pendingVerification.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedMember.notes && (
                <div style={{ marginTop: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Notes:</strong> {selectedMember.notes}
                </div>
              )}

              {/* Administrator Role Authority Assignment & Delegation (Secretary, Finance, Welfare, etc.) */}
              {(() => {
                const currentUser = StorageService.getCurrentUser();
                const canManageRoles = userRole === 'admin' || currentUser.canAssignRoles;
                if (!canManageRoles) return null;

                const users = StorageService.getUsers();
                const matchedUser = users.find(u => u.linkedMemberId === selectedMember.id || (u.email && u.email.toLowerCase() === selectedMember.email?.toLowerCase()));
                const currentRole = matchedUser ? matchedUser.role : 'member';
                const hasDelegatedPower = matchedUser ? !!matchedUser.canAssignRoles : false;

                return (
                  <div style={{ marginTop: '16px', padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Shield size={14} style={{ color: 'var(--primary)' }} />
                        Appoint / Assign Officer Role
                      </strong>
                      <span className="badge-count" style={{ background: 'var(--primary)', color: '#fff', fontSize: '0.68rem', padding: '2px 8px' }}>
                        Current: {currentRole.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                      <select
                        value={currentRole}
                        onChange={(e) => {
                          const newR = e.target.value as UserRole;
                          if (matchedUser) {
                            StorageService.assignUserRole(matchedUser.id, newR, matchedUser.canAssignRoles);
                          } else {
                            const newU = {
                              id: `USR-${selectedMember.id}`,
                              name: selectedMember.fullName,
                              email: selectedMember.email || `${selectedMember.phone}@solianwolves.org`,
                              phone: selectedMember.phone,
                              role: newR,
                              roles: [newR],
                              avatar: selectedMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                              linkedMemberId: selectedMember.id,
                              isActive: true,
                              lastLogin: 'Just now'
                            };
                            StorageService.saveUsers([...users, newU]);
                          }
                          setSelectedMember({ ...selectedMember });
                          alert(`Appointed ${selectedMember.fullName} as ${newR.replace('_', ' ').toUpperCase()}!`);
                        }}
                        style={{ padding: '7px 10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem', flex: 1 }}
                      >
                        <option value="member">👤 Welfare Member</option>
                        <option value="secretary">📋 Executive Secretary</option>
                        <option value="finance_officer">💰 Finance Officer (Treasurer)</option>
                        <option value="welfare_officer">🤝 Welfare Officer</option>
                        <option value="approver">⚖️ Welfare Approver (Trustee)</option>
                        <option value="admin">🛡️ Administrator</option>
                        <option value="auditor">🔍 Independent Auditor</option>
                      </select>
                    </div>

                    {/* Admin Delegation: Grant other members the power to assign roles */}
                    {userRole === 'admin' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '6px' }}>
                        <input
                          type="checkbox"
                          checked={hasDelegatedPower}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            if (matchedUser) {
                              StorageService.assignUserRole(matchedUser.id, matchedUser.role, checked);
                            } else {
                              const newU = {
                                id: `USR-${selectedMember.id}`,
                                name: selectedMember.fullName,
                                email: selectedMember.email || `${selectedMember.phone}@solianwolves.org`,
                                phone: selectedMember.phone,
                                role: currentRole,
                                roles: [currentRole],
                                canAssignRoles: checked,
                                avatar: selectedMember.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                                linkedMemberId: selectedMember.id,
                                isActive: true,
                                lastLogin: 'Just now'
                              };
                              StorageService.saveUsers([...users, newU]);
                            }
                            setSelectedMember({ ...selectedMember });
                            alert(checked ? `Granted role assignment authority to ${selectedMember.fullName}!` : `Revoked role assignment authority from ${selectedMember.fullName}.`);
                          }}
                        />
                        <span>Grant this member authority to assign and manage roles</span>
                      </label>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const m = selectedMember;
                  setSelectedMember(null);
                  setEditingMember(m);
                }}
              >
                <Edit size={14} />
                <span>Edit Profile</span>
              </button>
              <button className="btn btn-primary" onClick={() => setSelectedMember(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Member */}
      {editingMember && (
        <div className="modal-overlay" onClick={() => setEditingMember(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">Edit Member: {editingMember.fullName}</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditingMember(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={editingMember.fullName}
                    onChange={e => setEditingMember({ ...editingMember, fullName: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      required
                      className="form-input"
                      value={editingMember.phone}
                      onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={editingMember.email}
                      onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={editingMember.status}
                      onChange={e => setEditingMember({ ...editingMember, status: e.target.value as MemberStatus })}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending Approval</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={editingMember.category}
                      onChange={e => setEditingMember({ ...editingMember, category: e.target.value as MemberCategory })}
                    >
                      <option value="full_member">Full Member</option>
                      <option value="associate">Associate</option>
                      <option value="senior">Senior</option>
                      <option value="youth">Youth</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Internal Notes</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    value={editingMember.notes || ''}
                    onChange={e => setEditingMember({ ...editingMember, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setEditingMember(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
