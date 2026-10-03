// ============================================================
// SettlementScreen – Matching media_1790928163676.jpg (Settle Up view)
// ============================================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, StatusBar, ScrollView,
  Image, Alert, ActivityIndicator, RefreshControl,
  Share, Linking
} from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../theme';
import { FloatingTabBar } from '../components';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { api } from '../api/client';

export default function SettlementScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const t = useTheme();
  
  const user = useAuthStore(s => s.user);
  const groupId = route.params?.groupId;
  const groups = useStore(s => s.groups);
  const group = groups.find(g => g.id === groupId) || groups[0];
  
  const [activeTab, setActiveTab] = useState('balances');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = useCallback(async () => {
    if (!group) return;
    try {
      setLoading(true);
      const res = await api.get(`/groups/${group.id}/settlements/balances`);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [group]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleRemind = async (targetUserId: string) => {
    try {
      await api.post(`/groups/${group.id}/settlements/remind`, { targetUserId });
      Alert.alert('Reminder Sent!', 'They have been notified.');
    } catch (err) {
      Alert.alert('Error', 'Could not send reminder');
    }
  };

  const handleAcknowledge = async (fromUserId: string, amount: number) => {
    try {
      await api.post(`/groups/${group.id}/settlements/acknowledge`, { fromUserId, amount });
      Alert.alert('Success', 'Payment acknowledged');
      fetchBalances();
    } catch (err) {
      Alert.alert('Error', 'Could not acknowledge payment');
    }
  };

  const handleSettleUp = async (toUserId: string, amount: number, name: string, upiId?: string) => {
    // 1. Trigger UPI App
    const payeeUpi = upiId || 'test@upi';
    const upiUrl = `upi://pay?pa=${payeeUpi}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=SplitWise%20Settlement`;
    try {
      await Linking.openURL(upiUrl);
    } catch (err) {
      Alert.alert('No UPI App', 'Could not find a UPI app on your device to complete the payment, or permission was denied.');
    }
    // 2. Mark it as settled in our database
    try {
      const idempotencyKey = Math.random().toString(36).substring(2) + Date.now().toString(36);
      await api.post(`/groups/${group.id}/settlements/settle-up`, { toUserId, amount }, {
        'Idempotency-Key': idempotencyKey
      });
      Alert.alert('Success', 'Payment recorded in SplitWise');
      fetchBalances();
    } catch (err) {
      Alert.alert('Error', 'Could not record payment');
    }
  };

  const handleVerify = async (stId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await api.post(`/groups/${group.id}/settlements/${stId}/verify`, { action });
      Alert.alert(action === 'ACCEPT' ? 'Verified' : 'Rejected', 'Payment status updated.');
      fetchBalances();
    } catch (err) {
      Alert.alert('Error', 'Could not update payment status');
    }
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      const message = `Settle up with me on SplitWise for "${group.name}"!\n\nLink: splitwise://groups/${group.id}/settlements`;
      await Share.share({
        message,
        title: `Settle up: ${group.name}`
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share the settlement link');
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.surface }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.surface} />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableRipple onPress={() => nav.goBack()} style={{ padding: 4 }}>
            <MaterialIcons name="arrow-back" size={24} color={t.onSurface} />
          </TouchableRipple>
          <View style={{ width: 20, height: 20, borderRadius: 4, backgroundColor: user?.color || t.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{user?.avatar}</Text>
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: t.onSurface }]}>Splitwise</Text>
            <Text style={[styles.headerSub, { color: t.onSurfaceVariant }]}>Settle Up</Text>
          </View>
        </View>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: user?.color || t.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{user?.avatar}</Text>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBalances} tintColor={t.primary} />}
      >
        
        {/* Top Tabs */}
        <View style={[styles.tabs, { backgroundColor: t.surface }]}>
          <TouchableRipple 
            onPress={() => setActiveTab('balances')}
            style={[styles.tabBtn, activeTab === 'balances' ? { backgroundColor: t.surface, shadowColor: t.onBackground, elevation: 2 } : {}]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'balances' ? t.primary : t.onSurfaceVariant }]}>My Balances</Text>
          </TouchableRipple>
          <TouchableRipple 
            onPress={() => setActiveTab('breakdown')}
            style={[styles.tabBtn, activeTab === 'breakdown' ? { backgroundColor: t.surface, shadowColor: t.onBackground, elevation: 2 } : {}]}
          >
            <Text style={[styles.tabText, { color: activeTab === 'breakdown' ? t.primary : t.onSurfaceVariant }]}>Group Breakdown</Text>
          </TouchableRipple>
        </View>

        {loading && !data ? (
          <ActivityIndicator size="large" color={t.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'balances' ? (
          <>
            {/* Balance Status Card */}
            <View style={[styles.statusCard, { backgroundColor: t.primaryContainer }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View>
                  <Text style={[styles.statusLabel, { color: t.onPrimaryContainer }]}>YOUR BALANCE STATUS</Text>
                  <Text style={[styles.statusAmount, { color: t.onPrimaryContainer }]}>
                    {data?.overallBalance > 0 ? '+' : ''}₹{Math.abs(data?.overallBalance || 0)}
                  </Text>
                  <Text style={[styles.statusSub, { color: t.onPrimaryContainer }]}>
                    {data?.overallBalance > 0 ? `You are owed ₹${data?.overallBalance} overall` : data?.overallBalance < 0 ? `You owe ₹${Math.abs(data?.overallBalance)} overall` : 'You are settled up.'}
                  </Text>
                </View>
                <View style={[styles.piggyIcon, { backgroundColor: t.surface }]}>
                  <MaterialIcons name="savings" size={24} color={t.onSurfaceVariant} />
                </View>
              </View>
              
              <View style={[styles.statusFooter, { borderTopColor: t.outlineVariant }]}>
                <Text style={[styles.groupLabel, { color: t.onPrimaryContainer }]}>Group: {group?.name || 'All Groups'}</Text>
                <View style={[styles.activePill, { backgroundColor: t.primary }]}>
                  <Text style={[styles.activePillText, { color: t.onPrimary }]}>{data?.activeSettlementsCount || 0} Active Settlement{data?.activeSettlementsCount !== 1 ? 's' : ''}</Text>
                </View>
              </View>
            </View>

            {/* Who pays you */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="arrow-downward" size={18} color={t.onSurface} />
                <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Who pays you</Text>
              </View>
              <View style={[styles.duePill, { backgroundColor: t.primaryContainer }]}>
                <Text style={[styles.duePillText, { color: t.onPrimaryContainer }]}>
                  ₹{data?.whoPaysYou?.reduce((acc: number, p: any) => acc + p.amountOwed, 0) || 0} due
                </Text>
              </View>
            </View>

            {data?.whoPaysYou?.length === 0 ? (
              <View style={[styles.personCard, { backgroundColor: t.surface, padding: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={[styles.checkCircle, { backgroundColor: t.primaryContainer }]}>
                    <MaterialIcons name="check-circle-outline" size={24} color={t.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.allSquared, { color: t.onSurface }]}>All good!</Text>
                    <Text style={[styles.squaredDesc, { color: t.onSurfaceVariant }]}>Nobody owes you anything in {group?.name}.</Text>
                  </View>
                </View>
              </View>
            ) : (
              data?.whoPaysYou?.map((p: any) => (
                <View key={p.userId} style={[styles.personCard, { backgroundColor: t.surface, marginBottom: 12 }]}>
                  <View style={styles.personHeader}>
                    <View style={[styles.personAvatar, { backgroundColor: p.color || t.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{p.avatarUrl}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.personName, { color: t.onSurface }]}>{p.name}</Text>
                        <Text style={[styles.personAmount, { color: t.onSurface }]}>+₹{p.amountOwed}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.personDesc, { color: t.onSurfaceVariant }]}>{group?.name} · Settlements</Text>
                        <Text style={[styles.personOwes, { color: t.onSurfaceVariant }]}>owes you</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.personActions}>
                    <TouchableRipple style={[styles.actionBtn, { backgroundColor: t.surfaceVariant, flex: 1 }]} onPress={() => handleRemind(p.userId)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
                        <MaterialIcons name="send" size={16} color={t.onSurfaceVariant} style={{ transform: [{ rotate: '-45deg' }] }} />
                        <Text style={[styles.actionBtnText, { color: t.onSurface }]}>Remind</Text>
                      </View>
                    </TouchableRipple>
                    <TouchableRipple style={[styles.actionBtn, { backgroundColor: t.primary, flex: 1.2 }]} onPress={() => handleAcknowledge(p.userId, p.amountOwed)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
                        <MaterialIcons name="check" size={18} color={t.onPrimary} />
                        <Text style={[styles.actionBtnText, { color: t.onPrimary }]}>Acknowledge</Text>
                      </View>
                    </TouchableRipple>
                  </View>
                </View>
              ))
            )}

            {/* Who you pay */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="arrow-upward" size={18} color={t.onSurface} />
                <Text style={[styles.sectionTitle, { color: t.onSurface }]}>Who you pay</Text>
              </View>
              <View style={[styles.duePill, { backgroundColor: t.surfaceVariant }]}>
                <Text style={[styles.duePillText, { color: t.onSurfaceVariant }]}>
                  ₹{data?.whoYouPay?.reduce((acc: number, p: any) => acc + p.amountOwed, 0) || 0} due
                </Text>
              </View>
            </View>

            {data?.whoYouPay?.length === 0 ? (
              <View style={[styles.personCard, { backgroundColor: t.surface, padding: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <View style={[styles.checkCircle, { backgroundColor: t.primaryContainer }]}>
                    <MaterialIcons name="check-circle-outline" size={24} color={t.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.allSquared, { color: t.onSurface }]}>All squared up!</Text>
                    <Text style={[styles.squaredDesc, { color: t.onSurfaceVariant }]}>
                      You don't owe any money in {group?.name}.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              data?.whoYouPay?.map((p: any) => (
                <View key={p.userId} style={[styles.personCard, { backgroundColor: t.surface, marginBottom: 12 }]}>
                  <View style={styles.personHeader}>
                    <View style={[styles.personAvatar, { backgroundColor: p.color || t.primaryContainer, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff' }}>{p.avatarUrl}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.personName, { color: t.onSurface }]}>{p.name}</Text>
                        <Text style={[styles.personAmount, { color: t.error }]}>-₹{p.amountOwed}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.personDesc, { color: t.onSurfaceVariant }]}>{group?.name} · Settlements</Text>
                        <Text style={[styles.personOwes, { color: t.onSurfaceVariant }]}>you owe</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View style={styles.personActions}>
                    <TouchableRipple style={[styles.actionBtn, { backgroundColor: t.primary, flex: 1 }]} onPress={() => handleSettleUp(p.userId, p.amountOwed, p.name, p.upiId)}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1 }}>
                        <MaterialIcons name="payment" size={18} color={t.onPrimary} />
                        <Text style={[styles.actionBtnText, { color: t.onPrimary }]}>Settle Up</Text>
                      </View>
                    </TouchableRipple>
                  </View>
                </View>
              ))
            )}

            {/* Pending Verifications */}
            {data?.pendingSettlements?.filter((s: any) => s.toUserId === user?.id && s.status === 'PENDING').length > 0 && (
              <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="verified-user" size={18} color={t.secondary} />
                  <Text style={[styles.sectionTitle, { color: t.secondary }]}>Needs Verification</Text>
                </View>
              </View>
            )}
            {data?.pendingSettlements?.filter((s: any) => s.toUserId === user?.id && s.status === 'PENDING').map((s: any) => (
              <View key={s.id} style={[styles.personCard, { backgroundColor: t.surface, marginBottom: 12, borderWidth: 1, borderColor: t.secondaryContainer }]}>
                <View style={[styles.personHeader, { marginBottom: 12 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.onSurface, fontSize: 16, fontWeight: '600' }}>{s.fromName} says they paid you</Text>
                    <Text style={{ color: t.onSurfaceVariant, fontSize: 13, marginTop: 4 }}>Verify you received this money via UPI.</Text>
                  </View>
                  <Text style={{ color: t.primary, fontSize: 20, fontWeight: '700' }}>₹{s.amount}</Text>
                </View>
                <View style={styles.personActions}>
                  <TouchableRipple style={[styles.actionBtn, { backgroundColor: t.errorContainer, flex: 1 }]} onPress={() => handleVerify(s.id, 'REJECT')}>
                    <Text style={[styles.actionBtnText, { color: t.error }]}>Did not receive</Text>
                  </TouchableRipple>
                  <TouchableRipple style={[styles.actionBtn, { backgroundColor: t.primary, flex: 1 }]} onPress={() => handleVerify(s.id, 'ACCEPT')}>
                    <Text style={[styles.actionBtnText, { color: t.onPrimary }]}>Confirm Receipt</Text>
                  </TouchableRipple>
                </View>
              </View>
            ))}

            {/* Rejected / Highlighted False Payments */}
            {data?.pendingSettlements?.filter((s: any) => s.status === 'REJECTED').map((s: any) => (
              <View key={s.id} style={[styles.personCard, { backgroundColor: t.errorContainer, marginBottom: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <MaterialIcons name="error-outline" size={24} color={t.error} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.error, fontSize: 15, fontWeight: '700' }}>False Payment Claim</Text>
                    <Text style={{ color: t.error, fontSize: 13, marginTop: 2 }}>
                      {s.toUserId === user?.id ? `You marked ${s.fromName}'s payment of ₹${s.amount} as not received.` : `${s.toName} reported they did not receive your payment of ₹${s.amount}.`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

          </>
        ) : (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.sectionTitle, { color: t.outline, marginBottom: 16 }]}>OVERALL NET BALANCES</Text>
            {data?.memberBalances?.map((m: any) => {
              const oweObj = data?.whoYouPay?.find((p: any) => p.userId === m.userId);
              return (
                <View key={m.userId} style={[styles.personCard, { backgroundColor: t.surface, marginBottom: 12, padding: 16, flexDirection: 'row', alignItems: 'center' }]}>
                  <View style={[styles.personAvatar, { backgroundColor: m.color || t.primaryContainer, alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 20 }]}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{m.avatarUrl || m.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={[styles.personName, { color: t.onSurface, fontSize: 16 }]}>{m.name}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.duePill, { backgroundColor: m.netBalance > 0 ? t.primaryContainer : m.netBalance < 0 ? t.errorContainer : t.surfaceVariant }]}>
                      <Text style={[styles.duePillText, { color: m.netBalance > 0 ? t.primary : m.netBalance < 0 ? t.error : t.onSurfaceVariant }]}>
                        {m.netBalance > 0 ? '+' : ''}₹{Math.abs(m.netBalance)}
                      </Text>
                    </View>
                    {oweObj && (
                      <TouchableRipple 
                        style={[styles.actionBtn, { backgroundColor: t.primary, paddingHorizontal: 12, height: 32, paddingVertical: 0 }]} 
                        onPress={() => handleSettleUp(m.userId, oweObj.amountOwed, m.name, oweObj.upiId)}
                      >
                        <Text style={[styles.actionBtnText, { color: t.onPrimary, fontSize: 12 }]}>Settle Up</Text>
                      </TouchableRipple>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Share Link Button */}
        <TouchableRipple style={[styles.shareBtn, { backgroundColor: t.primary }]} onPress={handleShare}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1 }}>
            <MaterialIcons name="share" size={20} color={t.onPrimary} />
            <Text style={[styles.shareBtnText, { color: t.onPrimary }]}>Share Settlement Link</Text>
          </View>
        </TouchableRipple>

      </ScrollView>

      <FloatingTabBar active="settle" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64 },
  headerTitle:{ fontSize: 16, fontWeight: '800' },
  headerSub:  { fontSize: 13, fontWeight: '500' },
  
  scroll:     { paddingHorizontal: 20, paddingBottom: 100 },
  
  tabs:       { flexDirection: 'row', padding: 4, borderRadius: 24, marginTop: 8, marginBottom: 16 },
  tabBtn:     { flex: 1, height: 44, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabText:    { fontSize: 15, fontWeight: '700' },

  statusCard: { borderRadius: 24, padding: 20, paddingBottom: 16 },
  statusLabel:{ fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  statusAmount:{ fontSize: 32, fontWeight: '800', marginTop: 4 },
  statusSub:  { fontSize: 14, fontWeight: '500', marginTop: 2, opacity: 0.9 },
  piggyIcon:  { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  
  statusFooter:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  groupLabel: { fontSize: 13, fontWeight: '500', opacity: 0.9 },
  activePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  activePillText: { fontSize: 11, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 32, marginBottom: 12 },
  sectionTitle:  { fontSize: 16, fontWeight: '600' },
  duePill:       { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  duePillText:   { fontSize: 12, fontWeight: '700' },

  personCard:    { borderRadius: 24, padding: 20 },
  personHeader:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  personAvatar:  { width: 44, height: 44, borderRadius: 22 },
  personName:    { fontSize: 16, fontWeight: '500' },
  personAmount:  { fontSize: 16, fontWeight: '800' },
  personDesc:    { fontSize: 13, marginTop: 2 },
  personOwes:    { fontSize: 13, marginTop: 2 },
  
  personActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, borderRadius: 22, gap: 8 },
  actionBtnText: { fontSize: 14, fontWeight: '600' },

  checkCircle:   { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  allSquared:    { fontSize: 16, fontWeight: '600' },
  squaredDesc:   { fontSize: 13, marginTop: 4, lineHeight: 18 },

  shareBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, borderRadius: 28, marginTop: 32, gap: 12 },
  shareBtnText:  { fontSize: 16, fontWeight: '700' }
});
