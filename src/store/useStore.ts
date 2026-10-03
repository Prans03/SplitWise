// ============================================================
// src/store/useStore.ts – App data store (API-backed)
// Zustand as UI cache. All mutations call API first.
// WebSocket events reconcile state in real time.
// ============================================================
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { wsClient } from '../api/ws';

// ── Types ─────────────────────────────────────────────────────
export interface User {
  id: string; name: string; email: string; color: string; avatar: string; role?: string;
}

export interface Group {
  id: string; name: string; emoji: string;
  memberCount: number; totalSpent: number; role: string;
  members?: User[];
  created_at: string; updated_at: string;
}

export interface ExpenseSplit { userId: string; amount: number; name: string; color: string; }

export interface Expense {
  id: string; groupId: string; description: string; amount: number;
  currency: string; category: string; paidById: string;
  paidByName: string; paidByColor: string;
  splitMode: string; splits: ExpenseSplit[];
  date: string; createdAt: string;
  isPersonal?: boolean;
}

export type PaletteId = 'buckwheat' | 'ocean' | 'blossom' | 'forest' | 'ember' | 'midnight' | 'sunflower' | 'grape';

interface StoreState {
  // Theme
  isDarkMode: boolean;
  paletteId: PaletteId;
  toggleDarkMode: () => void;
  setPalette: (id: PaletteId) => void;

  // Data
  groups: Group[];
  expenses: Record<string, Expense[]>; // groupId → expenses
  isSyncing: boolean;

  // Budget Config
  dailyBudget: number;
  budgetStartDate: string;
  budgetEndDate: string;
  setBudgetConfig: (config: { dailyBudget?: number; budgetStartDate?: string; budgetEndDate?: string }) => void;

  // Group actions
  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (groupId: string) => Promise<Group | null>;
  createGroup: (name: string, emoji: string) => Promise<Group | null>;
  deleteGroup: (groupId: string) => Promise<void>;
  generateInvite: (groupId: string) => Promise<{ token: string; expiresAt: string } | null>;
  joinGroup: (token: string) => Promise<{ groupName: string } | null>;

  // Expense actions
  fetchExpenses: (groupId: string) => Promise<void>;
  addExpense: (params: {
    groupId: string; description: string; amount: number;
    category: string; paidById: string; splitMode: string; splitMemberIds: string[];
    customSplits?: Array<{userId: string; amount: number}>;
    date?: string;
    isPersonal?: boolean;
  }) => Promise<Expense | null>;
  deleteExpense: (groupId: string, expenseId: string) => Promise<void>;

  // Real-time reconciliation
  initWsListeners: () => () => void;

  // Local state reset
  reset: () => void;
}

export const useStore = create<StoreState>()(persist((set, get) => ({
  isDarkMode: true,
  paletteId: 'buckwheat',
  toggleDarkMode: () => set((s) => ({ isDarkMode: !s.isDarkMode })),
  setPalette: (id) => set({ paletteId: id }),

  groups: [],
  expenses: {},
  isSyncing: false,

  // ── Budget Config defaults ────────────────────────────────
  dailyBudget: 1500,
  budgetStartDate: new Date().toISOString(),
  budgetEndDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
  setBudgetConfig: (config) => set((s) => ({ ...s, ...config })),

  // ── Fetch all groups user belongs to ─────────────────────
  fetchGroups: async () => {
    set({ isSyncing: true });
    const res = await api.get<any[]>('/groups');
    if (res.data) {
      const groups: Group[] = res.data.map((g) => ({
        id: g.id, name: g.name, emoji: g.emoji, role: g.role,
        memberCount: Number(g.member_count),
        totalSpent: Number(g.total_spent),
        created_at: g.created_at, updated_at: g.updated_at,
      }));
      set({ groups, isSyncing: false });
    } else {
      set({ isSyncing: false });
    }
  },

  // ── Fetch group + members ─────────────────────────────────
  fetchGroupDetail: async (groupId) => {
    const res = await api.get<any>(`/groups/${groupId}`);
    if (!res.data) return null;
    const g = res.data;
    const group: Group = {
      id: g.id, name: g.name, emoji: g.emoji, role: 'member',
      memberCount: g.members?.length ?? 0,
      totalSpent: 0,
      members: g.members ?? [],
      created_at: g.created_at, updated_at: g.updated_at,
    };
    set((s) => ({
      groups: s.groups.map((x) => x.id === groupId ? { ...x, ...group } : x),
    }));
    return group;
  },

  // ── Create group (optimistic) ─────────────────────────────
  createGroup: async (name, emoji) => {
    const res = await api.post<any>('/groups', { name, emoji });
    if (!res.data) return null;
    const g = res.data;
    const group: Group = {
      id: g.id, name: g.name, emoji: g.emoji, role: 'owner',
      memberCount: 1, totalSpent: 0,
      created_at: g.created_at, updated_at: g.updated_at,
    };
    set((s) => ({ groups: [group, ...s.groups] }));
    return group;
  },

  // ── Delete group (optimistic) ─────────────────────────────
  deleteGroup: async (groupId) => {
    set((s) => ({ groups: s.groups.filter((g) => g.id !== groupId) }));
    await api.delete(`/groups/${groupId}`);
  },

  // ── Generate invite token ─────────────────────────────────
  generateInvite: async (groupId) => {
    const res = await api.post<{ token: string; expiresAt: string }>(`/groups/${groupId}/invite`, {});
    return res.data ?? null;
  },

  // ── Join group via token ──────────────────────────────────
  joinGroup: async (token) => {
    const res = await api.post<{ group: any }>('/groups/join', { token });
    if (!res.data) return null;
    await get().fetchGroups();
    return { groupName: res.data.group.name };
  },

  // ── Fetch expenses for a group (paginated, page=1 fetches latest 30) ────
  fetchExpenses: async (groupId) => {
    const res = await api.get<any>(`/groups/${groupId}/expenses`);
    if (!res.data) return;
    // Backend now returns { data: [], page, limit, total, hasMore }
    // Fall back to flat array for backward compatibility
    const rows: any[] = Array.isArray(res.data) ? res.data : (res.data.data ?? []);
    const expenses: Expense[] = rows.map((e) => ({
      id: e.id, groupId,
      description: e.description,
      amount: Number(e.amount),
      currency: e.currency ?? 'INR',
      category: e.category,
      paidById: e.paid_by,
      paidByName: e.paid_by_name ?? '',
      paidByColor: e.paid_by_color ?? '#888',
      splitMode: e.split_mode,
      splits: e.splits ?? [],
      date: e.date,
      createdAt: e.created_at,
      isPersonal: e.is_personal ?? false,
    }));
    set((s) => ({ expenses: { ...s.expenses, [groupId]: expenses } }));
  },

  // ── Add expense (optimistic Local-First) ──────────────────────────────
  addExpense: async ({ groupId, description, amount, category, paidById, splitMode, splitMemberIds, customSplits, date, isPersonal }) => {
    const tempId = 'temp-' + Math.random().toString(36).substring(2);
    
    const group = get().groups.find(g => g.id === groupId);
    const user = group?.members?.find(m => m.id === paidById);
    const finalDate = date || new Date().toISOString();
    
    const optimisticExpense: Expense = {
      id: tempId, groupId, description, amount, currency: 'INR', category,
      paidById, paidByName: user?.name ?? 'Unknown', paidByColor: user?.color ?? '#888',
      splitMode, splits: [], date: finalDate, createdAt: new Date().toISOString(),
      isPersonal: isPersonal ?? false,
    };
    
    set((s) => ({
      expenses: { ...s.expenses, [groupId]: [optimisticExpense, ...(s.expenses[groupId] ?? [])] },
    }));

    try {
      const res = await api.post<any>(`/groups/${groupId}/expenses`, {
        description, amount, category, paidById, splitMode, splitMemberIds, customSplits,
        date: finalDate, isPersonal: isPersonal ?? false
      });
      if (res.data) {
        set((s) => {
          const current = s.expenses[groupId] || [];
          return {
            expenses: {
              ...s.expenses,
              [groupId]: current.map(e => e.id === tempId ? { ...e, id: res.data.id, splits: res.data.splits || [] } : e)
            }
          };
        });
        return res.data;
      }
    } catch (err) {
      set((s) => {
        const current = s.expenses[groupId] || [];
        return { expenses: { ...s.expenses, [groupId]: current.filter(e => e.id !== tempId) } };
      });
    }
    return null;
  },

  // ── Delete expense ────────────────────────────────────────
  deleteExpense: async (groupId, expenseId) => {
    set((s) => ({
      expenses: {
        ...s.expenses,
        [groupId]: (s.expenses[groupId] ?? []).filter((e) => e.id !== expenseId),
      },
    }));
    await api.delete(`/groups/${groupId}/expenses/${expenseId}`);
  },

  // ── WebSocket real-time reconciliation ───────────────────
  initWsListeners: () => {
    const off1 = wsClient.on('expense.created', (msg: any) => {
      const groupId: string = msg.groupId;
      const expense: Expense = {
        id: msg.expense.id, groupId,
        description: msg.expense.description,
        amount: Number(msg.expense.amount),
        currency: msg.expense.currency ?? 'INR',
        category: msg.expense.category,
        paidById: msg.expense.paid_by,
        paidByName: msg.expense.paid_by_name ?? '',
        paidByColor: msg.expense.paid_by_color ?? '#888',
        splitMode: msg.expense.split_mode,
        splits: msg.expense.splits ?? [],
        date: msg.expense.date,
        createdAt: msg.expense.created_at,
      };
      set((s) => ({
        expenses: {
          ...s.expenses,
          [groupId]: [expense, ...(s.expenses[groupId] ?? []).filter((e) => e.id !== expense.id)],
        },
      }));
    });

    const off2 = wsClient.on('expense.deleted', (msg: any) => {
      const { groupId, expenseId } = msg;
      set((s) => ({
        expenses: {
          ...s.expenses,
          [groupId]: (s.expenses[groupId] ?? []).filter((e) => e.id !== expenseId),
        },
      }));
    });

    const off3 = wsClient.on('group.updated', (msg: any) => {
      const g = msg.group;
      set((s) => ({
        groups: s.groups.map((x) => x.id === g.id ? { ...x, name: g.name, emoji: g.emoji } : x),
      }));
    });

    const off4 = wsClient.on('group.deleted', (msg: any) => {
      set((s) => ({ groups: s.groups.filter((x) => x.id !== msg.groupId) }));
    });

    const off5 = wsClient.on('member.updated', () => {
      get().fetchGroups();
    });

    return () => { off1(); off2(); off3(); off4(); off5(); };
  },

  reset: () => set({ groups: [], expenses: {} }),
}), {
  name: 'splitwise-local-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    isDarkMode: state.isDarkMode,
    paletteId: state.paletteId,
    dailyBudget: state.dailyBudget,
    budgetStartDate: state.budgetStartDate,
    budgetEndDate: state.budgetEndDate,
  }),
}));
