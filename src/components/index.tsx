// ============================================================
// SplitWise – Shared Components (theme-aware, Buckwheat style)
// ============================================================
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme, Theme } from '../theme';
import { User, Expense } from '../types';
import { formatINR, formatDate } from '../utils/settlement';

export const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🛒', food: '🍽️', transport: '🚗', utilities: '⚡',
  entertainment: '🎬', health: '💊', shopping: '🛍️', rent: '🏠', other: '📦',
};

export * from './FloatingTabBar';
export * from './Skeleton';

export const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#4CAF50', food: '#FF9800', transport: '#2196F3',
  utilities: '#9C27B0', entertainment: '#E91E63', health: '#F44336',
  shopping: '#FF5722', rent: '#607D8B', other: '#795548',
};

// ── Avatar ────────────────────────────────────────────────
export function Avatar({ user, size = 40, showName = false }: { user: User; size?: number; showName?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View style={[styles.avatarBase, { width: size, height: size, borderRadius: size / 2, backgroundColor: user.color }]}>
        <Text style={{ fontSize: size * 0.38, color: '#fff', fontWeight: '700' }}>{user.avatar}</Text>
      </View>
      {showName && <Text style={{ fontSize: 11, color: t.onSurfaceVariant, maxWidth: 52, textAlign: 'center' }} numberOfLines={1}>{user?.name?.split(' ')[0] ?? 'User'}</Text>}
    </View>
  );
}

// ── Expense Row (Buckwheat list style) ────────────────────
export function ExpenseRow({ expense, paidBy, onLongPress }: { expense: Expense; paidBy: User | undefined; onLongPress?: () => void }) {
  const t = useTheme();
  const icon = CATEGORY_ICONS[expense.category] ?? '📦';
  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.7} style={[styles.expenseRow, { borderBottomColor: t.outlineVariant }]}>
      <View style={[styles.expenseIconWrap, { backgroundColor: t.surfaceVariant }]}>
        <Text style={{ fontSize: 18 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: t.onSurface }}>{expense.description}</Text>
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant, marginTop: 2 }}>
          {paidBy?.name ?? 'Unknown'} · {formatDate(expense.date)}
        </Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '800', color: t.onSurface }}>{formatINR(expense.amount)}</Text>
    </TouchableOpacity>
  );
}

// ── Group Card (Buckwheat warm card) ─────────────────────
export function GroupCard({ group, total, memberCount, onPress }: { group: { id: string; name: string; emoji: string }; total: number; memberCount: number; onPress: () => void }) {
  const t = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.groupCard, { backgroundColor: t.surface, shadowColor: t.onBackground }]}>
      <View style={[styles.groupEmojiBox, { backgroundColor: t.surfaceVariant }]}> 
        <Text style={{ fontSize: 28 }}>{group.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: t.onSurface }}>{group.name}</Text>
        <Text style={{ fontSize: 12, color: t.onSurfaceVariant, marginTop: 2 }}>Your share {formatINR(total)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <View style={[styles.groupBalancePill, { backgroundColor: t.secondaryContainer }]}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: t.onSecondaryContainer }}> {memberCount} member{memberCount === 1 ? '' : 's'} </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Budget Chip (like Buckwheat "For today ₹37") ─────────
export function BudgetChip({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <View style={[styles.budgetChip, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 12, color, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 20, fontWeight: '900', color }}>{value}</Text>
    </View>
  );
}

// ── Numpad (Buckwheat signature UI) ──────────────────────
export function Numpad({ onKey, theme: t }: { onKey: (key: string) => void; theme: Theme }) {
  const keys = ['7','8','9','4','5','6','1','2','3','.','0','⌫'];
  return (
    <View style={styles.numpad}>
      {keys.map((k) => (
        <TouchableOpacity
          key={k}
          onPress={() => onKey(k)}
          activeOpacity={0.7}
          style={[styles.numpadKey, { backgroundColor: k === '⌫' ? t.secondaryContainer : t.keypadKey }]}
        >
          <Text style={[styles.numpadKeyText, { color: k === '⌫' ? t.secondary : t.keypadKeyText }]}>{k}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Screen Header ─────────────────────────────────────────
export function ScreenHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: t.background }]}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 18, color: t.onSurface }}>←</Text>
        </TouchableOpacity>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: t.onBackground }}>{title}</Text>
        {subtitle && <Text style={{ fontSize: 12, color: t.onSurfaceVariant }}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

// ── Balance Pill ──────────────────────────────────────────
export function BalancePill({ amount }: { amount: number }) {
  const positive = amount >= 0;
  const color = positive ? '#4CAF50' : '#F44336';
  const bg = positive ? '#4CAF5022' : '#F4433622';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={{ fontSize: 13, fontWeight: '800', color }}>
        {positive ? '+' : ''}{formatINR(amount)}
      </Text>
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────
export function EmptyState({ emoji, title, subtitle, action }: { emoji: string; title: string; subtitle: string; action?: { label: string; onPress: () => void } }) {
  const t = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 56, marginBottom: 16 }}>{emoji}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: t.onSurface, textAlign: 'center' }}>{title}</Text>
      <Text style={{ fontSize: 14, color: t.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>{subtitle}</Text>
      {action && (
        <TouchableOpacity onPress={action.onPress} style={[styles.emptyBtn, { backgroundColor: t.primaryContainer }]}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.onPrimaryContainer }}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Divider ───────────────────────────────────────────────
export function Divider() {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.outlineVariant, marginVertical: 4 }} />;
}

// ── Transaction Arrow Card (Settle Up) ───────────────────
export function TxCard({ from, to, amount, step }: { from: User; to: User; amount: number; step: number }) {
  const t = useTheme();
  return (
    <View style={[styles.txCard, { backgroundColor: t.surface, shadowColor: t.onBackground }]}>
      <View style={[styles.txStep, { backgroundColor: t.primary }]}>
        <Text style={{ fontSize: 12, fontWeight: '800', color: t.onPrimary }}>{step}</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 4, minWidth: 58 }}>
        <Avatar user={from} size={40} />
        <Text style={{ fontSize: 11, color: t.onSurface, fontWeight: '600' }} numberOfLines={1}>{from?.name?.split(' ')[0] ?? 'User'}</Text>
      </View>
      <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '900', color: t.primary }}>{formatINR(amount)}</Text>
        <Text style={{ fontSize: 20, color: t.primary }}>→</Text>
      </View>
      <View style={{ alignItems: 'center', gap: 4, minWidth: 58 }}>
        <Avatar user={to} size={40} />
        <Text style={{ fontSize: 11, color: t.onSurface, fontWeight: '600' }} numberOfLines={1}>{to?.name?.split(' ')[0] ?? 'User'}</Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  avatarBase: { alignItems: 'center', justifyContent: 'center' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1 },
  expenseIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 22, marginBottom: 12 },
  groupEmojiBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  groupBalancePill: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 999 },
  budgetChip: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, minWidth: 110 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 10 },
  numpadKey: { width: '30%', aspectRatio: 1.6, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  numpadKeyText: { fontSize: 22, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 4 },
  emptyBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999 },
  txCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 20, marginBottom: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  txStep: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
