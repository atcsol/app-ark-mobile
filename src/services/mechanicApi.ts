import apiClient from './api';

export const mechanicApi = {
  me: () => apiClient.get('/mechanic/me'),
  logout: () => apiClient.post('/mechanic/logout'),
  getDashboard: () => apiClient.get('/mechanic/dashboard'),

  // Vehicles
  getMyVehicles: () => apiClient.get('/mechanic/my-vehicles'),

  // Services
  getServices: (params?: Record<string, any>) =>
    apiClient.get('/mechanic/services', params),
  getMyServices: () => apiClient.get('/mechanic/my-services'),
  getServiceDetails: (uuid: string) => apiClient.get(`/mechanic/services/${uuid}`),
  addService: (data: {
    vehicle_id: number;
    service_id: number;
    service_date: string;
    hours_worked?: number;
    notes?: string;
  }) => apiClient.post('/mechanic/services', data),
  updateServiceStatus: (uuid: string, data: {
    status: 'pending' | 'in_progress' | 'completed';
    hours_worked?: number;
    notes?: string;
  }) => apiClient.patch(`/mechanic/services/${uuid}/status`, data),

  // Parts
  addParts: (serviceUuid: string, parts: Array<{ part_id: number; quantity: number }>) =>
    apiClient.post(`/mechanic/services/${serviceUuid}/parts`, { parts }),

  // Approvals
  getPendingApprovals: () => apiClient.get('/mechanic/pending-approvals'),
};

export default mechanicApi;
