import { ENV } from '../config/env';

export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // To'liq URL yoki nisbiy URL ni to'g'ri ko'rsatamiz
  let url = endpoint.startsWith('http') ? endpoint : `${ENV.API_BASE}${endpoint}`;

  // CORS muammosini hal qilish uchun brauzerda so'rovlarni Next.js proxy orqali o'tkazamiz
  if (typeof window !== 'undefined' && url.startsWith(ENV.API_BASE)) {
    const parts = url.replace(ENV.API_BASE, '/backend').split('?');
    const proxyPath = parts[0]; // DO NOT slice(0, -1) because Django needs trailing slashes
    url = parts.length > 1 ? `${proxyPath}?${parts.slice(1).join('?')}` : proxyPath;
  }

  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (typeof window !== 'undefined') {
    console.log(`[API CLIENT] Fetching: ${url}`);
  }

  try {
    const response = await fetch(url, config);
    
    // 401 → tokenni yangilashga urinib ko'ramiz
    if (response.status === 401 && !url.includes('/token/refresh/')) {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
      if (refreshToken) {
        try {
          const refreshUrl = typeof window !== 'undefined' ? '/backend/v1/auth/token/refresh/' : `${ENV.API_BASE}/v1/auth/token/refresh/`;
          const refreshRes = await fetch(refreshUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken })
          });
          
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            if (typeof window !== 'undefined' && refreshData.access) {
              localStorage.setItem('access_token', refreshData.access);
              if (refreshData.refresh) {
                 localStorage.setItem('refresh_token', refreshData.refresh);
              }
              // Original so'rovni yangi token bilan qayta yuboramiz
              const newHeaders = { ...config.headers, 'Authorization': `Bearer ${refreshData.access}` };
              const retryRes = await fetch(url, { ...config, headers: newHeaders });
              
              if (retryRes.ok) {
                const contentType = retryRes.headers.get('Content-Type');
                if (contentType && contentType.includes('application/json')) {
                  return await retryRes.json();
                } else if (retryRes.status !== 204) {
                  return (await retryRes.text()) as any;
                }
                return undefined as any;
              }
            }
          }
        } catch (e) {
          console.error("Token refresh failed", e);
        }
      }
      
      // Yangilash o'xshamasa, tokenni o'chirib login ga yuboramiz
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (!window.location.pathname.includes('/login')) {
          const next = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?next=${next}`;
        }
      }
      throw new ApiError('Unauthorized', 401);
    } else if (response.status === 401) {
      throw new ApiError('Unauthorized', 401);
    }

    let data: any;
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else if (response.status !== 204) {
      data = await response.text();
    }

    if (!response.ok) {
      const msg = data?.detail || data?.message || data?.error || 'API request failed';
      throw new ApiError(msg, response.status, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

// Convenience methods
export const api = {
  get: <T>(url: string, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body: any, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: any, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: any, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => apiClient<T>(url, { ...options, method: 'DELETE' }),
};
