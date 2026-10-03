import { Expense as TypesExpense } from '../types';

export interface User { id: string; name: string; email?: string; color: string; avatar: string; role?: string; }
export interface Transaction { from: User; to: User; amount: number; }
export interface MemberSummary { user: User; totalPaid: number; totalOwed: number; netBalance: number; }
export interface SettlementReport {
  groupId: string; generatedAt: string;
  totalSpending: number; perPersonShare: number;
  netBalances: Array<{ user: User; balance: number }>;
  transactions: Transaction[];
}

// Loose expense type accepted by all utils (compatible with both stores)
export interface LooseExpense {
  amount: number;
  paidById: string;
  splits?: any[];
}

/**
 * Calculates net balance for each user in a group.
 * Positive = creditor (others owe them), Negative = debtor (they owe others)
 */
export function calculateNetBalances(
  expenses: LooseExpense[],
  members: User[]
): Map<string, number> {
  const balanceMap = new Map<string, number>();
  members.forEach((m) => balanceMap.set(m.id, 0));

  for (const expense of expenses) {
    // Payer gains credit for the full amount
    const currentPayer = balanceMap.get(expense.paidById) ?? 0;
    balanceMap.set(expense.paidById, currentPayer + expense.amount);

    // Each person in the split loses their share
    for (const split of (expense.splits ?? [])) {
      const current = balanceMap.get(split.userId) ?? 0;
      balanceMap.set(split.userId, current - split.amount);
    }
  }

  return balanceMap;
}

/**
 * Core settlement algorithm: minimize the number of transactions.
 *
 * Algorithm:
 * 1. Build net balances (paid - owed per person)
 * 2. Separate into creditors (+) and debtors (-)
 * 3. Greedily match largest debtor → largest creditor
 *    until all debts are settled
 *
 * Time complexity: O(n log n), n = number of members
 */
export function simplifyDebts(
  balanceMap: Map<string, number>,
  members: User[]
): Transaction[] {
  const EPSILON = 0.005; // round-off tolerance

  const userMap = new Map<string, User>();
  members.forEach((m) => userMap.set(m.id, m));

  // Build working lists of creditors and debtors
  const creditors: Array<{ id: string; amount: number }> = [];
  const debtors: Array<{ id: string; amount: number }> = [];

  balanceMap.forEach((balance, userId) => {
    if (balance > EPSILON) creditors.push({ id: userId, amount: balance });
    else if (balance < -EPSILON) debtors.push({ id: userId, amount: -balance });
  });

  // Sort descending – process largest first for fewest transactions
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions: Transaction[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];

    const transfer = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: userMap.get(debtor.id)!,
      to: userMap.get(creditor.id)!,
      amount: Math.round(transfer * 100) / 100,
    });

    creditor.amount -= transfer;
    debtor.amount -= transfer;

    if (creditor.amount < EPSILON) ci++;
    if (debtor.amount < EPSILON) di++;
  }

  return transactions;
}

/**
 * Full settlement report generator.
 * Wraps calculateNetBalances + simplifyDebts with metadata.
 */
export function generateSettlementReport(
  groupId: string,
  expenses: LooseExpense[],
  members: User[]
): SettlementReport {
  const totalSpending = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = members.length > 0 ? totalSpending / members.length : 0;

  const balanceMap = calculateNetBalances(expenses, members);
  const transactions = simplifyDebts(balanceMap, members);

  const netBalances = members.map((user) => ({
    user,
    balance: Math.round((balanceMap.get(user.id) ?? 0) * 100) / 100,
  }));

  return {
    groupId,
    generatedAt: new Date().toISOString(),
    totalSpending: Math.round(totalSpending * 100) / 100,
    perPersonShare: Math.round(perPersonShare * 100) / 100,
    netBalances,
    transactions,
  };
}

/**
 * Per-member spending summary for analytics cards.
 */
export function getMemberSummaries(
  expenses: LooseExpense[],
  members: User[]
): MemberSummary[] {
  const paidMap = new Map<string, number>();
  const owedMap = new Map<string, number>();
  members.forEach((m) => { paidMap.set(m.id, 0); owedMap.set(m.id, 0); });

  for (const expense of expenses) {
    paidMap.set(expense.paidById, (paidMap.get(expense.paidById) ?? 0) + expense.amount);
    for (const split of (expense.splits ?? [])) {
      owedMap.set(split.userId, (owedMap.get(split.userId) ?? 0) + split.amount);
    }
  }

  return members.map((user) => {
    const totalPaid = paidMap.get(user.id) ?? 0;
    const totalOwed = owedMap.get(user.id) ?? 0;
    return {
      user,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      netBalance: Math.round((totalPaid - totalOwed) * 100) / 100,
    };
  });
}

/**
 * Distribute an expense amount equally among given member IDs.
 * Returns rounded splits that sum exactly to total.
 */
export function splitEqually(amount: number, memberIds: string[]): Array<{ userId: string; amount: number }> {
  if (memberIds.length === 0) return [];
  const share = Math.floor((amount / memberIds.length) * 100) / 100;
  const remainder = Math.round((amount - share * memberIds.length) * 100) / 100;
  return memberIds.map((id, idx) => ({
    userId: id,
    amount: idx === 0 ? Math.round((share + remainder) * 100) / 100 : share,
  }));
}

/** Format a number as Indian Rupee string */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Generate a stable color from a string (for avatar backgrounds) */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 45%)`;
}

/** Get initials from a name (max 2 chars) */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

/** Format ISO date string to readable format */
export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

/** Generate a UUID-like unique ID */
export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
