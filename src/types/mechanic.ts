/**
 * Mechanic Types
 * Definitions for mechanic profiles and dashboard stats
 */

// ---------------------------------------------------------------------------
// Mechanic
// ---------------------------------------------------------------------------

export interface Mechanic {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  hourly_rate?: number;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface MechanicDashboardStats {
  total_services: number;
  completed_services: number;
  pending_services: number;
  in_progress_services: number;
  total_hours: number;
  total_labor_cost: number;
}
