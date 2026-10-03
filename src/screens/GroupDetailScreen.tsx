// ============================================================
// GroupDetailScreen – Matching media_1790928156069.jpg (Flatmates view)
// ============================================================
import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, StatusBar, FlatList,
  RefreshControl, TextInput
} from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore, Expense, User } from '../store/useStore';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';
import { Avatar, EmptyState, Skeleton } from '../components';
import { formatINR, getMemberSummaries } from '../utils/settlement';
import { api } from '../api/client';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'GroupDetail'>;

export default function GroupDetailScreen() {
  const nav           = useNavigation<Nav>();
  const { groupId }   = useRoute<Route>().params || { groupId: '1' };
  const t             = useTheme();

  const groups          = useStore((s) => s.groups);
  const expenses        = useStore((s) => s.expenses);
  const fetchGroupDetail = useStore((s) => s.fetchGroupDetail);
  const fetchExpenses   = useStore((s) => s.fetchExpenses);
  const deleteExpense   = useStore((s) => s.deleteExpense);
  const deleteGroup     = useStore((s) => s.deleteGroup);
  const addExpense      = useStore((s) => s.addExpense);

  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [quickAddText, setQuickAddText] = useState('');
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const group   = groups.find((g) => g.id === groupId);
  const members: User[] = (group?.members ?? []) as User[];
  const groupExpenses: Expense[] = expenses[groupId] ?? [];

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchGroupDetail(groupId),
      fetchExpenses(groupId)
    ]).finally(() => setIsLoading(false));
  }, [groupId]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchGroupDetail(groupId), fetchExpenses(groupId)]);
    setRefreshing(false);
  }, [groupId]);

  const handleQuickAdd = async () => {
    if (quickAddText.trim().length < 5) return;
    setIsQuickAdding(true);
    try {
      const res = await api.post<{ description: string, amount: number, paidBy: string, splits: {userId: string, amount: number}[] }>('/ai/quick-add', {
        text: quickAddText,
        groupMembers: members.map(m => ({ id: m.id, name: m.name }))
      });
      if (res.data && res.data.amount) {
        await addExpense({
          groupId,
          description: res.data.description || 'AI Quick Add',
          amount: Number(res.data.amount),
          category: 'other',
          paidById: res.data.paidBy || members[0]?.id,
          splitMode: res.data.splits ? 'custom' : 'equally',
          splitMemberIds: members.map(m => m.id),
          customSplits: res.data.splits
        });
        setQuickAddText('');
        refresh();
      }
    } catch (e) {
      Alert.alert('AI Error', 'Could not parse text.');
    } finally {
      setIsQuickAdding(false);
    }
  };

  const totalSpending = useMemo(() => groupExpenses.reduce((s, e) => s + e.amount, 0), [groupExpenses]);
  const summaries = useMemo(() => getMemberSummaries(groupExpenses, members), [groupExpenses, members]);

  const onDeleteExpense = useCallback((id: string) => {
    Alert.alert('Delete?', 'Remove this expense?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(groupId, id) },
    ]);
  }, [deleteExpense, groupId]);

  const onDeleteGroup = useCallback(() => {
    Alert.alert(`Delete "${group?.name}"?`, 'All expenses will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteGroup(groupId); nav.goBack(); } },
    ]);
  }, [group, groupId, deleteGroup, nav]);

  if (!group) return null;

  const renderExpense = ({ item }: { item: Expense }) => (
    <TouchableRipple
      onLongPress={() => onDeleteExpense(item.id)}
     
      style={[styles.expenseRow, { backgroundColor: t.surface }]}
    >
      <View style={styles.expenseLeft}>
        <Text style={[styles.expenseAmount, { color: t.onSurface }]}>
          {item.amount.toLocaleString('en-IN')} ₹
        </Text>
        <Text style={[styles.expenseDesc, { color: t.onSurfaceVariant }]}>{item.description}</Text>
        <Text style={[styles.expensePayer, { color: t.onSurfaceVariant }]}>
          paid by {item.paidByName}
        </Text>
      </View>
    </TouchableRipple>
  );

  const ListHeader = (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableRipple onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]}>
            <MaterialIcons name="arrow-back" size={24} color={t.onSurface} />
          </TouchableRipple>
          <View>
            <Text style={[styles.screenTitle, { color: t.onSurface }]}>{group.name}</Text>
            <Text style={[styles.screenSub, { color: t.onSurfaceVariant }]}>
              {members.length} member{members.length !== 1 ? 's' : ''} · {formatINR(totalSpending)}
            </Text>
          </View>
        </View>
        <TouchableRipple onPress={onDeleteGroup} style={[styles.deleteBtn, { backgroundColor: t.errorContainer + '30' }]}>
          <MaterialIcons name="delete-outline" size={20} color={t.error} />
        </TouchableRipple>
      </View>

      {/* Members */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: t.outline }]}>MEMBERS · {members.length}</Text>
        <View style={styles.membersRow}>
          {members.map((m) => (
            <View key={m.id} style={{ alignItems: 'center' }}>
              <View style={[styles.memberAvatar, { backgroundColor: t.primaryContainer }]}>
                 <Text style={{ fontSize: 16, fontWeight: '700', color: t.onPrimaryContainer }}>{m.name[0]}</Text>
              </View>
              <Text style={[styles.memberName, { color: t.onSurfaceVariant }]}>{m.name.split(' ')[0]}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Balances */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: t.outline }]}>BALANCES</Text>
        <View style={styles.balanceGrid}>
          {summaries.length > 0 ? summaries.map((s) => (
            <View key={s.user.id} style={[styles.balanceCard, { backgroundColor: t.surfaceVariant + '40' }]}>
              <View style={[styles.memberAvatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: t.primaryContainer }]}>
                 <Text style={{ fontSize: 14, fontWeight: '700', color: t.onPrimaryContainer }}>{s.user.name[0]}</Text>
              </View>
              <Text style={[styles.balanceName, { color: t.onSurface }]} numberOfLines={1}>
                {s.user?.name?.split(' ')[0] ?? 'User'}
              </Text>
              <View style={[styles.balancePill, { backgroundColor: s.netBalance >= 0 ? t.primaryContainer : t.errorContainer }]}>
                <Text style={[styles.balanceAmtText, { color: s.netBalance >= 0 ? t.primary : t.error }]}>
                  {s.netBalance >= 0 ? '+' : ''}{formatINR(s.netBalance)}
                </Text>
              </View>
            </View>
          )) : (
            <View style={[styles.balanceCard, { backgroundColor: t.surfaceVariant + '40' }]}>
              <View style={[styles.memberAvatar, { width: 36, height: 36, borderRadius: 18, backgroundColor: t.primaryContainer }]}>
                 <Text style={{ fontSize: 14, fontWeight: '700', color: t.onPrimaryContainer }}>P</Text>
              </View>
              <Text style={[styles.balanceName, { color: t.onSurface }]} numberOfLines={1}>
                You
              </Text>
              <View style={[styles.balancePill, { backgroundColor: t.primaryContainer }]}>
                <Text style={[styles.balanceAmtText, { color: t.primary }]}>
                  +₹0.00
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* AI Quick Add Input */}
      <View style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4, elevation: 2, shadowColor: t.onBackground, shadowOpacity: 0.05, shadowRadius: 8 }}>
          <MaterialIcons name="auto-awesome" size={20} color={t.primary} />
          <TextInput
            style={{ flex: 1, height: 48, marginLeft: 12, fontSize: 15, color: t.onSurface }}
            placeholder="E.g. I paid ₹500 for pizza for everyone"
            placeholderTextColor={t.onSurfaceVariant}
            value={quickAddText}
            onChangeText={setQuickAddText}
            editable={!isQuickAdding}
            onSubmitEditing={handleQuickAdd}
            returnKeyType="send"
          />
          {isQuickAdding && <Text style={{ fontSize: 12, color: t.primary, fontWeight: '700' }}>THINKING...</Text>}
        </View>
      </View>

      {/* Action pills */}
      <View style={styles.actionRow}>
        <TouchableRipple onPress={() => nav.navigate('AddExpense', { groupId })}
          style={[styles.actionPill, { backgroundColor: t.primary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <MaterialIcons name="add" size={20} color={t.onPrimary} />
            <Text style={[styles.actionPillText, { color: t.onPrimary }]}>Add</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={() => nav.navigate('Settlement', { groupId })}
          style={[styles.actionPill, { backgroundColor: t.tertiary }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <FontAwesome5 name="handshake" size={16} color={t.onPrimary} />
            <Text style={[styles.actionPillText, { color: t.onPrimary }]}>Settle Up</Text>
          </View>
        </TouchableRipple>
        <TouchableRipple onPress={() => nav.navigate('GroupInvite', { groupId })}
          style={[styles.actionPill, { backgroundColor: t.surfaceVariant }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <MaterialIcons name="phonelink-ring" size={18} color={t.onSurface} />
            <Text style={[styles.actionPillText, { color: t.onSurface }]}>Invite</Text>
          </View>
        </TouchableRipple>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />
      <FlatList
        data={groupExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ padding: 16, gap: 16 }}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <Skeleton width={50} height={50} borderRadius={25} />
                  <View style={{ flex: 1, gap: 8 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={12} />
                  </View>
                  <Skeleton width={60} height={20} />
                </View>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 40, alignItems: 'center' }}>
               <MaterialIcons name="receipt-long" size={64} color={t.outlineVariant} style={{ marginBottom: 16 }} />
               <Text style={{ fontSize: 22, fontWeight: '700', color: t.onSurface, marginBottom: 8 }}>No expenses yet</Text>
               <Text style={{ fontSize: 14, color: t.onSurfaceVariant, marginBottom: 24 }}>Tap 'Add' to record the first shared bill.</Text>
               <TouchableRipple style={[styles.emptyAddBtn, { backgroundColor: t.primary }]} onPress={() => nav.navigate('AddExpense', { groupId })}>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                   <MaterialIcons name="add" size={20} color={t.onPrimary} />
                   <Text style={{ color: t.onPrimary, fontWeight: '700', fontSize: 16 }}>Add first expense</Text>
                 </View>
               </TouchableRipple>
            </View>
          )
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.primary} colors={[t.primary]} />}
        contentContainerStyle={{ paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  topBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 16 },
  backBtn:        { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  screenTitle:    { fontSize: 24, fontWeight: '900', letterSpacing: -0.3 },
  screenSub:      { fontSize: 13, marginTop: 2, fontWeight: '500' },
  deleteBtn:      { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  
  section:        { marginBottom: 24 },
  sectionLabel:   { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  
  membersRow:     { flexDirection: 'row', gap: 16 },
  memberAvatar:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  memberName:     { fontSize: 13, fontWeight: '500' },
  
  balanceGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  balanceCard:    { width: 100, padding: 12, borderRadius: 20, alignItems: 'center', gap: 8 },
  balanceName:    { fontSize: 13, fontWeight: '700' },
  balancePill:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  balanceAmtText: { fontSize: 12, fontWeight: '800' },

  actionRow:      { flexDirection: 'row', gap: 8, marginBottom: 24 },
  actionPill:     { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 24, gap: 8 },
  actionPillText: { fontSize: 15, fontWeight: '700' },
  
  expenseRow:     { padding: 16, borderRadius: 16, marginBottom: 8 },
  expenseLeft:    { flex: 1 },
  expenseAmount:  { fontSize: 18, fontWeight: '800' },
  expenseDesc:    { fontSize: 15, fontWeight: '600', marginTop: 4 },
  expensePayer:   { fontSize: 13, marginTop: 2 },

  emptyAddBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 28 }
});
