// ============================================================
// SplitWise – Core Type Definitions
// ============================================================

export type SplitMode = 'equally' | 'unequally' | 'custom';

export interface User {
  id: string;
  name: string;
  avatar: string; // emoji or initials fallback
  color: string;  // hex colour for avatar background
}

export interface ExpenseSplit {
  userId: string;
  amount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidById: string;
  splitMode: SplitMode;
  splits: ExpenseSplit[];
  date: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory =
  | 'groceries'
  | 'food'
  | 'transport'
  | 'utilities'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'rent'
  | 'other';

export interface Group {
  id: string;
  name: string;
  emoji: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  from: User;
  to: User;
  amount: number;
}

export interface SettlementReport {
  groupId: string;
  generatedAt: string;
  totalSpending: number;
  perPersonShare: number;
  netBalances: Array<{ user: User; balance: number }>;
  transactions: Transaction[];
}

export interface MemberSummary {
  user: User;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export type RootStackParamList = {
  Home: undefined;
  GroupDetail: { groupId: string };
  AddExpense: { groupId: string; expenseId?: string };
  Settlement: { groupId: string };
  AddGroup: undefined;
  Settings: undefined;
};
