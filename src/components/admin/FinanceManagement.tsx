import React, { useState } from 'react';
import {
  DollarSign,
  Search,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Download,
  ShieldAlert,
  X,
  CreditCard
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { FinancialTransaction, TransactionType, PaymentMethod, OrganizationSettings, UserRole } from '../../types';

interface FinanceManagementProps {
  settings: OrganizationSettings;
  userRole: UserRole;
}

export const FinanceManagement: React.FC<FinanceManagementProps> = ({ settings, userRole }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(StorageService.getFinancialTransactions());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expenditure' as TransactionType,
    category: 'Administrative Operations',
    amount: 1000,
    description: '',
    reference: '',
    paymentMode: 'bank_transfer' as PaymentMethod
  });

  const refreshData = () => {
    setTransactions(StorageService.getFinancialTransactions());
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.reference || !formData.description) {
      alert('Please fill all required transaction fields.');
      return;
    }

    StorageService.createManualTransaction({
      date: formData.date,
      type: formData.type,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      reference: formData.reference,
      paymentMode: formData.paymentMode
    });

    refreshData();
    setIsAddOpen(false);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expenditure',
      category: 'Administrative Operations',
      amount: 1000,
      description: '',
      reference: '',
      paymentMode: 'bank_transfer'
    });
  };

  const handleExportCSV = () => {
    const headers = ['Txn ID', 'Date', 'Type', 'Category', 'Amount', 'Reference', 'Mode', 'Description', 'Recorded By', 'Reconciled'];
    const rows = filteredTxns.map(t => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      `"${t.category}"`,
      t.amount,
      t.reference,
      t.paymentMode,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.recordedBy}"`,
      t.isReconciled ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Solian_Wolves_Financial_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTxns = transactions.filter(t => {
    const matchesSearch =
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.reference.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIncome = filteredTxns
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenditure = filteredTxns
    .filter(t => t.type === 'expenditure')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpenditure;

  const canRecord = ['admin', 'finance_officer'].includes(userRole);

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Financial Ledger & Transactions</h2>
          <p>PRD 4.4: Record income, welfare disbursements, operating expenditures, and reconciliation status</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export Ledger CSV</span>
          </button>
          {canRecord && (
            <button className="btn btn-primary" onClick={() => setIsAddOpen(true)}>
              <Plus size={15} />
              <span>Record Transaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Accounting Notice */}
      <div className="notice-banner notice-info">
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Accounting Boundary Definition (PRD 4.4):</strong> The system records operational income and expenditure. Formal audited financial statements, multi-currency assets, and automated direct bank integrations are subject to client accounting policy confirmation.
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '22px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Operational Income</span>
            <ArrowDownRight size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {settings.currency} {totalIncome.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Total Operational Outflow</span>
            <ArrowUpRight size={18} color="var(--danger)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', marginTop: '4px' }}>
            {settings.currency} {totalExpenditure.toLocaleString()}
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            <span>Net Operational Balance</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: netBalance >= 0 ? 'var(--primary)' : 'var(--danger)', marginTop: '4px' }}>
            {settings.currency} {netBalance.toLocaleString()}
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
            placeholder="Search transactions by reference, description or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto', minWidth: '160px' }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="income">Income Only (+)</option>
          <option value="expenditure">Expenditure Only (-)</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Reference / Slip</th>
              <th>Mode</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Reconciliation</th>
            </tr>
          </thead>
          <tbody>
            {filteredTxns.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No financial ledger entries found.
                </td>
              </tr>
            ) : (
              filteredTxns.map(t => (
                <tr key={t.id}>
                  <td>
                    <span className="code-badge">{t.id}</span>
                  </td>
                  <td>{t.date}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: t.type === 'income' ? 'var(--success)' : '#f87171'
                      }}
                    >
                      {t.type === 'income' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                      {t.type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.category}</span>
                    {t.linkedWelfareRequestId && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '2px' }}>
                        Linked: {t.linkedWelfareRequestId}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="code-badge">{t.reference}</span>
                  </td>
                  <td>
                    <span style={{ textTransform: 'uppercase', fontSize: '0.74rem' }}>{t.paymentMode}</span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', maxWidth: '280px', lineHeight: 1.4 }}>{t.description}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      By: {t.recordedBy}
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: '0.9rem', color: t.type === 'income' ? 'var(--success)' : '#f87171' }}>
                      {t.type === 'income' ? '+' : '-'}{settings.currency} {t.amount.toLocaleString()}
                    </strong>
                  </td>
                  <td>
                    {t.isReconciled ? (
                      <span className="status-pill pill-verified" title={t.reconciledAt}>
                        <CheckCircle2 size={12} />
                        Reconciled
                      </span>
                    ) : (
                      <span className="status-pill pill-recorded">
                        <Clock size={12} />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Record Manual Transaction (FIN-01 & FIN-02) */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Record Financial Transaction</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    PRD 4.4 FIN-01: Log non-welfare expenditure or miscellaneous income
                  </p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsAddOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Transaction Flow *</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as TransactionType })}
                    >
                      <option value="expenditure">Expenditure Outflow (-)</option>
                      <option value="income">Income Inflow (+)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
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
                    <label className="form-label">Payment Mode *</label>
                    <select
                      className="form-select"
                      value={formData.paymentMode}
                      onChange={e => setFormData({ ...formData, paymentMode: e.target.value as PaymentMethod })}
                    >
                      <option value="bank_transfer">Bank Transfer / EFT</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="cheque">Bank Cheque</option>
                      <option value="cash">Petty Cash</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Administrative Operations, Legal & Audit, Meeting Refreshments..."
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Voucher / Cheque / Bank Reference *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. CHQ-00193 or EFT-REF-8910"
                    value={formData.reference}
                    onChange={e => setFormData({ ...formData, reference: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description & Business Purpose *</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    placeholder="State the purpose and authorized beneficiary of the transaction..."
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
