/**
 * SyncForge API Client
 * Centralized HTTP client for backend communication.
 * All requests pass through this module to ensure consistent
 * error handling, base URL resolution, and auth token injection.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_PREFIX = '/api/v1';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  } | null;
}

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Array<{ field: string; message: string }>;

  constructor(statusCode: number, code: string, message: string, details?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// ── Token storage (set by auth provider) ──────────────────────
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(getter: () => Promise<string | null>) {
  _getToken = getter;
}

// ── Core request function ─────────────────────────────────────
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Inject Clerk session token if available
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Silently continue without auth if token fetch fails
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      response.status,
      data.error?.code || 'UNKNOWN_ERROR',
      data.error?.message || 'An unexpected error occurred',
      data.error?.details,
    );
  }

  return data;
}

// ── Convenience methods ───────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, file: File, fieldName = 'file') => {
    const formData = new FormData();
    formData.append(fieldName, file);
    return request<T>(endpoint, {
      method: 'POST',
      body: formData,
    });
  },
};
