// ============================================================
// src/hooks/useQuickLogs.ts
// Shared hook – compute top-5 repeated expenses as Quick Log chips
// Used by HomeScreen and AnalyticsScreen to eliminate duplication
// ============================================================
import { useMemo } from 'react';
import { Expense } from '../store/useStore';

export interface QuickLogItem {
  icon: string;
  name: string;
  amt: number;
  category: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  groceries: '??', food: '???', transport: '??', utilities: '?',
  entertainment: '??', health: '??', shopping: '???', rent: '??', other: '??',
};

export function useQuickLogs(allExpenses: Expense[], userId?: string): QuickLogItem[] {
  return useMemo(() => {
    if (allExpenses.length === 0) return [];

    // Filter to personal expenses for per-user quick log, or use all if no userId
    const source = userId
      ? allExpenses.filter(e =>
          e.paidById === userId &&
          (e.isPersonal === true ||
            (e.splits && e.splits.length === 1 && e.splits[0].userId === userId))
        )
      : allExpenses;

    if (source.length === 0) return [];

    const counts: Record<string, { count: number; amt: number; category: string; name: string }> = {};
    source.forEach(e => {
      const key = e.description.toLowerCase().trim();
      if (!key) return;
      const compositeKey = `${key}_${e.amount}`;
      if (!counts[compositeKey]) counts[compositeKey] = { count: 0, amt: e.amount, category: e.category, name: e.description };
      counts[compositeKey].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(data => ({
        icon: CATEGORY_ICONS[data.category] ?? '??',
        name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
        amt: data.amt,
        category: data.category,
      }));
  }, [allExpenses, userId]);
}
