// ============================================================
// ActivityScreen – Stitch Activity Feed UI
// ============================================================
import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View, Text, SectionList, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { TouchableRipple } from 'react-native-paper';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import { CATEGORY_ICONS, EmptyState, FloatingTabBar } from '../components';
import { formatINR } from '../utils/settlement';
import { Expense } from '../types';
import { useAuthStore } from '../store/useAuthStore';

type FilterType = 'all' | 'expense' | 'settlement';

// Helper to format date string into Today / Yesterday / Date
function formatSectionHeader(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = d.toDateString() === today.toDateString();
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return { label: 'Today', sub: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
  if (isYesterday) return { label: 'Yesterday', sub: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) };
  
  return { 
    label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 
    sub: d.toLocaleDateString('en-GB', { weekday: 'long' }) 
  };
}

export default function ActivityScreen() {
  const nav      = useNavigation<any>();
  const t        = useTheme();
  const expenses = useStore((s) => s.expenses);
  const groups   = useStore((s) => s.groups);
  const user     = useAuthStore((s) => s.user);

  const [filter, setFilter] = useState<FilterType>('all');
  
  // Pulse animation for the live dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const sections = useMemo(() => {
    const groupMap = new Map(groups.map((g) => [g.id, g]));
    let filtered = Object.entries(expenses)
      .flatMap(([groupId, list]) =>
        list.map((e) => ({
          ...e,
          groupName:  groupMap.get(groupId)?.name  ?? 'Group',
          groupEmoji: groupMap.get(groupId)?.emoji ?? '👥',
        }))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
    // Simplified filter logic
    if (filter === 'settlement') {
        filtered = filtered.filter(e => e.description.toLowerCase().includes('settle'));
    }

    // Group by Date
    const grouped: Record<string, any[]> = {};
    filtered.forEach(e => {
      const d = new Date(e.date).toDateString();
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(e);
    });

    return Object.entries(grouped).map(([date, data]) => ({
      date,
      data
    }));
  }, [expenses, groups, filter]);

  const renderItem = ({ item }: { item: any }) => {
    const isSettlement = item.description.toLowerCase().includes('settle');
    
    const isMe = item.paidById === user?.id;
    const mySplit = item.splits?.find((s: any) => s.userId === user?.id);
    const myShareAmount = mySplit ? Number(mySplit.amount) : 0;
    const myPayment = isMe ? Number(item.amount) : 0;
    const net = myPayment - myShareAmount;
    const isLender = net > 0;
    const shares = item.splits?.length || 2;

    if (isSettlement) {
      return (
        <View style={styles.activityCardWrapper}>
          <TouchableRipple
            onPress={() => nav.navigate('GroupDetail', { groupId: item.groupId })}
            style={[styles.activityCard, { backgroundColor: t.surface }]}
          >
            <View>
              <View style={styles.cardTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                  <View style={[styles.iconBox, { backgroundColor: t.primaryLight }]}>
                    <MaterialIcons name="balance" size={24} color={t.onPrimary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={[styles.cardTitle, { color: t.onSurface }]}>{item.description}</Text>
                      <Text style={[styles.cardTime, { color: t.outline }]}>• {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <Text style={[styles.cardSub, { color: t.onSurfaceVariant }]} numberOfLines={1}>
                      Ledger Rebalance • Verified by mutual sign-off
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <Text style={[styles.amount, { color: t.onSurface }]}>{formatINR(item.amount)}</Text>
                  <View style={[styles.statusPill, { backgroundColor: t.secondaryContainer, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                    <MaterialIcons name="done-all" size={12} color={t.onSecondaryContainer} />
                    <Text style={[styles.statusPillText, { color: t.onSecondaryContainer }]}>Reconciled</Text>
                  </View>
                </View>
              </View>
              <View style={[styles.bottomRibbon, { borderTopWidth: 0, paddingTop: 10 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="sync-alt" size={15} color={t.secondary} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: t.secondary }}>Mutual sign-off verified</Text>
                </View>
                <Text style={{ fontSize: 11, fontWeight: '700', color: t.outline }}>Balance Cleared</Text>
              </View>
            </View>
          </TouchableRipple>
        </View>
      );
    }

    return (
      <View style={styles.activityCardWrapper}>
        <TouchableRipple
          onPress={() => nav.navigate('GroupDetail', { groupId: item.groupId })}
          style={[styles.activityCard, { backgroundColor: t.surface }]}
        >
          <View>
            <View style={styles.cardTop}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 }}>
                <View style={[styles.iconBox, { backgroundColor: t.secondaryContainer, shadowColor: t.onBackground, elevation: 1 }]}>
                  <Text style={{ fontSize: 24 }}>{CATEGORY_ICONS[item.category] ?? '📦'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.cardTitle, { color: t.onSurface }]} numberOfLines={1}>{item.description}</Text>
                    <View style={[styles.groupPill, { backgroundColor: t.surfaceVariant }]}>
                      <Text style={[styles.groupPillText, { color: t.secondary }]}>{item.groupName}</Text>
                    </View>
                  </View>
                  <Text style={[styles.cardSub, { color: t.onSurfaceVariant }]}>
                    {isMe ? 'You' : item.paidByName} paid {formatINR(item.amount)} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
              
              <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                {net === 0 ? (
                  <Text style={[styles.amount, { color: t.outline }]}>not involved</Text>
                ) : (
                  <>
                    <Text style={[styles.amount, { color: isLender ? t.primary : t.error }]}>
                      {isLender ? '+' : '-'}{formatINR(Math.abs(net))}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: isLender ? 'rgba(202, 237, 181, 0.4)' : t.errorContainer }]}>
                      <Text style={[styles.statusPillText, { color: isLender ? t.primaryContainer : t.error }]}>
                        {isLender ? 'you lent' : 'you owe'}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
            
            {/* Bottom Ribbon Context */}
            <View style={[styles.bottomRibbon, { backgroundColor: t.surfaceVariant + '66' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={styles.avatarStack}>
                  {(item.splits || []).slice(0, 3).map((split: any, idx: number) => (
                    <View key={split.userId} style={[styles.miniAvatar, { backgroundColor: split.color || t.primaryContainer, zIndex: 3 - idx, marginLeft: idx > 0 ? -8 : 0 }]}>
                      <Text style={styles.miniAvatarText}>{split.name ? split.name.charAt(0).toUpperCase() : '?'}</Text>
                    </View>
                  ))}
                  {(item.splits?.length || 0) > 3 && (
                    <View style={[styles.miniAvatar, { backgroundColor: t.surfaceVariant, zIndex: 0, marginLeft: -8 }]}>
                      <Text style={styles.miniAvatarText}>+{(item.splits?.length || 0) - 3}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.ribbonText, { color: t.onSurfaceVariant }]}>
                  {item.splitMode === 'custom' ? `Custom split (${shares})` : `Split equally (${shares})`}
                </Text>
              </View>
              <TouchableOpacity style={styles.receiptBtn}>
                <MaterialIcons name="receipt" size={18} color={t.outline} />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableRipple>
      </View>
    );
  };

  const renderSectionHeader = ({ section: { date } }: { section: any }) => {
    const { label, sub } = formatSectionHeader(date);
    return (
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionPill, { backgroundColor: label === 'Today' ? t.secondaryContainer : t.surfaceVariant }]}>
          <Text style={[styles.sectionPillText, { color: label === 'Today' ? t.onSecondaryContainer : t.onSurfaceVariant }]}>{label.toUpperCase()}</Text>
        </View>
        <View style={[styles.sectionLine, { backgroundColor: t.surfaceVariant }]} />
        <Text style={[styles.sectionSub, { color: t.outline }]}>{sub}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />
      
      {/* ── Top Header ──────────────────────── */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={[styles.logoDot, { backgroundColor: t.primary }]} />
          <View>
            <Text style={[styles.logoText, { color: t.onSurface }]}>Splitwise</Text>
            <Text style={[styles.logoSub, { color: t.onSurfaceVariant }]}>Activity Feed</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: 'transparent' }]}>
            <MaterialIcons name="search" size={24} color={t.onSurfaceVariant} />
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

      <View style={{ paddingHorizontal: 16, flex: 1 }}>
        {/* Micro Pulse Toast & Summary */}
        <View style={styles.pulseRow}>
          <View style={[styles.toastPill, { backgroundColor: t.surfaceVariant, elevation: 1 }]}>
            <Animated.View style={[styles.pulseDot, { backgroundColor: t.primary, opacity: pulseAnim }]} />
            <Text style={[styles.toastText, { color: t.secondary }]}>Active Ledger: March 2025</Text>
          </View>
          <TouchableOpacity style={[styles.summaryBtn, { backgroundColor: t.secondaryContainer }]}>
            <MaterialIcons name="insights" size={16} color={t.onSecondaryContainer} />
            <Text style={[styles.summaryText, { color: t.onSecondaryContainer }]}>Summary</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingRight: 16 }}>
            <TouchableOpacity onPress={() => setFilter('all')} style={[styles.filterPill, filter === 'all' ? { backgroundColor: t.primary } : { backgroundColor: t.surfaceVariant }]}>
              <MaterialIcons name="stream" size={18} color={filter === 'all' ? t.onPrimary : t.onSurfaceVariant} />
              <Text style={[styles.filterText, filter === 'all' ? { color: t.onPrimary } : { color: t.onSurfaceVariant }]}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilter('expense')} style={[styles.filterPill, filter === 'expense' ? { backgroundColor: t.primary } : { backgroundColor: t.surfaceVariant }]}>
              <MaterialIcons name="receipt-long" size={18} color={filter === 'expense' ? t.onPrimary : t.onSurfaceVariant} />
              <Text style={[styles.filterText, filter === 'expense' ? { color: t.onPrimary } : { color: t.onSurfaceVariant }]}>Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilter('settlement')} style={[styles.filterPill, filter === 'settlement' ? { backgroundColor: t.primary } : { backgroundColor: t.surfaceVariant }]}>
              <MaterialIcons name="check-circle" size={18} color={filter === 'settlement' ? t.onPrimary : t.onSurfaceVariant} />
              <Text style={[styles.filterText, filter === 'settlement' ? { color: t.onPrimary } : { color: t.onSurfaceVariant }]}>Reconciled</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              emoji="📋"
              title="No activity yet"
              subtitle="Add expenses to groups to see them here."
            />
          }
        />
      </View>
      <FloatingTabBar active="activity" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64, zIndex: 50 },
  logoDot:         { width: 20, height: 20, borderRadius: 6 },
  logoText:        { fontSize: 16, fontWeight: '800', lineHeight: 20 },
  logoSub:         { fontSize: 11, fontWeight: '600' },
  iconBtn:         { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  profileAvatar:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  
  pulseRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  toastPill:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pulseDot:        { width: 8, height: 8, borderRadius: 4 },
  toastText:       { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  summaryBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  summaryText:     { fontSize: 11, fontWeight: '700' },

  filterRow:       { marginTop: 12, marginBottom: 4 },
  filterPill:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, height: 40, borderRadius: 20 },
  filterText:      { fontSize: 14, fontWeight: '700' },

  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  sectionPill:     { paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  sectionPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  sectionLine:     { flex: 1, height: 2, borderRadius: 1 },
  sectionSub:      { fontSize: 11, fontWeight: '700' },

  activityCardWrapper: { paddingVertical: 6 },
  activityCard:    { borderRadius: 28, overflow: 'hidden', elevation: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTop:         { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16 },
  iconBox:         { width: 48, height: 48, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle:       { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  cardTime:        { fontSize: 12, fontWeight: '500' },
  groupPill:       { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  groupPillText:   { fontSize: 10, fontWeight: '700' },
  cardSub:         { fontSize: 12, marginTop: 4 },
  amount:          { fontSize: 16, fontWeight: '800' },
  statusPill:      { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, marginTop: 4 },
  statusPillText:  { fontSize: 10, fontWeight: '700' },

  bottomRibbon:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarStack:     { flexDirection: 'row', alignItems: 'center' },
  miniAvatar:      { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  miniAvatarText:  { fontSize: 10, fontWeight: '800', color: '#fff' },
  ribbonText:      { fontSize: 11, fontWeight: '600' },
  receiptBtn:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.03)' }
});
