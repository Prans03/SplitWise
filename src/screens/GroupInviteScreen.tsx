// ============================================================
// GroupInviteScreen – generate invite QR token (API-backed)
// ============================================================
import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';
import { Avatar } from '../components';

type Route = RouteProp<RootStackParamList, 'GroupInvite'>;

export default function GroupInviteScreen() {
  const nav          = useNavigation<any>();
  const { groupId }  = useRoute<Route>().params;
  const t            = useTheme();
  const groups       = useStore((s) => s.groups);
  const generateInvite = useStore((s) => s.generateInvite);
  const fetchGroupDetail = useStore((s) => s.fetchGroupDetail);

  const group   = groups.find((g) => g.id === groupId);
  const members = (group?.members ?? []) as Array<{ id: string; name: string; color: string; avatar: string }>;

  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [expiresAt,   setExpiresAt]   = useState<string | null>(null);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    fetchGroupDetail(groupId);
  }, [groupId]);

  const generateQR = useCallback(async () => {
    setLoading(true);
    const result = await generateInvite(groupId);
    setLoading(false);
    if (result) {
      setInviteToken(result.token);
      setExpiresAt(result.expiresAt);
    } else {
      Alert.alert('Error', 'Failed to generate invite. Check your connection.');
    }
  }, [groupId, generateInvite]);

  const deepLink = inviteToken ? `splitwise://join?token=${inviteToken}` : null;

  const formatExpiry = (iso: string) => new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]}>
          <Text style={[{ fontSize: 18, color: t.onSurface }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.onBackground }]}>Invite to Group</Text>
          <Text style={[styles.subtitle, { color: t.onSurfaceVariant }]}>{group?.emoji} {group?.name}</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Members */}
        <View style={[styles.membersCard, { backgroundColor: t.surface }]}>
          <Text style={[styles.sectionLabel, { color: t.onSurfaceVariant }]}>
            CURRENT MEMBERS · {members.length}
          </Text>
          <View style={styles.membersRow}>
            {members.map((m) => <Avatar key={m.id} user={m as any} size={42} showName />)}
          </View>
        </View>

        {/* QR Code area */}
        <View style={[styles.qrCard, { backgroundColor: t.surface }]}>
          {!inviteToken ? (
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📲</Text>
              <Text style={[styles.qrPlaceholderText, { color: t.onSurface }]}>
                Generate a QR code for others to scan and join this group
              </Text>
              <Text style={[styles.qrNote, { color: t.onSurfaceVariant }]}>
                The link is valid for 7 days and can be used once.
              </Text>
            </View>
          ) : (
            <View style={styles.qrWrap}>
              <View style={[styles.qrBg, { backgroundColor: '#fff' }]}>
                <QRCode value={deepLink!} size={200} backgroundColor="white" color="#1A1510" />
              </View>
              <Text style={[styles.qrCopied, { color: t.onSurfaceVariant }]}>
                Scan to join {group?.name}
              </Text>
              {expiresAt && (
                <Text style={[styles.qrExpiry, { color: t.onSurfaceVariant }]}>
                  Expires {formatExpiry(expiresAt)}
                </Text>
              )}
            </View>
          )}

          <TouchableOpacity
            onPress={generateQR}
            disabled={loading}
            style={[styles.generateBtn, { backgroundColor: t.primary, opacity: loading ? 0.7 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={t.onPrimary} size="small" />
            ) : (
              <Text style={[styles.generateText, { color: t.onPrimary }]}>
                {inviteToken ? 'Generate New QR Code' : '+ Generate Invite QR'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1 },
  topBar:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn:            { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title:              { fontSize: 18, fontWeight: '800' },
  subtitle:           { fontSize: 12, marginTop: 1 },
  content:            { flex: 1, paddingHorizontal: 16, gap: 14 },
  membersCard:        { borderRadius: 20, padding: 16, gap: 12, elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  sectionLabel:       { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  membersRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  qrCard:             { borderRadius: 20, padding: 24, alignItems: 'center', gap: 20, elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  qrPlaceholder:      { alignItems: 'center', gap: 8, paddingVertical: 8 },
  qrPlaceholderText:  { fontSize: 15, fontWeight: '600', textAlign: 'center' },
  qrNote:             { fontSize: 12, textAlign: 'center' },
  qrWrap:             { alignItems: 'center', gap: 12 },
  qrBg:               { padding: 16, borderRadius: 16 },
  qrCopied:           { fontSize: 13, fontWeight: '600' },
  qrExpiry:           { fontSize: 11 },
  generateBtn:        { width: '100%', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  generateText:       { fontSize: 15, fontWeight: '800' },
});
