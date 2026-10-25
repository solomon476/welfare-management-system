/**
 * Solian Wolves WMS - Backend API Service
 * Handles communication with the FastAPI backend.
 * Falls back gracefully to StorageService if the backend is not reachable.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface BackendHealthResponse {
  status: string;
  timestamp: string;
  database: string;
}

export interface TreasuryAuditResponse {
  status: string;
  currency: string;
  calculation_formula: string;
  summary: {
    opening_reserve: number;
    verified_contributions: number;
    unverified_pending_contributions: number;
    disputed_or_reversed_contributions: number;
    other_income: number;
    welfare_disbursed: number;
    operational_expenses: number;
    reconciled_cash_balance: number;
    is_positive: boolean;
    unreconciled_variance: number;
  };
  treasury_breakdown_items: Array<{
    label: string;
    amount: number;
    type: 'credit' | 'debit';
  }>;
}

export class ApiService {
  private static isBackendAvailable: boolean | null = null;

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
   * Fetches real-time treasury reconciliation from FastAPI backend
   */
  static async getTreasuryReconciliation(): Promise<TreasuryAuditResponse | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/finance/reconciliation`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('FastAPI backend not reachable for reconciliation, using local fallback:', e);
      return null;
    }
  }

  /**
   * Fetches real-time system stats from FastAPI backend
   */
  static async getStats(): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('FastAPI backend not reachable for stats:', e);
      return null;
    }
  }

  /**
   * Fetches members register from FastAPI backend
   */
  static async getMembers(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/members`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches contributions ledger from FastAPI backend
   */
  static async getContributions(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contributions`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /**
   * Fetches welfare requests from FastAPI backend
   */
  static async getWelfareRequests(): Promise<any[] | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/welfare`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
