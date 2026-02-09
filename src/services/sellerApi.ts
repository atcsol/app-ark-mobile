import apiClient from './api';

export const sellerApi = {
  me: () => apiClient.get('/seller/me'),
  logout: () => apiClient.post('/seller/logout'),
  getDashboard: () => apiClient.get('/seller/dashboard'),
  getStatistics: () => apiClient.get('/seller/statistics'),

  // Vehicles
  getAvailableVehicles: (params?: Record<string, any>) =>
    apiClient.get('/seller/available-vehicles', params),
  getSoldVehicles: (params?: Record<string, any>) =>
    apiClient.get('/seller/sold-vehicles', params),
  getVehicleDetails: (uuid: string) => apiClient.get(`/seller/vehicles/${uuid}`),

  // Sales
  getSales: (params?: Record<string, any>) => apiClient.get('/seller/sales', params),
  getSale: (uuid: string) => apiClient.get(`/seller/sales/${uuid}`),
  getPendingSales: () => apiClient.get('/seller/pending-sales'),
  registerSale: (data: {
    vehicle_id: number;
    sale_value: number;
    sale_date: string;
    buyer_name: string;
    buyer_document?: string;
    buyer_phone?: string;
    buyer_email?: string;
    buyer_address?: string;
    notes?: string;
  }) => apiClient.post('/seller/sales', data),
};

export default sellerApi;
