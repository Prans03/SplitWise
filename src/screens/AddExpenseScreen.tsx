// ============================================================
// AddExpenseScreen – Redesigned based on Buckwheat media_1790908546298.png
// ============================================================
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, Image, TouchableOpacity, Alert
} from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useStore, User } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';

type Nav   = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'AddExpense'>;

export default function AddExpenseScreen() {
  const nav      = useNavigation<Nav>();
  const route    = useRoute<Route>();
  const { groupId, defaultDesc, defaultAmt, defaultCat } = route.params || { groupId: '1' };

  const t = useTheme();
  const groups     = useStore((s) => s.groups);
  const addExpense = useStore((s) => s.addExpense);
  const fetchGroupDetail = useStore((s) => s.fetchGroupDetail);

  const group   = groups.find((g) => g.id === groupId) || groups[0];
  const members = (group?.members ?? []) as User[];

  const user = useAuthStore((s) => s.user);

  const [amountStr, setAmountStr] = useState(defaultAmt ? String(defaultAmt) : '1200');
  const [desc,      setDesc]      = useState(defaultDesc || '');
  const [category,  setCategory]  = useState(defaultCat || 'groceries');
  const [paidBy,    setPaidBy]    = useState(user?.id || members[0]?.id || '1');
  const [splitMode, setSplitMode] = useState('equally');
  
  // State for toggling members in equal split
  const [includedIds, setIncludedIds] = useState<string[]>([]);
  // State for custom split amounts
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  useEffect(() => {
    // If members are empty, fetch the group detail to populate them
    if (members.length === 0 && groupId) {
      fetchGroupDetail(groupId).then((g) => {
        if (g && g.members) {
          setIncludedIds(g.members.map((m: User) => m.id));
          if (!paidBy || paidBy === '1') setPaidBy(user?.id || g.members[0]?.id);
        }
      });
    } else if (includedIds.length === 0 && members.length > 0) {
      setIncludedIds(members.map(m => m.id));
      if (!paidBy || paidBy === '1') setPaidBy(user?.id || members[0]?.id);
    }
  }, [groupId, members.length, user?.id]);

  const amount = parseFloat(amountStr) || 0;
  const equalShare = amount / (includedIds.length || 1);

  const toggleMember = (id: string) => {
    setIncludedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const handleSave = () => {
    const safeDesc = desc.trim() || 'Expense';
    if (amount <= 0) return;
    
    let finalCustomSplits: Array<{userId: string, amount: number}> = [];
    if (splitMode === 'custom') {
      let totalCustom = 0;
      for (const m of members) {
        const val = parseFloat(customSplits[m.id]) || 0;
        if (val > 0) {
          finalCustomSplits.push({ userId: m.id, amount: val });
          totalCustom += val;
        }
      }
      if (Math.abs(totalCustom - amount) > 0.01) {
         Alert.alert('Error', `Custom amounts total (₹${totalCustom}) does not match the expense amount (₹${amount}).`);
         return;
      }
    } else if (includedIds.length === 0) {
      return;
    }

    addExpense({ 
      groupId: group.id, 
      description: safeDesc, 
      amount, 
      category, 
      paidById: paidBy, 
      splitMode, 
      splitMemberIds: splitMode === 'equally' ? includedIds : [],
      customSplits: splitMode === 'custom' ? finalCustomSplits : undefined
    });
    nav.goBack();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.surface }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.surface} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.groupIcon, { backgroundColor: t.secondaryContainer }]}>
             <MaterialIcons name="business" size={20} color={t.onSecondaryContainer} />
          </View>
          <View>
            <Text style={[styles.headerSub, { color: t.onSurfaceVariant }]}>SHARED LEDGER</Text>
            <Text style={[styles.headerTitle, { color: t.onSurface }]}>Add Expense to {group?.name || 'Flat 402'}</Text>
          </View>
        </View>
        <TouchableRipple onPress={() => nav.goBack()} style={[styles.closeBtn, { backgroundColor: t.surfaceVariant }]}>
          <MaterialIcons name="close" size={24} color={t.onSurface} />
        </TouchableRipple>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Amount Section */}
          <View style={styles.amountSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <MaterialIcons name="payments" size={16} color={t.outline} />
              <Text style={[styles.amountLabel, { color: t.onSurfaceVariant }]}>Total Outlay</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' }}>
              <Text style={[styles.currencySymbol, { color: t.onSurface }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: t.onSurface }]}
                value={amountStr}
                onChangeText={setAmountStr}
                keyboardType="numeric"
                maxLength={8}
                placeholder="0"
                placeholderTextColor={t.outline}
              />
            </View>

            {/* Quick Chips */}
            <View style={styles.chipRow}>
              {['450', '1200', '2400', '3500'].map((val) => (
                <TouchableRipple 
                  key={val} 
                  onPress={() => setAmountStr(val)}
                  style={[styles.quickChip, amountStr === val ? { backgroundColor: t.primaryContainer } : { backgroundColor: t.surfaceVariant }]}
                >
                  <Text style={[styles.quickChipText, amountStr === val ? { color: t.onPrimaryContainer } : { color: t.onSurfaceVariant }]}>₹{val}</Text>
                </TouchableRipple>
              ))}
            </View>

            {/* Description Input */}
            <View style={[styles.descInputWrap, { backgroundColor: t.surface }]}>
              <MaterialIcons name="edit" size={20} color={t.outline} />
              <TextInput
                style={[styles.descInput, { color: t.onSurface }]}
                value={desc}
                onChangeText={setDesc}
                placeholder="What was this for?"
                placeholderTextColor={t.outline}
              />
            </View>
          </View>

          {/* Paid By */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Paid by</Text>
              <Text style={[styles.sectionSub, { color: t.outline }]}>1 Payer</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {members.map((m, i) => {
                const isSelected = paidBy === m.id;
                return (
                  <TouchableRipple 
                    key={m.id} 
                    onPress={() => setPaidBy(m.id)}
                    style={[styles.payerCard, isSelected ? { backgroundColor: t.secondaryContainer, borderColor: t.primaryContainer } : { backgroundColor: t.surface, borderColor: t.surface }]}
                  >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <View style={[styles.payerAvatar, { backgroundColor: m.color || t.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
                         <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{m.avatar}</Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.payerCheck, { backgroundColor: t.primary }]}>
                          <MaterialIcons name="check" size={12} color={t.onPrimary} />
                        </View>
                      )}
                      <Text style={[styles.payerName, { color: t.onSurface }]}>{m.name.split(' ')[0]}</Text>
                      <Text style={[styles.payerSub, { color: t.onSurfaceVariant }]}>{m.id === user?.id ? 'You' : `Room ${i}`}</Text>
                    </View>
                  </TouchableRipple>
                );
              })}
            </ScrollView>
          </View>

          {/* Split Method */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Split Method</Text>
              <Text style={[styles.sectionSub, { color: t.outline }]}>{members.length} Roommates</Text>
            </View>
            
            <View style={[styles.splitTabs, { backgroundColor: t.surfaceVariant }]}>
              <TouchableRipple onPress={() => setSplitMode('equally')} style={[styles.splitTab, splitMode === 'equally' ? { backgroundColor: t.surface, shadowColor: t.onBackground, elevation: 2 } : {}]}>
                <Text style={[styles.splitTabText, { color: splitMode === 'equally' ? t.onSurface : t.onSurfaceVariant }]}>Equally (+{includedIds.length})</Text>
              </TouchableRipple>
              <TouchableRipple onPress={() => setSplitMode('custom')} style={[styles.splitTab, splitMode === 'custom' ? { backgroundColor: t.surface, shadowColor: t.onBackground, elevation: 2 } : {}]}>
                <Text style={[styles.splitTabText, { color: splitMode === 'custom' ? t.onSurface : t.onSurfaceVariant }]}>Custom (₹)</Text>
              </TouchableRipple>
            </View>

            <Animated.View layout={LinearTransition.springify()} style={[styles.splitDetailsBox, { backgroundColor: t.surface }]}>
              {splitMode === 'equally' ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialIcons name="pie-chart" size={18} color={t.primary} />
                      <Text style={[styles.splitDetailsTitle, { color: t.primary }]}>Equal Share</Text>
                    </View>
                    <Text style={[styles.splitDetailsAmount, { color: t.onSurface }]}>₹{equalShare.toFixed(2)} <Text style={{ fontSize: 12, fontWeight: '500', color: t.onSurfaceVariant }}>/ person</Text></Text>
                  </View>
                  <Text style={[styles.splitDetailsDesc, { color: t.onSurfaceVariant }]}>
                    Evenly distributed among {includedIds.length} members ({members.filter(m => includedIds.includes(m.id)).map(m => m.name.split(' ')[0]).join(', ')}).
                  </Text>
                  
                  <View style={styles.visualBar}>
                    {members.map((m, i) => {
                      const isIncluded = includedIds.includes(m.id);
                      return (
                        <View key={i} style={[styles.visualSegment, { backgroundColor: isIncluded ? (i === 0 ? t.primary : i === 1 ? t.secondary : i === 2 ? t.tertiary : t.primaryContainer) : t.surfaceVariant }]} />
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                    <Text style={[styles.tapLabel, { color: t.outline }]}>Tap avatar to include/exclude:</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {members.map((m, i) => {
                        const isIncluded = includedIds.includes(m.id);
                        return (
                          <TouchableOpacity key={i} onPress={() => toggleMember(m.id)} activeOpacity={0.7}>
                            <View style={[styles.miniAvatar, { backgroundColor: m.color || t.primaryContainer, opacity: isIncluded ? 1 : 0.3, alignItems: 'center', justifyContent: 'center' }]}>
                               <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{m.avatar}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ gap: 12 }}>
                  {members.map((m, i) => (
                    <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={[styles.miniAvatar, { backgroundColor: m.color || t.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{m.avatar}</Text>
                        </View>
                        <Text style={{ fontSize: 16, color: t.onSurface, fontWeight: '600' }}>{m.name.split(' ')[0]}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: t.surfaceVariant, borderRadius: 8, paddingHorizontal: 12, height: 40, width: 120 }}>
                        <Text style={{ color: t.onSurfaceVariant, fontWeight: '700', marginRight: 4 }}>₹</Text>
                        <TextInput 
                           style={{ flex: 1, fontSize: 16, color: t.onSurface, fontWeight: '700' }}
                           value={customSplits[m.id] || ''}
                           onChangeText={(val) => setCustomSplits(p => ({ ...p, [m.id]: val }))}
                           keyboardType="numeric"
                           placeholder="0.00"
                           placeholderTextColor={t.outline}
                        />
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 1, backgroundColor: t.outlineVariant, marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.onSurfaceVariant }}>Total Accounted:</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: Object.values(customSplits).reduce((a,b)=>a+(parseFloat(b)||0),0) === amount ? t.primary : t.error }}>
                      ₹{Object.values(customSplits).reduce((a,b)=>a+(parseFloat(b)||0),0).toFixed(2)} / ₹{amount.toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          </View>

          {/* Bottom Options */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableRipple style={[styles.bottomOption, { backgroundColor: t.surface }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <MaterialIcons name="calendar-today" size={24} color={t.outline} />
                <View>
                  <Text style={[styles.bottomOptionTitle, { color: t.onSurfaceVariant }]}>Date</Text>
                  <Text style={[styles.bottomOptionVal, { color: t.onSurface }]}>Today, 24 Oct</Text>
                </View>
              </View>
            </TouchableRipple>
            <TouchableRipple style={[styles.bottomOption, { backgroundColor: t.secondaryContainer }]} onPress={() => Alert.alert("Coming soon", "Add Bill scanning will be available in the next release.")}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <MaterialIcons name="receipt-long" size={24} color={t.onSecondaryContainer} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.bottomOptionTitle, { color: t.onSecondaryContainer }]}>Receipt</Text>
                  <Text style={[styles.bottomOptionVal, { color: t.onSecondaryContainer }]}>Add Bill</Text>
                </View>
                <MaterialIcons name="add" size={20} color={t.onSecondaryContainer} />
              </View>
            </TouchableRipple>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Save Button */}
      <View style={[styles.footer, { backgroundColor: t.surface, borderTopColor: t.surfaceVariant }]}>
        <TouchableRipple style={[styles.saveBtn, { backgroundColor: t.primary }]} onPress={handleSave}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1, width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="check" size={24} color={t.onPrimary} />
              <Text style={[styles.saveBtnText, { color: t.onPrimary }]}>Save Expense</Text>
            </View>
            <View style={[styles.saveAmtPill, { backgroundColor: t.onPrimary }]}>
              <Text style={[styles.saveAmtText, { color: t.primary }]}>₹ {amountStr}</Text>
            </View>
          </View>
        </TouchableRipple>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  groupIcon:  { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  headerSub:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  headerTitle:{ fontSize: 20, fontWeight: '800' },
  closeBtn:   { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  scroll:     { paddingHorizontal: 20, paddingBottom: 40 },
  
  amountSection: { alignItems: 'center', marginVertical: 24 },
  amountLabel:   { fontSize: 14, fontWeight: '700' },
  currencySymbol:{ fontSize: 32, fontWeight: '500', marginTop: 12, marginRight: 4 },
  amountInput:   { fontSize: 64, fontWeight: '800', letterSpacing: -2, padding: 0 },
  chipRow:       { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickChip:     { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  quickChipText: { fontSize: 14, fontWeight: '700' },
  descInputWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', height: 56, borderRadius: 28, paddingHorizontal: 20, marginTop: 24, gap: 12, elevation: 1 },
  descInput:     { flex: 1, fontSize: 16, fontWeight: '600' },

  section:       { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 },
  sectionTitle:  { fontSize: 18, fontWeight: '800' },
  sectionSub:    { fontSize: 13, fontWeight: '600' },

  categoryPill:  { flexDirection: 'row', alignItems: 'center', height: 44, borderRadius: 22, paddingHorizontal: 16, gap: 8 },
  categoryText:  { fontSize: 15, fontWeight: '700' },

  payerCard:     { width: 80, padding: 12, borderRadius: 20, alignItems: 'center', borderWidth: 2 },
  payerAvatar:   { width: 48, height: 48, borderRadius: 24, marginBottom: 8 },
  payerCheck:    { position: 'absolute', top: 44, right: 12, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  payerName:     { fontSize: 14, fontWeight: '700' },
  payerSub:      { fontSize: 12, fontWeight: '500' },

  splitTabs:     { flexDirection: 'row', padding: 4, borderRadius: 16 },
  splitTab:      { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  splitTabText:  { fontSize: 14, fontWeight: '700' },
  
  splitDetailsBox: { borderRadius: 24, padding: 20, marginTop: 12 },
  splitDetailsTitle: { fontSize: 16, fontWeight: '800' },
  splitDetailsAmount:{ fontSize: 20, fontWeight: '800' },
  splitDetailsDesc:  { fontSize: 13, lineHeight: 18, marginTop: 12 },
  visualBar:         { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginTop: 16, gap: 2 },
  visualSegment:     { flex: 1, height: '100%' },
  tapLabel:          { fontSize: 12, fontWeight: '600' },
  miniAvatar:        { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  bottomOption:      { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12 },
  bottomOptionTitle: { fontSize: 12, fontWeight: '700' },
  bottomOptionVal:   { fontSize: 15, fontWeight: '800' },

  footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 64, borderRadius: 32, paddingLeft: 24, paddingRight: 8 },
  saveBtnText: { fontSize: 18, fontWeight: '700' },
  saveAmtPill: { paddingHorizontal: 16, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  saveAmtText: { fontSize: 16, fontWeight: '800' }
});
