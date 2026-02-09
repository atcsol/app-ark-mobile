/**
 * Vehicle Types
 * Definitions for vehicles, images, investments, and related data
 */

import type { VehicleService } from './service';

// ---------------------------------------------------------------------------
// Vehicle Status
// ---------------------------------------------------------------------------

export type VehicleStatus =
  | 'in_analysis'
  | 'in_repair'
  | 'ready'
  | 'for_sale'
  | 'sold';

// ---------------------------------------------------------------------------
// Vehicle Image
// ---------------------------------------------------------------------------

export interface VehicleImage {
  id: string;
  filename: string;
  url: string;
  thumbnail?: string;
  is_primary: boolean;
  uploaded_at: string;
}

// ---------------------------------------------------------------------------
// Investment Info (inline for vehicle context)
// ---------------------------------------------------------------------------

export interface InvestmentInfo {
  amount: number;
  commission_percentage: number;
  commission_amount: number;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Vehicle
// ---------------------------------------------------------------------------

export interface Vehicle {
  id: number;
  uuid: string;
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  full_name: string;
  color?: string;
  mileage?: number;
  status: VehicleStatus;
  purchase_value: number;
  sale_value?: number;
  purchase_date?: string;
  sale_date?: string;
  notes?: string;
  images?: VehicleImage[];
  investor?: {
    id: string;
    name: string;
    investment: InvestmentInfo;
  };
  seller?: {
    name: string;
    commission: number;
  };
  services?: VehicleService[];
  costs?: {
    services: number;
    parts: number;
    total: number;
  };
  profit?: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Vehicle Form
// ---------------------------------------------------------------------------

export interface VehicleFormData {
  vin_number: string;
  brand: string;
  model: string;
  year: number;
  color?: string;
  mileage?: number;
  purchase_value: number;
  purchase_date: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Vehicle Sale Form
// ---------------------------------------------------------------------------

export interface VehicleSaleFormData {
  sale_value: number;
  sale_date: string;
  seller_id?: string;
  seller_commission_percentage?: number;
}

// ---------------------------------------------------------------------------
// Vehicle Assigned Seller
// ---------------------------------------------------------------------------

export interface VehicleAssignedSeller {
  id: string;
  uuid: string;
  name: string;
  email?: string;
  commission_percentage?: number;
  assigned_at?: string;
}

// ---------------------------------------------------------------------------
// Vehicle Sellers Response
// ---------------------------------------------------------------------------

export interface VehicleSellersResponse {
  assigned_sellers: VehicleAssignedSeller[];
  available_to_all_sellers: boolean;
}
