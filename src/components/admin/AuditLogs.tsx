import React, { useState } from 'react';
import {
  History,
  Search,
  Shield,
  Download,
  Filter,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { AuditLog } from '../../types';

export const AuditLogs: React.FC = () => {
  const [logs] = useState<AuditLog[]>(StorageService.getAuditLogs());
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId.toLowerCase().includes(search.toLowerCase());

    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Description'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      l.userRole,
      l.action,
      l.entityType,
      l.entityId,
      `"${l.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solian_Wolves_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Immutable Security & Operational Audit Log</h2>
          <p>PRD 4.5 ADM-05 & NFR-05: Non-repudiation log of member changes, payment reversals, approvals, and disbursement actions</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export Audit Trail CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            className="form-input"
            placeholder="Search audit trail by officer, action, or entity ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '180px' }}
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
        >
          <option value="all">All Entity Domains</option>
          <option value="contribution">Contributions & Reversals</option>
          <option value="welfare_request">Welfare Application & Decisions</option>
          <option value="member">Member Profiles</option>
          <option value="financial_transaction">Treasury Transactions</option>
          <option value="system_setting">Configuration Settings</option>
        </select>
      </div>

      {/* Log Feed Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Authorized Officer</th>
              <th>Action Code</th>
              <th>Domain</th>
              <th>Target Entity</th>
              <th>Audit Narrative</th>
              <th>State Transition</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No audit events found.
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{log.timestamp}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{log.id}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} color="var(--primary)" />
                      <div>
                        <strong style={{ fontSize: '0.84rem' }}>{log.userName}</strong>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {log.userRole.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="code-badge" style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}>
                      {log.entityType.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className="code-badge">{log.entityId}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', maxWidth: '320px', lineHeight: 1.4 }}>
                      {log.description}
                    </div>
                  </td>
                  <td>
                    {log.previousValue || log.newValue ? (
                      <div style={{ fontSize: '0.74rem', background: 'var(--bg-elevated)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}>
                        {log.previousValue && <div style={{ color: '#f87171' }}>- {log.previousValue}</div>}
                        {log.newValue && <div style={{ color: 'var(--success)' }}>+ {log.newValue}</div>}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Direct Operation</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
