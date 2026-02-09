/**
 * Common Types
 * Shared type definitions for API responses and utility types
 */

// ---------------------------------------------------------------------------
// API Response Wrappers
// ---------------------------------------------------------------------------

/**
 * Standard success response from the Laravel backend.
 * All endpoints follow this envelope pattern.
 */
export interface ApiResponse<T = unknown> {
  success: true;
  message?: string;
  data: T;
}

/**
 * Paginated success response with metadata.
 */
export interface PaginatedResponse<T = unknown> {
  success: true;
  message?: string;
  data: T[];
  meta: PaginationMeta;
}

/**
 * Pagination metadata returned by Laravel's paginator.
 */
export interface PaginationMeta {
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
}

/**
 * Standard error response from the Laravel backend.
 */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// ---------------------------------------------------------------------------
// Utility Types
// ---------------------------------------------------------------------------

/**
 * Generic option shape used by dropdown / picker components.
 */
export interface SelectOption<V = string> {
  label: string;
  value: V;
}

/**
 * Timestamps present on most Eloquent models.
 */
export interface Timestamps {
  created_at: string;
  updated_at: string;
}

/**
 * Soft-delete timestamp added when using SoftDeletes trait.
 */
export interface SoftDeletable {
  deleted_at?: string | null;
}
