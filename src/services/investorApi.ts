import apiClient from './api';

export const investorApi = {
  me: () => apiClient.get('/investor/me'),
  logout: () => apiClient.post('/investor/logout'),
  getDashboard: () => apiClient.get('/investor/dashboard'),

  // Vehicles
  getVehicles: () => apiClient.get('/investor/vehicles'),
  getVehicleDetails: (uuid: string) => apiClient.get(`/investor/vehicles/${uuid}`),

  // Notifications
  getNotifications: () => apiClient.get('/investor/notifications'),
  getUnreadNotifications: () => apiClient.get('/investor/notifications/unread'),
  markNotificationAsRead: (notificationId: string) =>
    apiClient.post(`/investor/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () =>
    apiClient.post('/investor/notifications/mark-all-read'),
};

export default investorApi;
