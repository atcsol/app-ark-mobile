/**
 * Seller Types
 * Definitions for seller profiles, dashboard stats, and sales
 */

// ---------------------------------------------------------------------------
// Seller
// ---------------------------------------------------------------------------

export interface Seller {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  commission_percentage: number;
  total_sales?: number;
  total_commission?: number;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export interface SellerDashboardStats {
  total_sales_count: number;
  total_sales_value: number;
  total_commission: number;
  avg_commission_percentage: number;
  pending_vehicles_count: number;
}

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

export type SaleStatus = 'pending' | 'completed' | 'cancelled';

export interface SaleFormData {
  vehicle_id: number;
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_cpf_cnpj?: string;
  sale_value: number;
  payment_method?: string;
  notes?: string;
}

export interface Sale {
  id: number;
  uuid: string;
  vehicle: {
    id: number;
    uuid: string;
    full_name: string;
    vin_number: string;
  };
  buyer_name: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_cpf_cnpj?: string;
  sale_value: number;
  commission_percentage: number;
  commission_amount: number;
  status: SaleStatus;
  sale_date: string;
  created_at: string;
  updated_at: string;
}
