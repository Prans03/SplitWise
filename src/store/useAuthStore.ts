// ============================================================
// src/store/useAuthStore.ts – Auth state (Zustand)
// Source of truth for session; gating the whole nav tree
// ============================================================
import { create } from 'zustand';
import { api, setToken, clearToken, getToken } from '../api/client';
import { wsClient } from '../api/ws';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  color: string;
  avatar: string;
  upi_id: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;          // initial session check
  isSubmitting: boolean;       // sign-in/up in flight
  error: string | null;

  // Actions
  bootstrap: () => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (upi_id: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isSubmitting: false,
  error: null,

  // ── Bootstrap – called once on app mount ─────────────────
  bootstrap: async () => {
    set({ isLoading: true, error: null });
    const token = await getToken();
    if (!token) { set({ isLoading: false }); return; }

    const res = await api.get<{user: AuthUser}>('/auth/session');
    if (res.data?.user) {
      set({ user: res.data.user, token, isLoading: false });
      wsClient.connect();
    } else {
      await clearToken();
      set({ user: null, token: null, isLoading: false });
    }
  },

  // ── Sign Up ───────────────────────────────────────────────
  signUp: async (name, email, password) => {
    set({ isSubmitting: true, error: null });
    const res = await api.post<{ token: string; user: AuthUser }>('/auth/signup', { name, email, password });
    if (res.error || !res.data) {
      set({ isSubmitting: false, error: res.error ?? 'Sign up failed' });
      return false;
    }
    await setToken(res.data.token);
    set({ user: res.data.user, token: res.data.token, isSubmitting: false });
    wsClient.connect();
    return true;
  },

  // ── Sign In ───────────────────────────────────────────────
  signIn: async (email, password) => {
    set({ isSubmitting: true, error: null });
    const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
    if (res.error || !res.data) {
      set({ isSubmitting: false, error: res.error ?? 'Sign in failed' });
      return false;
    }
    await setToken(res.data.token);
    set({ user: res.data.user, token: res.data.token, isSubmitting: false });
    wsClient.connect();
    return true;
  },

  // ── Sign Out ──────────────────────────────────────────────
  signOut: async () => {
    await api.post('/auth/logout', {});
    await clearToken();
    wsClient.disconnect();
    set({ user: null, token: null });
  },

  // ── Update Profile ────────────────────────────────────────
  updateProfile: async (upi_id: string) => {
    set({ isSubmitting: true, error: null });
    const res = await api.put<{ user: AuthUser }>('/auth/profile', { upi_id });
    if (res.error || !res.data) {
      set({ isSubmitting: false, error: res.error ?? 'Update failed' });
      return false;
    }
    set({ user: res.data.user, isSubmitting: false });
    return true;
  },

  // ── Delete Account ─────────────────────────────────────────
  deleteAccount: async () => {
    set({ isSubmitting: true, error: null });
    const res = await api.delete('/auth/account');
    if (res.error) {
      set({ isSubmitting: false, error: res.error ?? 'Delete failed' });
      return false;
    }
    await clearToken();
    wsClient.disconnect();
    set({ user: null, token: null, isSubmitting: false });
    return true;
  },

  clearError: () => set({ error: null }),
}));
