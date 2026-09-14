/**
 * API response types
 * Standard response wrappers used by both backend and frontend
 */

/** Standard API success response */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

/** Paginated API response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/** API error response */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/** Union type for all API responses */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
export type PaginatedResult<T> = PaginatedResponse<T> | ApiErrorResponse;
