/**
 * Frontend API Client
 * 
 * Security: All secrets (JWT, refresh token) stay in memory/HttpOnly cookies.
 * No Supabase keys, no direct DB access from the browser.
 */

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// In-memory access token (NOT localStorage — avoids XSS theft)
let accessToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

export const apiClient = {
  setAccessToken(token: string | null) {
    accessToken = token;
  },

  getAccessToken() {
    return accessToken;
  },

  async request<T = any>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    const makeRequest = async (token: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      return fetch(`${BASE_URL}${path}`, {
        method,
        credentials: 'include', // Send HttpOnly refresh cookie automatically
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        ...options,
      });
    };

    let response = await makeRequest(accessToken);

    // Token expired OR missing — try to refresh once via HttpOnly cookie
    // BUT skip refresh for auth endpoints (login/register) where 401 means invalid credentials
    const isAuthEndpoint = path.startsWith('/auth/login') || path.startsWith('/auth/register') || path.startsWith('/auth/forgot-password') || path.startsWith('/auth/reset-password');
    if (response.status === 401 && !isAuthEndpoint) {
      try {
        await apiClient.refresh();
        response = await makeRequest(accessToken);
      } catch {
        // Refresh failed — user is not authenticated, clear state
        accessToken = null;
        // Only redirect away from protected routes; let callers decide
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  },

  /**
   * Silently exchange the HttpOnly refresh cookie for a new access token.
   * Called proactively on app startup (so reload doesn't log the user out)
   * and automatically on 401 responses.
   * Deduplicates concurrent calls to handle React 18 strict mode double-mounts.
   */
  async refresh(): Promise<void> {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include', // Sends HttpOnly refresh_token cookie
        });
        if (!res.ok) throw new Error('Refresh failed');
        const data = await res.json();
        accessToken = data.accessToken;
      } finally {
        // Clear promise so future token expiration can trigger a new refresh
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  },

  get<T = any>(path: string): Promise<T> {
    return apiClient.request<T>('GET', path);
  },

  post<T = any>(path: string, body?: unknown): Promise<T> {
    return apiClient.request<T>('POST', path, body);
  },

  patch<T = any>(path: string, body?: unknown): Promise<T> {
    return apiClient.request<T>('PATCH', path, body);
  },

  put<T = any>(path: string, body?: unknown): Promise<T> {
    return apiClient.request<T>('PUT', path, body);
  },

  delete<T = any>(path: string): Promise<T> {
    return apiClient.request<T>('DELETE', path);
  },

  /**
   * Multipart file upload (for assets)
   */
  async upload<T = any>(path: string, formData: FormData): Promise<T> {
    // If no access token, attempt silent refresh first
    if (!accessToken) {
      try { await this.refresh(); } catch { /* will fail with 401 below */ }
    }

    const headers: Record<string, string> = {};
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });

    if (res.status === 401) {
      // Try refresh once for uploads too
      try {
        await this.refresh();
        const retryHeaders: Record<string, string> = {};
        if (accessToken) retryHeaders['Authorization'] = `Bearer ${accessToken}`;
        const retryRes = await fetch(`${BASE_URL}${path}`, {
          method: 'POST',
          credentials: 'include',
          headers: retryHeaders,
          body: formData,
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          throw new Error(err.message || `Upload failed: HTTP ${retryRes.status}`);
        }
        return retryRes.json();
      } catch {
        throw new Error('Upload failed: Session expired. Please log in again.');
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Upload failed: HTTP ${res.status}`);
    }
    return res.json();
  },
};
