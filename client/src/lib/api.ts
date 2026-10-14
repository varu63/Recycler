import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '@shared/types';

const BASE_URL: string = import.meta.env.VITE_API_URL || '/api';

let accessToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

export const getAccessToken = (): string | null => accessToken;

export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  const { data } = await axios.post(
    `${BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
  );
  const token: string | undefined = data?.data?.accessToken;
  setAccessToken(token ?? null);
  return token ?? null;
}

export function requestSessionRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password'];

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';
    const isAuthPath = AUTH_PATHS.some((path) => url.includes(path));

    if (status === 401 && original && !original._retry && !isAuthPath) {
      original._retry = true;
      try {
        const token = await requestSessionRefresh();
        if (token) {
          original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
          return api(original);
        }
      } catch {
        // fall through to logout
      }
      setAccessToken(null);
      unauthorizedHandler?.();
    }

    return Promise.reject(error);
  }
);

interface ApiErrorPayload {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export function getErrorPayload(error: unknown): ApiErrorPayload {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as ApiErrorPayload | undefined) ?? {};
  }
  return {};
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const payload = getErrorPayload(error);
  if (payload.message) return payload.message;
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Unable to reach the server. Check your connection and try again.';
    if (error.response.status === 429) return 'Too many attempts. Please wait a moment and try again.';
    if (error.response.status >= 500) return 'The server encountered an error. Please try again later.';
  }
  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string[]> {
  return getErrorPayload(error).errors ?? {};
}

export function getErrorCode(error: unknown): string | undefined {
  return getErrorPayload(error).code;
}

export function unwrap<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data;
  if (body && typeof body === 'object' && 'success' in body && body.success) {
    return body.data;
  }
  throw new Error((body as { message?: string } | undefined)?.message ?? 'Unexpected response');
}

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<ApiResponse<T>>(url, config);
  return unwrap(res);
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await api.post<ApiResponse<T>>(url, data, config);
  return unwrap(res);
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const res = await api.patch<ApiResponse<T>>(url, data, config);
  return unwrap(res);
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<ApiResponse<T>>(url, config);
  return unwrap(res);
}
