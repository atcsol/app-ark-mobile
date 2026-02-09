export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001/api';

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'ark_auth_token',
  REFRESH_TOKEN: 'ark_refresh_token',
  USER_TYPE: 'ark_user_type',
  USER_DATA: 'ark_user_data',
} as const;

export const USER_TYPES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  MECHANIC: 'mechanic',
  INVESTOR: 'investor',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];

export const VEHICLE_STATUSES = {
  IN_ANALYSIS: 'in_analysis',
  IN_REPAIR: 'in_repair',
  READY: 'ready',
  FOR_SALE: 'for_sale',
  SOLD: 'sold',
} as const;

export const SERVICE_STATUSES = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export const APPROVAL_TYPES = {
  SERVICE: 'services',
  PART: 'parts',
  SALE: 'sales',
} as const;
