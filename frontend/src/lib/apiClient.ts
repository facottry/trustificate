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
const BACKEND_VERSION_KEY = 'TRUSTIFICATE:backend-version';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export const setAuthToken = (token: string | null) => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

/** Returns the last seen backend version (from X-App-Version response header) */
export const getBackendVersion = () => sessionStorage.getItem(BACKEND_VERSION_KEY) ?? null;

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Always use the production public URL for QR codes and shareable links
export const PUBLIC_URL = import.meta.env.VITE_PUBLIC_URL || 'https://trustificate.clicktory.in';

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

  // Capture backend version for compatibility display
  const backendVersion = res.headers.get('X-App-Version');
  if (backendVersion) sessionStorage.setItem(BACKEND_VERSION_KEY, backendVersion);

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

