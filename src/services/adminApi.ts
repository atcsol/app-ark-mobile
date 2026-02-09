import apiClient from './api';

export const adminApi = {
  // Auth
  me: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),

  // Dashboard
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  getDashboardCharts: () => apiClient.get('/dashboard/charts'),

  // Vehicles
  getVehicles: (params?: Record<string, any>) => apiClient.get('/vehicles', params),
  getVehicle: (id: string) => apiClient.get(`/vehicles/${id}`),
  createVehicle: (data: any) => apiClient.post('/vehicles', data),
  updateVehicle: (id: string, data: any) => apiClient.put(`/vehicles/${id}`, data),
  deleteVehicle: (id: string) => apiClient.delete(`/vehicles/${id}`),
  updateVehicleStatus: (id: string, status: string) =>
    apiClient.patch(`/vehicles/${id}/status`, { status }),
  registerVehicleSale: (id: string, data: any) =>
    apiClient.post(`/vehicles/${id}/sale`, data),
  getVehiclesFormData: () => apiClient.get('/vehicles/form-data'),

  // Vehicle Images
  getVehicleImages: (vehicleId: string) =>
    apiClient.get(`/vehicles/${vehicleId}/images`),
  uploadVehicleImages: (vehicleId: string, formData: FormData) =>
    apiClient.upload(`/vehicles/${vehicleId}/images`, formData),
  deleteVehicleImage: (vehicleId: string, imageId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/images/${imageId}`),
  setPrimaryVehicleImage: (vehicleId: string, imageId: string) =>
    apiClient.patch(`/vehicles/${vehicleId}/images/${imageId}/primary`),

  // Vehicle Sellers
  getVehicleSellers: (vehicleId: string) =>
    apiClient.get(`/vehicles/${vehicleId}/sellers`),
  assignVehicleSellers: (vehicleId: string, sellerIds: string[]) =>
    apiClient.post(`/vehicles/${vehicleId}/sellers`, { seller_ids: sellerIds }),
  removeVehicleSeller: (vehicleId: string, sellerId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/sellers/${sellerId}`),
  toggleAvailableToAllSellers: (vehicleId: string, available: boolean) =>
    apiClient.patch(`/vehicles/${vehicleId}/available-to-all-sellers`, {
      available_to_all_sellers: available,
    }),

  // Vehicle Investors
  attachVehicleInvestor: (vehicleId: string, data: any) =>
    apiClient.post(`/vehicles/${vehicleId}/investors`, data),
  detachVehicleInvestor: (vehicleId: string, investorId: string) =>
    apiClient.delete(`/vehicles/${vehicleId}/investors/${investorId}`),

  // Investors
  getInvestors: (params?: Record<string, any>) => apiClient.get('/investors', params),
  getInvestor: (id: string) => apiClient.get(`/investors/${id}`),
  createInvestor: (data: any) => apiClient.post('/investors', data),
  updateInvestor: (id: string, data: any) => apiClient.put(`/investors/${id}`, data),
  deleteInvestor: (id: string) => apiClient.delete(`/investors/${id}`),
  getInvestorVehicles: (id: string) => apiClient.get(`/investors/${id}/vehicles`),

  // Sellers
  getSellers: (params?: Record<string, any>) => apiClient.get('/sellers', params),
  getSeller: (id: string) => apiClient.get(`/sellers/${id}`),
  createSeller: (data: any) => apiClient.post('/sellers', data),
  updateSeller: (id: string, data: any) => apiClient.put(`/sellers/${id}`, data),
  deleteSeller: (id: string) => apiClient.delete(`/sellers/${id}`),
  getSellerVehicles: (id: string) => apiClient.get(`/sellers/${id}/vehicles`),
  getSellerStats: (id: string) => apiClient.get(`/sellers/${id}/stats`),

  // Mechanics
  getMechanics: (params?: Record<string, any>) => apiClient.get('/mechanics', params),
  getMechanic: (id: string) => apiClient.get(`/mechanics/${id}`),
  createMechanic: (data: any) => apiClient.post('/mechanics', data),
  updateMechanic: (id: string, data: any) => apiClient.put(`/mechanics/${id}`, data),
  deleteMechanic: (id: string) => apiClient.delete(`/mechanics/${id}`),
  getMechanicServices: (id: string) => apiClient.get(`/mechanics/${id}/services`),

  // Services (Catalog)
  getServices: (params?: Record<string, any>) => apiClient.get('/services', params),
  getService: (id: string) => apiClient.get(`/services/${id}`),
  createService: (data: any) => apiClient.post('/services', data),
  updateService: (id: string, data: any) => apiClient.put(`/services/${id}`, data),
  deleteService: (id: string) => apiClient.delete(`/services/${id}`),

  // Vehicle Services
  getVehicleServices: (vehicleId: string) =>
    apiClient.get(`/vehicles/${vehicleId}/services`),
  createVehicleService: (vehicleId: string, data: any) =>
    apiClient.post(`/vehicles/${vehicleId}/services`, data),
  updateVehicleService: (id: string, data: any) =>
    apiClient.put(`/vehicle-services/${id}`, data),
  deleteVehicleService: (id: string) =>
    apiClient.delete(`/vehicle-services/${id}`),

  // Parts
  getParts: (params?: Record<string, any>) => apiClient.get('/parts', params),
  getPart: (id: string) => apiClient.get(`/parts/${id}`),
  createPart: (data: any) => apiClient.post('/parts', data),
  updatePart: (id: string, data: any) => apiClient.put(`/parts/${id}`, data),
  deletePart: (id: string) => apiClient.delete(`/parts/${id}`),
  getPartMovements: (id: string) => apiClient.get(`/parts/${id}/movements`),

  // Stock
  getStockMovements: (params?: Record<string, any>) =>
    apiClient.get('/stock/movements', params),
  createStockMovement: (data: any) => apiClient.post('/stock/movements', data),
  getStockAlerts: () => apiClient.get('/stock/alerts'),
  getStockSummary: () => apiClient.get('/stock/summary'),

  // Approvals
  getApprovals: (type?: string) => apiClient.get('/approvals', type ? { type } : undefined),
  getApprovalStats: () => apiClient.get('/approvals/stats'),
  getApprovalsHistory: (params?: { status?: 'approved' | 'rejected'; type?: string }) =>
    apiClient.get('/approvals/history', params),
  approveService: (uuid: string) => apiClient.post(`/approvals/services/${uuid}/approve`),
  rejectService: (uuid: string, reason: string) =>
    apiClient.post(`/approvals/services/${uuid}/reject`, { rejection_reason: reason }),
  approvePart: (uuid: string) => apiClient.post(`/approvals/parts/${uuid}/approve`),
  rejectPart: (uuid: string, reason: string) =>
    apiClient.post(`/approvals/parts/${uuid}/reject`, { rejection_reason: reason }),
  approveSale: (uuid: string) => apiClient.post(`/approvals/sales/${uuid}/approve`),
  rejectSale: (uuid: string, reason: string) =>
    apiClient.post(`/approvals/sales/${uuid}/reject`, { rejection_reason: reason }),

  // Users
  getUsers: (params?: Record<string, any>) => apiClient.get('/users', params),
  getUser: (uuid: string) => apiClient.get(`/users/${uuid}`),
  createUser: (data: any) => apiClient.post('/users', data),
  updateUser: (uuid: string, data: any) => apiClient.put(`/users/${uuid}`, data),
  deleteUser: (uuid: string) => apiClient.delete(`/users/${uuid}`),
  restoreUser: (uuid: string) => apiClient.post(`/users/${uuid}/restore`),
  getRolesAndPermissions: () => apiClient.get('/users/roles-permissions'),
  assignUserRoles: (uuid: string, roles: string[]) =>
    apiClient.post(`/users/${uuid}/roles`, { roles }),
  assignUserPermissions: (uuid: string, permissions: string[]) =>
    apiClient.post(`/users/${uuid}/permissions`, { permissions }),

  // Reports
  getVehiclesReport: (filters?: Record<string, any>) =>
    apiClient.get('/reports/vehicles', filters),
  getSalesReport: (filters?: Record<string, any>) =>
    apiClient.get('/reports/sales', filters),
  getInvestorsReport: (filters?: Record<string, any>) =>
    apiClient.get('/reports/investors', filters),
  getPartsReport: (filters?: Record<string, any>) =>
    apiClient.get('/reports/parts', filters),
  exportReport: (reportType: string, filters?: Record<string, any>) =>
    apiClient.post('/reports/export', { report_type: reportType, filters }),

  // Settings
  getSettings: () => apiClient.get('/settings'),
  updateSetting: (key: string, value: any) => apiClient.put(`/settings/${key}`, { value }),
  bulkUpdateSettings: (settings: Record<string, any>) =>
    apiClient.post('/settings/bulk-update', { settings }),
  testEmail: (to: string) => apiClient.post('/settings/mail/test', { to }),

  // Company Logo
  getCompanyLogo: () => apiClient.get('/company-logo'),
  uploadCompanyLogo: (formData: FormData) => apiClient.upload('/company-logo', formData),
  deleteCompanyLogo: () => apiClient.delete('/company-logo'),

  // Avatar
  uploadAvatar: (formData: FormData) => apiClient.upload('/auth/avatar', formData),
  deleteAvatar: () => apiClient.delete('/auth/avatar'),

  // Roles
  getRoles: () => apiClient.get('/roles'),
  getRole: (name: string) => apiClient.get(`/roles/${name}`),
  createRole: (data: any) => apiClient.post('/roles', data),
  updateRole: (name: string, data: any) => apiClient.put(`/roles/${name}`, data),
  deleteRole: (name: string) => apiClient.delete(`/roles/${name}`),
  getAllPermissions: () => apiClient.get('/permissions'),
  getPermissionMatrix: () => apiClient.get('/roles/matrix'),
};

export default adminApi;
