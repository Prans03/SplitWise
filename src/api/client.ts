// ============================================================
// src/api/client.ts – Centralized HTTP client
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Network Configuration ───────────────────────────────────────
// __DEV__ is automatically true in Expo Go, and false when you build an APK.
export const API_URL = __DEV__
  ? 'http://192.168.29.148:4000'                      // Local IP for Expo Go development
  : 'https://splitwise-backend-demo.onrender.com';    // Cloud IP for your APK file

export const SESSION_KEY = '@splitwise/session_token';

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_KEY);
}

export async function setToken(token: string): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// ── Core fetch wrapper ────────────────────────────────────────
interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = await getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const res = await fetch(`${API_URL}${path}`, { 
      ...options, 
      headers,
      signal: controller.signal 
    });
    
    clearTimeout(timeoutId);
    
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return { status: res.status, error: json.error ?? `HTTP ${res.status}` };
    }
    return { status: res.status, data: json as T };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { status: 408, error: 'Request timed out. Server unreachable.' };
    }
    return { status: 0, error: err.message ?? 'Network error' };
  }
}

// ── Typed shorthand methods ───────────────────────────────────
export const api = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'GET', headers }),

  post: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), headers }),

  put: <T>(path: string, body: unknown, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), headers }),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    apiFetch<T>(path, { method: 'DELETE', headers }),
};
