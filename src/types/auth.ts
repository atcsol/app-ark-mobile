/**
 * Authentication Types
 * Complete type definitions for the multi-portal authentication system
 */

import type { AdminUser } from './user';
import type { Seller } from './seller';
import type { Mechanic } from './mechanic';
import type { Investor } from './investor';

// ---------------------------------------------------------------------------
// Form Data
// ---------------------------------------------------------------------------

export interface LoginFormData {
  email: string;
  password: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

// ---------------------------------------------------------------------------
// User Type
// ---------------------------------------------------------------------------

export type UserType = 'admin' | 'seller' | 'mechanic' | 'investor';

// ---------------------------------------------------------------------------
// Per-Portal Login Data
// ---------------------------------------------------------------------------

export interface AdminLoginData {
  user: AdminUser;
  access_token: string;
  refresh_token?: string;
}

export interface SellerLoginData {
  seller: Seller;
  access_token: string;
  token_type: string;
}

export interface MechanicLoginData {
  mechanic: Mechanic;
  access_token: string;
  token_type: string;
}

export interface InvestorLoginData {
  token: string;
  investor: Investor;
}

// ---------------------------------------------------------------------------
// Unified Login Response (discriminated union)
// ---------------------------------------------------------------------------

export interface AdminUnifiedLoginResponse {
  success: true;
  user_type: 'admin';
  data: AdminLoginData;
}

export interface SellerUnifiedLoginResponse {
  success: true;
  user_type: 'seller';
  data: SellerLoginData;
}

export interface MechanicUnifiedLoginResponse {
  success: true;
  user_type: 'mechanic';
  data: MechanicLoginData;
}

export interface InvestorUnifiedLoginResponse {
  success: true;
  user_type: 'investor';
  data: InvestorLoginData;
}

export type UnifiedLoginResponse =
  | AdminUnifiedLoginResponse
  | SellerUnifiedLoginResponse
  | MechanicUnifiedLoginResponse
  | InvestorUnifiedLoginResponse;

// ---------------------------------------------------------------------------
// Auth State (client-side)
// ---------------------------------------------------------------------------

export interface AuthState {
  token: string | null;
  userType: UserType | null;
  user: AdminUser | Seller | Mechanic | Investor | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export enum PasswordStrength {
  WEAK = 'weak',
  MEDIUM = 'medium',
  STRONG = 'strong',
}

export interface PasswordValidation {
  strength: PasswordStrength;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
