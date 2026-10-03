// ============================================================
// HomeScreen – Buckwheat exact UI (Stitch replica)
// Gradient Hero card · Quick Log · Active Circles
// ============================================================
import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  StatusBar, Animated, Pressable, RefreshControl, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedFAB, ProgressBar } from 'react-native-paper';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import { GroupCard, EmptyState, FloatingTabBar } from '../components';
import { RootStackParamList } from '../types';
import { formatINR } from '../utils/settlement';
import { useAuthStore } from '../store/useAuthStore';
import { useQuickLogs } from '../hooks/useQuickLogs';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const nav = useNavigation<Nav>();
  const t = useTheme();
  const groups = useStore((s) => s.groups);
  const expenses = useStore((s) => s.expenses);
  const fetchGroups = useStore((s) => s.fetchGroups);
  const addExpense = useStore((s) => s.addExpense);
  const isSyncing = useStore((s) => s.isSyncing);
  const user = useAuthStore((s) => s.user);

  const dailyBudget = useStore((s) => s.dailyBudget);

  const [isSearching, setIsSearching] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => { fetchGroups(); }, []);

  const [isExtended, setIsExtended] = useState(true);

  const onScroll = ({ nativeEvent }: any) => {
    const currentScrollPosition = Math.floor(nativeEvent?.contentOffset?.y) ?? 0;
    setIsExtended(currentScrollPosition <= 0);
  };

  const allExpenses = useMemo(() => Object.values(expenses).flat(), [expenses]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const userId = user?.id;

    // Personal expenses = where I am the sole split recipient (paid by me for myself only)
    const personalExpenses = allExpenses.filter(e =>
      e.paidById === userId &&
      e.splits.length === 1 &&
      e.splits[0].userId === userId
    );

    // Personal spend this month
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const personalMonthSpend = personalExpenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
      })
      .reduce((s, e) => s + e.amount, 0);

    // Today's total spend (personal + shared I paid for)
    const todaySpent = allExpenses
      .filter(e => new Date(e.date).toDateString() === today && e.paidById === userId)
      .reduce((s, e) => s + e.amount, 0);

    return { todaySpent, personalMonthSpend };
  }, [allExpenses, user?.id]);

  // Net group balance: positive = others owe me, negative = I owe
  const totalBalance = useMemo(() => {
    if (!user?.id) return 0;
    let net = 0;
    allExpenses.forEach(e => {
      // Skip personal-only expenses
      if (e.splits.length === 1 && e.splits[0].userId === user.id) return;
      const myShare = e.splits.find(s => s.userId === user.id)?.amount ?? 0;
      if (e.paidById === user.id) {
        // I paid – others owe me the amount minus my own share
        net += (e.amount - myShare);
      } else {
        // Someone else paid – I owe my share
        net -= myShare;
      }
    });
    return net;
  }, [allExpenses, user?.id]);

  // Safe Spend budget calc (used in hero card budget bar)
  const leftToday = Math.max(0, dailyBudget - stats.todaySpent);
  const progress = Math.min(100, Math.max(0, dailyBudget > 0 ? (leftToday / dailyBudget) * 100 : 0));

  // Replace inline quickLog computation with shared hook (personal expenses only)
  const quickLogs = useQuickLogs(allExpenses, user?.id);

  const [activeQuickLog, setActiveQuickLog] = React.useState<any>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  const handleQuickLogPress = async (item: any) => {
    if (groups.length === 1) {
      const g = groups[0];
      await addExpense({
        groupId: g.id,
        description: item.name,
        amount: item.amt,
        category: item.category,
        paidById: user!.id,
        splitMode: 'equally',
        splitMemberIds: g.members?.map(m => m.id) || [user!.id]
      });
      showToast(`Logged ₹${item.amt} for ${item.name}!`);
    } else if (groups.length > 1) {
      setActiveQuickLog(item);
    } else {
      nav.navigate('AddGroup');
    }
  };

  const handleCustomExpense = () => {
    if (groups.length === 1) nav.navigate('AddExpense', { groupId: groups[0].id });
    else if (groups.length > 1) setActiveQuickLog({ isCustom: true });
    else nav.navigate('AddGroup');
  };

  const fabScale = useRef(new Animated.Value(1)).current;
  const onFabIn = () => Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true }).start();
  const onFabOut = () => Animated.spring(fabScale, { toValue: 1, useNativeDriver: true }).start();

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const lower = searchQuery.toLowerCase();
    return groups.filter(g => g.name.toLowerCase().includes(lower));
  }, [groups, searchQuery]);

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

      {/* ── Top Header ──────────────────────── */}
      <View style={styles.header}>
        {isSearching ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: t.surfaceVariant, borderRadius: 12, paddingHorizontal: 12, height: 44, marginRight: 8 }}>
            <Text style={{ fontSize: 16, marginRight: 8, color: t.onSurfaceVariant }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: t.onSurface, fontSize: 16 }}
              autoFocus
              placeholder="Search groups..."
              placeholderTextColor={t.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <View style={[styles.logoDot, { backgroundColor: t.primary }]} />
            <View>
              <Text style={[styles.logoText, { color: t.onSurface }]}>Splitwise</Text>
              <Text style={[styles.logoSub, { color: t.onSurfaceVariant }]}>Groups</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: t.surfaceVariant }]}
            onPress={() => {
              if (isSearching) {
                setIsSearching(false);
                setSearchQuery('');
              } else {
                setIsSearching(true);
              }
            }}
          >
            <Text style={{ fontSize: 18 }}>{isSearching ? '✕' : '🔍'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate('Account')}>
            {user ? (
              <View style={[styles.profileAvatar, { backgroundColor: user.color, borderColor: t.primaryContainer }]}>
                <Text style={{ fontSize: 14, color: '#fff', fontWeight: '800' }}>{user.avatar}</Text>
              </View>
            ) : (
              <View style={[styles.profileAvatar, { backgroundColor: t.surfaceVariant }]} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={isSyncing} onRefresh={fetchGroups} tintColor={t.primary} />}
      >
        {/* ── Dual-Stat Hero Card ──────────────────────────────── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => nav.navigate('Analytics')}>
          <LinearGradient
            colors={[t.primaryContainer, t.primary, '#283e1d']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { shadowColor: t.primary }]}
          >
            {/* Row: two stat pillars */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Left – Group Balance */}
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 14 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>GROUP BALANCE</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={[
                    { fontSize: 20, fontWeight: '900', color: totalBalance < 0 ? '#ff8a80' : totalBalance === 0 ? 'rgba(255,255,255,0.6)' : '#b9f6ca' },
                  ]}
                >
                  {totalBalance === 0 ? 'Settled' : (totalBalance < 0 ? '-' : '+') + formatINR(Math.abs(totalBalance))}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: '600' }}>
                  {totalBalance < 0 ? 'you owe' : totalBalance === 0 ? 'all clear' : 'you get back'}
                </Text>
              </View>

              {/* Right – Personal Spend this month */}
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', borderRadius: 16, padding: 14 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>MY SPEND (MTD)</Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}
                >
                  {formatINR(stats.personalMonthSpend)}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: '600' }}>personal this month</Text>
              </View>
            </View>

            {/* Budget bar at bottom */}
            {dailyBudget > 0 && (
              <View style={{ marginTop: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 1, color: 'rgba(255,255,255,0.6)' }}>DAILY SAFE SPEND</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.9)' }}>{formatINR(leftToday)} left</Text>
                </View>
                <ProgressBar progress={progress / 100} color={t.primaryLight} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, height: 6 }} />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Quick Log Chips ──────────────────────────────── */}
        <View style={styles.quickLogSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: t.onSurfaceVariant }]}>QUICK LOG</Text>
            <TouchableOpacity onPress={handleCustomExpense}>
              <Text style={[styles.sectionLink, { color: t.primary }]}>+ Custom</Text>
            </TouchableOpacity>
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

        {/* ── Active Circles ──────────────────────────────── */}
        <View style={styles.circlesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.circlesTitle, { color: t.onSurface }]}>Active Circles</Text>
            <Text style={[styles.circlesSub, { color: t.onSurfaceVariant }]}>{filteredGroups.length} Active</Text>
          </View>

          {filteredGroups.length === 0 ? (
            <EmptyState
              emoji="🌾"
              title="No groups found"
              subtitle={isSearching ? "No groups match your search." : "Create a group to track expenses."}
            />
          ) : (
          filteredGroups.map((g) => {
              // Compute actual net balance for this user in this group from local expense data
              const groupExpenses = expenses[g.id] ?? [];
              let groupNet = 0;
              groupExpenses.forEach(e => {
                if (e.isPersonal || (e.splits && e.splits.length === 1 && e.splits[0]?.userId === user?.id)) return;
                const myShare = e.splits?.find(s => s.userId === user?.id)?.amount ?? 0;
                if (e.paidById === user?.id) groupNet += (e.amount - myShare);
                else groupNet -= myShare;
              });
              const isOwed = groupNet > 0;
              const isOwing = groupNet < 0;
              return (
              <TouchableOpacity
                key={g.id}
                activeOpacity={0.8}
                onPress={() => nav.navigate('GroupDetail', { groupId: g.id })}
                style={[styles.circleCard, { backgroundColor: t.surface, shadowColor: t.onBackground }]}
              >
                <View style={[styles.circleIcon, { backgroundColor: t.surfaceVariant }]}>
                  <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.circleName, { color: t.onSurface }]}>{g.name}</Text>
                  <Text style={[styles.circleRole, { color: t.onSurfaceVariant }]}>
                    {g.memberCount} member{g.memberCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={[styles.circleBadge, { backgroundColor: isOwing ? t.errorContainer : isOwed ? t.secondaryContainer : t.surfaceVariant }]}>
                  <Text style={[styles.circleBadgeText, { color: isOwing ? t.error : isOwed ? t.onSecondaryContainer : t.onSurfaceVariant }]}>
                    {isOwing ? `You owe ${formatINR(Math.abs(groupNet))}` : isOwed ? `+${formatINR(groupNet)}` : 'Settled'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
            })
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <AnimatedFAB
        icon="plus"
        label="New Group"
        extended={isExtended}
        onPress={() => nav.navigate('AddGroup')}
        visible={true}
        animateFrom={'right'}
        iconMode={'dynamic'}
        style={[styles.fabStyle, { backgroundColor: t.primary }]}
        color={t.onPrimary}
      />

      <FloatingTabBar active="groups" />

      {/* ── Group Picker Modal for Quick Log ──────────────── */}
      {activeQuickLog && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActiveQuickLog(null)} />
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <Text style={[styles.modalTitle, { color: t.onSurface }]}>Which group?</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.modalRow, { borderBottomColor: t.surfaceVariant }]}
                  onPress={async () => {
                    const log = activeQuickLog;
                    setActiveQuickLog(null);
                    if (log.isCustom) {
                      nav.navigate('AddExpense', { groupId: g.id });
                    } else {
                      await addExpense({
                        groupId: g.id,
                        description: log.name,
                        amount: log.amt,
                        category: log.category,
                        paidById: user!.id,
                        splitMode: 'equally',
                        splitMemberIds: g.members?.map(m => m.id) || [user!.id]
                      });
                      showToast(`Logged ₹${log.amt} for ${log.name}!`);
                    }
                  }}
                >
                  <View style={[styles.circleIcon, { backgroundColor: t.surfaceVariant, width: 36, height: 36, borderRadius: 10 }]}>
                    <Text style={{ fontSize: 16 }}>{g.emoji}</Text>
                  </View>
                  <Text style={[styles.modalRowText, { color: t.onSurface }]}>{g.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64 },
  logoDot: { width: 20, height: 20, borderRadius: 6 },
  logoText: { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  logoSub: { fontSize: 11, fontWeight: '600' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },

  heroCard: { borderRadius: 24, padding: 20, elevation: 8, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  heroBadgeText: { fontSize: 11, fontWeight: '800' },
  heroMid: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 16 },
  heroAmount: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },
  heroSub: { fontSize: 14, fontWeight: '600' },
  heroBarBg: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 16, overflow: 'hidden' },
  heroBarFill: { height: '100%', borderRadius: 4 },

  quickLogSection: { marginTop: 24, gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionLink: { fontSize: 12, fontWeight: '800' },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999 },
  quickChipText: { fontSize: 13, fontWeight: '700' },

  circlesSection: { marginTop: 24, gap: 12 },
  circlesTitle: { fontSize: 18, fontWeight: '800' },
  circlesSub: { fontSize: 12, fontWeight: '600' },
  circleCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  circleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  circleName: { fontSize: 15, fontWeight: '700' },
  circleRole: { fontSize: 12, marginTop: 2 },
  circleBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  circleBadgeText: { fontSize: 11, fontWeight: '800' },

  fabStyle: { position: 'absolute', bottom: 100, right: 24, borderRadius: 28, elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },

  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16 },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  modalRowText: { fontSize: 16, fontWeight: '600' },
});
