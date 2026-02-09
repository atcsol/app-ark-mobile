/**
 * Part Types
 * Definitions for parts inventory and usage tracking
 */

// ---------------------------------------------------------------------------
// Part (Inventory Item)
// ---------------------------------------------------------------------------

export interface Part {
  id: number;
  uuid: string;
  name: string;
  description?: string;
  part_number?: string;
  brand?: string;
  unit_price: number;
  stock_quantity: number;
  min_stock: number;
  category?: string;
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
