// ============================================================
// AccountScreen – Profile management via auth store
// ============================================================
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/useAuthStore';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';

export default function AccountScreen() {
  const nav     = useNavigation<any>();
  const t       = useTheme();
  const user    = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  
  const [upiId, setUpiId] = useState(user?.upi_id || '');
  const groups  = useStore((s) => s.groups);
  const reset   = useStore((s) => s.reset);

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await signOut();
        reset();
      }},
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?', 
      'This action is irreversible. All your groups, expenses, and settlements will be permanently deleted.', 
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Permanently', style: 'destructive', onPress: async () => {
          const success = await deleteAccount();
          if (success) reset();
        }},
      ]
    );
  };

  const handleSaveUpi = async () => {
    const success = await updateProfile(upiId);
    if (success) {
      Alert.alert('Saved', 'UPI ID updated successfully');
    }
  };

  if (!user) return null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]}>
          <Text style={[{ fontSize: 18, color: t.onSurface }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.onBackground }]}>Account</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: t.primaryContainer }]}>
          <View style={[styles.avatar, { backgroundColor: user.color }]}>
            <Text style={styles.avatarText}>{user.avatar}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: t.onPrimaryContainer }]}>{user.name}</Text>
            <Text style={[styles.email, { color: t.onPrimaryContainer, opacity: 0.75 }]}>{user.email}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow]}>
          <View style={[styles.statCard, { backgroundColor: t.surface }]}>
            <Text style={[styles.statNum, { color: t.primary }]}>{groups.length}</Text>
            <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>Groups</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.surface }]}>
            <Text style={[styles.statNum, { color: t.primary }]}>
              {groups.reduce((s, g) => s + (g.memberCount ?? 0), 0)}
            </Text>
            <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>Members</Text>
          </View>
        </View>

        {/* UPI ID Section */}
        <View style={[styles.card, { backgroundColor: t.surface }]}>
          <Text style={[styles.cardLabel, { color: t.onSurfaceVariant }]}>PAYMENT DETAILS</Text>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            <Text style={{ color: t.onSurface, marginBottom: 8, fontSize: 14 }}>UPI ID for receiving settlements</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: t.background, color: t.onSurface, borderColor: t.outline, borderWidth: 1 }]}
                placeholder="e.g. yourname@upi"
                placeholderTextColor={t.onSurfaceVariant}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={handleSaveUpi}
                disabled={isSubmitting || upiId === user.upi_id}
                style={[styles.saveBtn, { backgroundColor: upiId === user.upi_id ? t.surfaceVariant : t.primary }]}
              >
                <Text style={{ color: upiId === user.upi_id ? t.onSurfaceVariant : t.onPrimary, fontWeight: '600' }}>
                  {isSubmitting ? '...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Linked groups */}
        {groups.length > 0 && (
          <View style={[styles.card, { backgroundColor: t.surface }]}>
            <Text style={[styles.cardLabel, { color: t.onSurfaceVariant }]}>YOUR GROUPS</Text>
            {groups.map((g, i) => (
              <TouchableOpacity
                key={g.id}
                onPress={() => nav.navigate('GroupDetail', { groupId: g.id })}
                style={[styles.groupRow, i < groups.length - 1 && { borderBottomWidth: 1, borderBottomColor: t.outlineVariant }]}
              >
                <Text style={{ fontSize: 20 }}>{g.emoji}</Text>
                <Text style={[styles.groupName, { color: t.onSurface }]}>{g.name}</Text>
                <Text style={[styles.groupRole, { color: t.onSurfaceVariant }]}>{g.role}</Text>
                <Text style={{ color: t.onSurfaceVariant }}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Sign out & Delete Account */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={[styles.signOutBtn, { backgroundColor: t.surfaceVariant, marginTop: 8 }]}
        >
          <Text style={[styles.signOutText, { color: t.onSurfaceVariant }]}>Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[styles.signOutBtn, { backgroundColor: t.errorContainer }]}
        >
          <Text style={[styles.signOutText, { color: t.error }]}>Delete Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1 },
  topBar:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 18, fontWeight: '800' },
  content:     { paddingHorizontal: 16, gap: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 24, padding: 20 },
  avatar:      { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 22, color: '#fff', fontWeight: '900' },
  name:        { fontSize: 20, fontWeight: '900' },
  email:       { fontSize: 13, marginTop: 2 },
  statsRow:    { flexDirection: 'row', gap: 12 },
  statCard:    { flex: 1, borderRadius: 20, padding: 20, alignItems: 'center', gap: 4, elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  statNum:     { fontSize: 32, fontWeight: '900' },
  statLabel:   { fontSize: 12, fontWeight: '600' },
  card:        { borderRadius: 20, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cardLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  groupRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  groupName:   { flex: 1, fontSize: 15, fontWeight: '600' },
  groupRole:   { fontSize: 12, fontWeight: '500', opacity: 0.7 },
  signOutBtn:  { borderRadius: 16, padding: 16, alignItems: 'center' },
  signOutText: { fontSize: 15, fontWeight: '800' },
  input: { height: 48, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  saveBtn: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 12 }
});
