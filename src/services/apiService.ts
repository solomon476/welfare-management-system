/**
 * Solian Wolves WMS - Backend API Service
 * Handles communication with the FastAPI modular monolith backend.
 * Connects to versioned /api/v1/ endpoints and falls back gracefully to StorageService if offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  database: string;
  currency: string;
}

export interface TreasuryAuditResponse {
  status: string;
  currency: string;
  calculation_formula: string;
  opening_reserve: number;
  verified_contributions: number;
  unverified_pending_contributions: number;
  disputed_or_reversed_contributions: number;
  other_income: number;
  welfare_disbursed: number;
  operational_expenses: number;
  reconciled_cash_balance: number;
  is_positive: boolean;
  flag_negative_balance: boolean;
  audit_warning: string | null;
  breakdown_items: Array<{
    label: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
}

export class ApiService {
  private static isBackendAvailable: boolean | null = null;
  private static token: string | null = localStorage.getItem('sw_auth_token');

  static setAuthToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('sw_auth_token', token);
    } else {
      localStorage.removeItem('sw_auth_token');
    }
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Probes backend health status
   */
  static async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      const ok = res.ok;
      this.isBackendAvailable = ok;
      return ok;
    } catch {
      this.isBackendAvailable = false;
      return false;
    }
  }

  /**
   * Fetches audited treasury reconciliation from FastAPI backend (/api/v1/treasury/reconciliation)
   */
  static async getTreasuryReconciliation(): Promise<TreasuryAuditResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/treasury/reconciliation`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('FastAPI backend not reachable for reconciliation, using local fallback:', e);
      return null;
    }
  }

  /**
   * Fetches real-time system summary stats (/api/v1/reports/summary)
   */
  static async getStats(): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/summary`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('FastAPI backend not reachable for stats:', e);
      return null;
    }
  }

  /**
   * Fetches paginated members register (/api/v1/members)
   */
  static async getMembers(skip: number = 0, limit: number = 50, search?: string): Promise<any | null> {
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      if (search) params.append('search', search);
      const res = await fetch(`${API_BASE_URL}/api/v1/members?${params.toString()}`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches contributions ledger (/api/v1/contributions)
   */
  static async getContributions(skip: number = 0, limit: number = 50, memberId?: string): Promise<any | null> {
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      if (memberId) params.append('member_id', memberId);
      const res = await fetch(`${API_BASE_URL}/api/v1/contributions?${params.toString()}`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches welfare requests (/api/v1/welfare)
   */
  static async getWelfareRequests(skip: number = 0, limit: number = 50, memberId?: string): Promise<any | null> {
    try {
      const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
      if (memberId) params.append('member_id', memberId);
      const res = await fetch(`${API_BASE_URL}/api/v1/welfare?${params.toString()}`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Member financial statement
   */
  static async getMemberStatement(memberId: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/reports/member-statement/${memberId}`, { headers: this.getHeaders() });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
