// ============================================================
// src/types/index.ts – All navigation param lists + shared types
// ============================================================

// ── Auth stack (unauthenticated) ──────────────────────────────
export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
};

// ── Main stack (authenticated) ────────────────────────────────
export type RootStackParamList = {
  Home:        undefined;
  Activity:    undefined;
  Analytics:   undefined;
  GroupDetail: { groupId: string };
  AddExpense:  { groupId: string; defaultDesc?: string; defaultAmt?: number; defaultCat?: string };
  Settlement:  { groupId: string };
  AddGroup:    undefined;
  Settings:    undefined;
  Account:     undefined;
  GroupInvite: { groupId: string };
  Scan:        undefined;
  BudgetConfig: undefined;
  BudgetCalendar: undefined;
};

// ── Shared domain types ───────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email?: string;
  color: string;
  avatar: string;
  role?: string;
}

export type ExpenseCategory =
  | 'groceries' | 'food' | 'transport' | 'utilities'
  | 'entertainment' | 'health' | 'shopping' | 'rent' | 'other';

export type SplitMode = 'equally' | 'unequally' | 'custom';

export interface ExpenseSplit {
  userId: string;
  amount: number;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  paidByName: string;
  paidByColor?: string;
  splitMode: SplitMode;
  splits?: ExpenseSplit[];
  date: string;
  createdAt: string;
  isPersonal?: boolean;
}
