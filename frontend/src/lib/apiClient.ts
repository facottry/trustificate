export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const TOKEN_KEY = 'TRUSTIFICATE:token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://trustificate.onrender.com';

export const apiClient = async <T = any>(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = typeof input === 'string' && input.startsWith('/') ? BASE_URL + input : input;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers, credentials: 'include' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new ApiError(
      body?.message || 'API request failed',
      body?.code,
      res.status
    );
    throw error;
  }
  return body as ApiResponse<T>;
};

