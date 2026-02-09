/**
 * User / Admin Types
 * Definitions for admin users, roles, and permissions (Spatie-style)
 */

// ---------------------------------------------------------------------------
// Permissions & Roles
// ---------------------------------------------------------------------------

export interface Permission {
  id: number;
  name: string;
  guard_name: string;
}

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
}

// ---------------------------------------------------------------------------
// Admin User
// ---------------------------------------------------------------------------

export interface AdminUserAvatar {
  id: number | string;
  path: string;
  url: string;
  filename: string;
  uploaded_at: string;
}

export interface AdminUser {
  id: number;
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  is_active?: boolean;
  avatar?: AdminUserAvatar;
  roles?: Role[];
  permissions?: Permission[];
  last_login_at?: string;
  created_at?: string;
  deleted_at?: string | null;
}
