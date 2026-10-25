import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  FileText,
  DollarSign,
  TrendingUp,
  PieChart,
  ShieldCheck
} from 'lucide-react';
import { StorageService } from '../../services/storageService';
import { OrganizationSettings } from '../../types';

interface ReportsAnalyticsProps {
  settings: OrganizationSettings;
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ settings }) => {
  const [period, setPeriod] = useState<'all' | '2026_q4' | '2026_october'>('all');
  const [reportType, setReportType] = useState<'financial' | 'contributions' | 'welfare'>('financial');

  const stats = StorageService.getSystemStats();
  const contributions = StorageService.getContributions();
  const requests = StorageService.getWelfareRequests();
  const transactions = StorageService.getFinancialTransactions();
  const members = StorageService.getMembers();

  // Category aggregates
  const contributionsByCategory: Record<string, number> = {};
  for (const c of contributions) {
    if (c.status !== 'reversed') {
      contributionsByCategory[c.category] = (contributionsByCategory[c.category] || 0) + c.amount;
    }
  }

  const welfareByCategory: Record<string, { count: number; total: number }> = {};
  for (const r of requests) {
    if (!welfareByCategory[r.category]) {
      welfareByCategory[r.category] = { count: 0, total: 0 };
    }
    welfareByCategory[r.category].count += 1;
    welfareByCategory[r.category].total += (r.amountApproved || r.amountRequested);
  }

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (reportType === 'financial') {
      headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Reference', 'Amount', 'Reconciled'];
      rows = transactions.map(t => [t.id, t.date, t.type, `"${t.category}"`, t.reference, t.amount, t.isReconciled]);
      filename = `Solian_Wolves_Financial_Statement_${period}.csv`;
    } else if (reportType === 'contributions') {
      headers = ['Record ID', 'Member', 'Date', 'Amount', 'Category', 'Reference', 'Status'];
      rows = contributions.map(c => [c.id, `"${c.memberName}"`, c.paymentDate, c.amount, c.category, c.referenceNumber, c.status]);
      filename = `Solian_Wolves_Contributions_Summary_${period}.csv`;
    } else {
      headers = ['Request ID', 'Member', 'Date', 'Category', 'Amount Requested', 'Amount Approved', 'Status'];
      rows = requests.map(r => [r.id, `"${r.memberName}"`, r.submissionDate, r.category, r.amountRequested, r.amountApproved || 0, r.status]);
      filename = `Solian_Wolves_Welfare_Assistance_${period}.csv`;
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-content">
      {/* Official Print Header */}
      <div className="print-only" style={{ marginBottom: '24px', borderBottom: '2px solid #000', paddingBottom: '12px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{settings.orgName}</h1>
        <p style={{ fontSize: '0.85rem' }}>Registration No: {settings.registrationNumber} · {settings.address}</p>
        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
          <strong>Official Operational Financial Report</strong> — Generated on {new Date().toLocaleString()}
        </p>
      </div>

      {/* Screen Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h2>Operational & Financial Reports</h2>
          <p>PRD 4.6: Aggregated statements, category distribution, and printable executive summaries</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={handlePrint}>
            <Printer size={15} />
            <span>Print Report (PDF)</span>
          </button>
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="filter-bar" style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Report Type:</span>
          <button
            onClick={() => setReportType('financial')}
            className={`btn btn-sm ${reportType === 'financial' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Financial Summary
          </button>
          <button
            onClick={() => setReportType('contributions')}
            className={`btn btn-sm ${reportType === 'contributions' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Contributions Breakdown
          </button>
          <button
            onClick={() => setReportType('welfare')}
            className={`btn btn-sm ${reportType === 'welfare' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Welfare Assistance Log
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={15} color="var(--text-muted)" />
          <select
            className="form-select"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
          >
            <option value="all">All-Time Records</option>
            <option value="2026_q4">Fourth Quarter 2026 (Oct - Dec)</option>
            <option value="2026_october">Current Month (October 2026)</option>
          </select>
        </div>
      </div>

      {/* High-level Summary Sheet */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">Executive Summary Statement</h3>
            <p className="card-subtitle">Solian Wolves Welfare Association · Reporting Period: {period.toUpperCase()}</p>
          </div>
          <span className="status-pill pill-verified">
            <ShieldCheck size={13} />
            Audit Traceable
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Members</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>{stats.activeMembers} / {stats.totalMembers}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>100% recorded in registry</div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Inflow</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
              {settings.currency} {stats.totalVerifiedIncome.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Reconciled with Treasury</div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Disbursed Relief</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171', marginTop: '2px' }}>
              {settings.currency} {stats.disbursedRequestsTotal.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{requests.filter(r => r.status === 'disbursed').length} cases executed</div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operating Reserve</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
              {settings.currency} {stats.operationalBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>System calculated net balance</div>
          </div>
        </div>

        {/* Detailed Breakdown Tables based on Active Report Tab */}
        {reportType === 'financial' && (
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-main)' }}>
              Operational Transactions Statement
            </h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>ID</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td><span className="code-badge">{t.id}</span></td>
                      <td style={{ fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : '#f87171' }}>
                        {t.type.toUpperCase()}
                      </td>
                      <td>{t.category}</td>
                      <td><span className="code-badge">{t.reference}</span></td>
                      <td>{t.description}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: t.type === 'income' ? 'var(--success)' : '#f87171' }}>
                        {t.type === 'income' ? '+' : '-'}{settings.currency} {t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'contributions' && (
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-main)' }}>
              Contributions Aggregated by Category
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              {Object.entries(contributionsByCategory).map(([cat, total]) => (
                <div key={cat} style={{ background: 'var(--bg-elevated)', padding: '14px 18px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {cat.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                    {settings.currency} {total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'welfare' && (
          <div>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--text-main)' }}>
              Welfare Assistance Case Disbursements
            </h4>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Claim ID</th>
                    <th>Recipient</th>
                    <th>Category</th>
                    <th>Urgency</th>
                    <th>Requested</th>
                    <th>Sanctioned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id}>
                      <td><span className="code-badge">{r.id}</span></td>
                      <td><strong>{r.memberName}</strong></td>
                      <td style={{ textTransform: 'capitalize' }}>{r.category.replace('_', ' ')}</td>
                      <td>{r.urgency}</td>
                      <td>{settings.currency} {r.amountRequested.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {settings.currency} {(r.amountApproved || 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-pill pill-${r.status}`}>{r.status.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Official Signatures Box for Printouts */}
      <div className="print-only" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
        <div>
          <p>Prepared by: _____________________________</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>Treasurer / Finance Officer</p>
        </div>
        <div>
          <p>Approved by: _____________________________</p>
          <p style={{ marginTop: '4px', fontSize: '0.8rem' }}>Chairman / Executive Committee</p>
        </div>
      </div>
    </div>
  );
};
