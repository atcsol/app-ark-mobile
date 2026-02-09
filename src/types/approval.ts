/**
 * Approval Types
 * Definitions for the multi-type approval workflow
 */

// ---------------------------------------------------------------------------
// Approval
// ---------------------------------------------------------------------------

export type ApprovalType = 'services' | 'parts' | 'sales';

export type ApprovalItemStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: number;
  uuid: string;
  type: ApprovalType;
  item: Record<string, unknown>;
  status: ApprovalItemStatus;
  requested_by: {
    id: number;
    name: string;
  };
  approved_by?: {
    id: number;
    name: string;
  } | null;
  rejection_reason?: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Approval Stats (for admin dashboard badges / counters)
// ---------------------------------------------------------------------------

export interface ApprovalStats {
  pending_services: number;
  pending_parts: number;
  pending_sales: number;
  total_pending: number;
}
