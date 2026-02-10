import apiClient from './api';

export const notificationApi = {
  registerToken: (token: string, deviceType: string) =>
    apiClient.post('/device-tokens', { token, device_type: deviceType }),

  removeToken: (token: string) =>
    apiClient.delete(`/device-tokens/${encodeURIComponent(token)}`),
};
