/**
 * Dashboard Types
 * Aggregated statistics returned by each portal's dashboard endpoint
 */

// ---------------------------------------------------------------------------
// Admin Dashboard
// ---------------------------------------------------------------------------

export interface AdminDashboardStats {
  vehicles: {
    total: number;
    in_analysis: number;
    in_repair: number;
    ready: number;
    for_sale?: number;
    sold?: number;
  };
  financial: {
    total_invested: number;
    total_profit: number;
    profit_margin: number;
  };
  stock: {
    total_parts: number;
    low_stock_count: number;
    total_value: number;
  };
  sales: {
    this_month_count: number;
    this_month_revenue: number;
    average_ticket: number;
  };
  services: {
    this_month_count: number;
    this_month_cost: number;
  };
  investors: {
    total: number;
    active: number;
  };
  top_seller?: {
    name: string;
    sales_count: number;
    revenue: number;
  };
  top_mechanic?: {
    name: string;
    services_count: number;
  };
}

export interface DashboardCharts {
  vehicles_by_status?: Array<{ status: string; count: number }>;
  sales_by_month?: Array<{ month: string; revenue: number; profit: number }>;
  services_by_category?: Array<{ category: string; count: number; total: number }>;
  top_parts?: Array<{ name: string; usage: number }>;
}

// ---------------------------------------------------------------------------
// Seller Dashboard
// ---------------------------------------------------------------------------

export interface SellerDashboard {
  stats: {
    total_sales_count: number;
    total_sales_value: number;
    total_commission: number;
    avg_commission_percentage: number;
    pending_vehicles_count: number;
  };
  recent_sales: Array<{
    id: number;
    vehicle_name: string;
    sale_value: number;
    commission_amount: number;
    sale_date: string;
  }>;
  available_vehicles: Array<{
    id: number;
    uuid: string;
    full_name: string;
    sale_value: number;
    status: string;
  }>;
}

// ---------------------------------------------------------------------------
// Mechanic Dashboard
// ---------------------------------------------------------------------------

export interface MechanicDashboard {
  stats: {
    total_services: number;
    completed_services: number;
    pending_services: number;
    in_progress_services: number;
    total_hours: number;
    total_labor_cost: number;
  };
  pending_services: Array<{
    id: number;
    vehicle_name: string;
    service_name: string;
    service_date: string;
    status: string;
  }>;
  recent_completed: Array<{
    id: number;
    vehicle_name: string;
    service_name: string;
    hours_worked: number;
    labor_cost: number;
    completed_at: string;
  }>;
}

// ---------------------------------------------------------------------------
// Investor Dashboard
// ---------------------------------------------------------------------------

export interface InvestorDashboard {
  stats: {
    total_vehicles: number;
    active_investments: number;
    completed_investments: number;
    total_invested: number;
    total_returned: number;
    pending_return: number;
    roi: number;
  };
  active_vehicles: Array<{
    id: number;
    uuid: string;
    full_name: string;
    status: string;
    investment_amount: number;
    current_value: number;
  }>;
  recent_returns: Array<{
    id: number;
    vehicle_name: string;
    invested: number;
    returned: number;
    profit: number;
    completed_at: string;
  }>;
}
