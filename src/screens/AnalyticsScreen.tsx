// ============================================================
// AnalyticsScreen – Personal Budgeting & Analytics
// Buckwheat ideology: fully analytics breakdown
// ============================================================
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableRipple, ProgressBar } from 'react-native-paper';
import { useTheme } from '../theme';
import { useStore } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatINR } from '../utils/settlement';
import { useQuickLogs } from '../hooks/useQuickLogs';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function AnalyticsScreen() {
  const nav = useNavigation<Nav>();
  const t = useTheme();
  
  const user = useAuthStore(s => s.user);
  const expenses = useStore(s => s.expenses);
  const dailyBudget = useStore(s => s.dailyBudget);
  const groups = useStore(s => s.groups);
  const addExpense = useStore(s => s.addExpense);
  const fetchExpenses = useStore(s => s.fetchExpenses);

  const [isFetching, setIsFetching] = useState(false);

  // Fetch expenses for all groups on mount to ensure data is fresh even on direct navigation
  useEffect(() => {
    if (groups.length === 0) return;
    setIsFetching(true);
    Promise.all(groups.map(g => fetchExpenses(g.id))).finally(() => setIsFetching(false));
  }, [groups.length]);

  const allExpenses = useMemo(() => Object.values(expenses).flat(), [expenses]);
  
  // Only include expenses paid by the user (Personal Spend)
  const myExpenses = useMemo(() => {
    return allExpenses.filter(e => e.paidById === user?.id);
  }, [allExpenses, user?.id]);

  const stats = useMemo(() => {
    let total = 0;
    const categoryTotals: Record<string, number> = {};
    const thisMonth = new Date().getMonth();
    const today = new Date().toDateString();
    
    let todaySpent = 0;
    
    myExpenses.forEach(e => {
      // Only include expenses from this month for analytics
      const eDate = new Date(e.date);
      if (eDate.getMonth() === thisMonth) {
        total += e.amount;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        
        if (eDate.toDateString() === today) {
          todaySpent += e.amount;
        }
      }
    });

    const categoryArray = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);

    return { total, categoryArray, todaySpent };
  }, [myExpenses]);

  const leftToday = Math.max(0, dailyBudget - stats.todaySpent);

  // Use shared hook instead of duplicating quickLogs logic
  const quickLogs = useQuickLogs(allExpenses, user?.id);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const handleQuickLogPress = async (item: any) => {
    const group = groups.length > 0 ? groups[0] : null;
    if (!group) return; // No group exists to log in

    // Log as a custom personal expense (100% split to me)
    await addExpense({
      groupId: group.id,
      description: item.name,
      amount: item.amt,
      category: item.category,
      paidById: user!.id,
      splitMode: 'custom',
      splitMemberIds: [],
      customSplits: [{ userId: user!.id, amount: item.amt }]
    });
    showToast(`Logged ₹${item.amt} for ${item.name}!`);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'food': return '🍽️';
      case 'transport': return '🚗';
      case 'bills': return '💡';
      case 'shopping': return '🛍️';
      case 'entertainment': return '🍿';
      default: return '📦';
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [t.primary, t.secondary, t.tertiary, t.error, '#4CAF50', '#FF9800'];
    return colors[index % colors.length];
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />
      
      {/* Instant Toast */}
      {toastMsg && (
        <View style={{ position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: t.primaryContainer, padding: 16, borderRadius: 12, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, zIndex: 100 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <MaterialIcons name="check-circle" size={24} color={t.primary} />
            <Text style={{ flex: 1, color: t.onPrimaryContainer, fontSize: 14, fontWeight: '700' }}>{toastMsg}</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableRipple onPress={() => nav.goBack()} style={{ padding: 8, borderRadius: 20 }}>
          <MaterialIcons name="arrow-back" size={24} color={t.onSurface} />
        </TouchableRipple>
        <Text style={[styles.title, { color: t.onSurface }]}>Personal Analytics</Text>
        <TouchableRipple onPress={() => nav.navigate('BudgetConfig')} style={{ padding: 8, borderRadius: 20 }}>
          <MaterialIcons name="settings" size={24} color={t.onSurfaceVariant} />
        </TouchableRipple>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Loading skeleton overlay */}
        {isFetching && allExpenses.length === 0 && (
          <View style={[styles.summaryCard, { backgroundColor: t.surfaceVariant, alignItems: 'center', gap: 12 }]}>
            <ActivityIndicator color={t.primary} size="large" />
            <Text style={{ color: t.onSurfaceVariant, fontWeight: '600' }}>Loading your expenses…</Text>
          </View>
        )}
        
        {/* Month Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: t.primaryContainer }]}>
          <Text style={[styles.summaryLabel, { color: t.onPrimaryContainer }]}>THIS MONTH'S SPEND</Text>
          <Text style={[styles.summaryAmount, { color: t.onPrimaryContainer }]}>{formatINR(stats.total)}</Text>
          <Text style={[styles.summarySub, { color: t.onPrimaryContainer, opacity: 0.8 }]}>
            {stats.todaySpent > 0 ? `${formatINR(stats.todaySpent)} spent today` : 'No spend today'}
          </Text>
        </View>

        {/* Daily Budget Tracker */}
        <View style={[styles.section, { backgroundColor: t.surface }]}>
          <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Daily Budget</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: t.onSurfaceVariant }}>{formatINR(stats.todaySpent)} spent</Text>
            <Text style={{ color: t.onSurfaceVariant, fontWeight: '700' }}>{formatINR(leftToday)} left</Text>
          </View>
          <ProgressBar 
            progress={dailyBudget > 0 ? Math.min(1, stats.todaySpent / dailyBudget) : 0} 
            color={stats.todaySpent > dailyBudget ? t.error : t.primary} 
            style={{ height: 8, borderRadius: 4, backgroundColor: t.surfaceVariant }} 
          />
        </View>

        {/* Quick Log Chips */}
        {quickLogs.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 }}>
              <Text style={[styles.heading, { color: t.onSurfaceVariant, marginLeft: 0, marginBottom: 0 }]}>QUICK LOG</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
              {quickLogs.map((item, i) => (
                <TouchableOpacity key={i} onPress={() => handleQuickLogPress(item)} style={[styles.quickChip, { backgroundColor: t.surfaceVariant }]} activeOpacity={0.7}>
                  <Text style={{ fontSize: 14 }}>{item.icon}</Text>
                  <Text style={[styles.quickChipText, { color: t.onSurface }]}>{item.name} ₹{item.amt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Category Breakdown */}
        <Text style={[styles.heading, { color: t.onSurfaceVariant }]}>SPENDING BY CATEGORY</Text>
        <View style={[styles.section, { backgroundColor: t.surface }]}>
          {stats.categoryArray.length === 0 ? (
            <Text style={{ color: t.onSurfaceVariant, textAlign: 'center', paddingVertical: 20 }}>No data for this month</Text>
          ) : (
            stats.categoryArray.map((cat, index) => (
              <View key={cat.name} style={styles.catRow}>
                <View style={styles.catLeft}>
                  <Text style={styles.catIcon}>{getCategoryIcon(cat.name)}</Text>
                  <View>
                    <Text style={[styles.catName, { color: t.onSurface }]}>{cat.name.charAt(0).toUpperCase() + cat.name.slice(1)}</Text>
                    <Text style={[styles.catPercent, { color: t.onSurfaceVariant }]}>{cat.percent.toFixed(1)}%</Text>
                  </View>
                </View>
                <View style={styles.catRight}>
                  <Text style={[styles.catAmount, { color: t.onSurface }]}>{formatINR(cat.amount)}</Text>
                  <View style={{ width: 80, height: 4, backgroundColor: t.surfaceVariant, borderRadius: 2, marginTop: 4 }}>
                    <View style={{ width: `${cat.percent}%`, height: 4, backgroundColor: getCategoryColor(index), borderRadius: 2 }} />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: { padding: 16, gap: 24, paddingBottom: 60 },
  
  summaryCard: { padding: 24, borderRadius: 24, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
  summaryLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  summaryAmount: { fontSize: 48, fontWeight: '800', marginBottom: 4 },
  summarySub: { fontSize: 14, fontWeight: '600' },

  section: { padding: 20, borderRadius: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },

  heading: { fontSize: 13, fontWeight: '700', letterSpacing: 1, marginLeft: 8, marginBottom: -8 },

  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  catLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catIcon: { fontSize: 24 },
  catName: { fontSize: 16, fontWeight: '600' },
  catPercent: { fontSize: 12, marginTop: 2 },
  catRight: { alignItems: 'flex-end' },
  catAmount: { fontSize: 16, fontWeight: '700' },

  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  quickChipText: { fontSize: 14, fontWeight: '600' }
});
