/**
 * Service Types
 * Definitions for service catalog, vehicle services, and related data
 */

import type { Mechanic } from './mechanic';
import type { PartUsage } from './part';

// ---------------------------------------------------------------------------
// Service Status
// ---------------------------------------------------------------------------

export type ServiceStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

// ---------------------------------------------------------------------------
// Service Catalog
// ---------------------------------------------------------------------------

export interface ServiceCatalog {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  base_price: number;
  category?: string;
}

// ---------------------------------------------------------------------------
// Vehicle Service
// ---------------------------------------------------------------------------

export interface VehicleService {
  id: number;
  uuid: string;
  vehicle_id: number;
  service: ServiceCatalog;
  mechanic: Mechanic;
  status: ServiceStatus;
  service_date: string;
  hours_worked?: number;
  labor_cost: number;
  notes?: string;
  parts?: PartUsage[];
  total_cost: number;
  approval_status: ApprovalStatus;
  created_at: string;
}
