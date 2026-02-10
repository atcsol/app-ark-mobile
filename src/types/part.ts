/**
 * Part Types
 * Definitions for parts inventory and usage tracking
 */

// ---------------------------------------------------------------------------
// Part (Inventory Item)
// ---------------------------------------------------------------------------

export interface Category {
  id: string;
  name: string;
  slug?: string;
  color?: string;
  icon?: string;
  active?: boolean;
  sort_order?: number;
  parts_count?: number;
  services_count?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug?: string;
  type?: 'vehicle' | 'part' | 'both';
  logo_url?: string;
  active?: boolean;
  sort_order?: number;
  vehicles_count?: number;
  parts_count?: number;
}

export interface PartCompatibility {
  id: number;
  brand: { id: string; name: string };
  model?: string;
  year_from?: number;
  year_to?: number;
  notes?: string;
}

export interface Part {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  part_number?: string;
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
  category_id?: string;
  category?: Category;
  brand_id?: string;
  brand?: Brand;
}

// ---------------------------------------------------------------------------
// Part Usage (linked to a vehicle service)
// ---------------------------------------------------------------------------

export interface PartUsage {
  id: number;
  part: Part;
  quantity: number;
  unit_price: number;
  total_price: number;
}
