import React from 'react';
import { X, CheckCircle2, Shield, User, DollarSign, HeartHandshake, UserCheck } from 'lucide-react';
import { UserAccount, UserRole } from '../types';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  currentUser: UserAccount;
  onSelectUser: (user: UserAccount) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSelectUser
}) => {
  if (!isOpen) return null;

  const roleDescriptions: Record<UserRole, { title: string; desc: string; icon: any }> = {
    admin: {
      title: 'Administrator',
      desc: 'Full system privileges: manages user accounts, organizational settings, and all operational modules.',
      icon: Shield
    },
    welfare_officer: {
      title: 'Welfare Officer',
      desc: 'Member care: creates & updates member profiles, performs document checks, and records incoming payments.',
      icon: HeartHandshake
    },
    finance_officer: {
      title: 'Finance Officer (Treasurer)',
      desc: 'Financial controls: verifies recorded payments against bank statements, records expenditures, and disburses approved assistance.',
      icon: DollarSign
    },
    approver: {
      title: 'Executive Approver',
      desc: 'Governance: reviews member assistance claims, evaluates eligibility against bylaws, and casts formal approval/rejection decisions.',
      icon: UserCheck
    },
    member: {
      title: 'Welfare Member',
      desc: 'Member portal access: submits assistance applications, tracks request timeline, and views personal contribution statements.',
      icon: User
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Role-Based Access Control (RBAC) Switcher</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Test PRD Section 5 permissions matrix with realistic authorized personas
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="notice-banner notice-info" style={{ marginBottom: '18px' }}>
            <div>
              <strong>Multi-Role Permission Simulation:</strong> Selecting a persona instantly switches your identity, navigation views, and operational authorization across the system.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {users.map(u => {
              const roleInfo = roleDescriptions[u.role] || { title: u.role, desc: '', icon: User };
              const Icon = roleInfo.icon;
              const isSelected = u.id === currentUser.id;

              return (
                <div
                  key={u.id}
                  onClick={() => {
                    onSelectUser(u);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--primary-light)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                      src={u.avatar}
                      alt={u.name}
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-medium)'
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {u.name}
                        </span>
                        <span className="code-badge" style={{ fontSize: '0.7rem' }}>
                          {roleInfo.title}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {roleInfo.desc}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {u.department} · {u.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="status-pill pill-active">
                        <CheckCircle2 size={13} />
                        Active Persona
                      </span>
                    ) : (
                      <button className="btn btn-secondary btn-sm">
                        Switch To
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
