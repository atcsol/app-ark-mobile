/**
 * Type Definitions - Barrel Export
 * Re-exports every type from the types directory for convenient imports.
 *
 * Usage:
 *   import { Vehicle, ApiResponse, AuthState } from '@/types';
 */

// Common / API envelope
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationMeta,
  ApiError,
  SelectOption,
  Timestamps,
  SoftDeletable,
} from './common';

// Authentication
export type {
  LoginFormData,
  ForgotPasswordFormData,
  UserType,
  AdminLoginData,
  SellerLoginData,
  MechanicLoginData,
  InvestorLoginData,
  AdminUnifiedLoginResponse,
  SellerUnifiedLoginResponse,
  MechanicUnifiedLoginResponse,
  InvestorUnifiedLoginResponse,
  UnifiedLoginResponse,
  AuthState,
  RegisterFormData,
  ValidationError,
  PasswordValidation,
} from './auth';

export { PasswordStrength } from './auth';

// Users / Admin
export type {
  AdminUser,
  AdminUserAvatar,
  Role,
  Permission,
} from './user';

// Vehicles
export type {
  Vehicle,
  VehicleStatus,
  VehicleImage,
  InvestmentInfo,
  VehicleFormData,
  VehicleSaleFormData,
  VehicleAssignedSeller,
  VehicleSellersResponse,
} from './vehicle';

// Investors
export type {
  Investor,
  InvestorDashboardStats,
  InvestorNotification,
} from './investor';

// Sellers
export type {
  Seller,
  SellerDashboardStats,
  SaleStatus,
  SaleFormData,
  Sale,
} from './seller';

// Mechanics
export type {
  Mechanic,
  MechanicDashboardStats,
} from './mechanic';

// Services
export type {
  ServiceStatus,
  ApprovalStatus,
  ServiceCatalog,
  VehicleService,
} from './service';

// Parts
export type {
  Part,
  PartUsage,
} from './part';

// Approvals
export type {
  ApprovalType,
  ApprovalItemStatus,
  Approval,
  ApprovalStats,
} from './approval';

// Dashboards
export type {
  AdminDashboardStats,
  DashboardCharts,
  SellerDashboard,
  MechanicDashboard,
  InvestorDashboard,
} from './dashboard';
