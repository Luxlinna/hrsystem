import type { ApiResponse } from '../types/api.types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiClientError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('supabase.auth.token') || localStorage.getItem('access_token');

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data: ApiResponse<T> = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = (data as any)?.message || `Request failed with status ${response.status}`;
      throw new ApiClientError(errorMsg, response.status, (data as any)?.details);
    }

    return (data as any).data !== undefined ? (data as any).data : (data as any);
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw new ApiClientError((error as Error).message || 'Network connection failed', 500);
  }
}

export const api = {
  get: <T>(url: string, options?: RequestInit) => request<T>(url, { method: 'GET', ...options }),
  post: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { method: 'DELETE', ...options }),
};
