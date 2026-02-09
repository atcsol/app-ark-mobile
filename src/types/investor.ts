/**
 * Investor Types
 * Definitions for investor profiles, dashboard stats, and notifications
 */

// ---------------------------------------------------------------------------
// Investor
// ---------------------------------------------------------------------------

export interface Investor {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  cpf_cnpj?: string;
  total_invested?: number;
  total_returned?: number;
  active_investments?: number;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface InvestorDashboardStats {
  total_vehicles: number;
  active_investments: number;
  completed_investments: number;
  total_invested: number;
  total_returned: number;
  pending_return: number;
  roi: number;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface InvestorNotification {
  id: number | string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read_at?: string | null;
  created_at: string;
}
