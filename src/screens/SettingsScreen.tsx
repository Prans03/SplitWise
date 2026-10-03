// ============================================================
// SettingsScreen – API-backed (reads auth + new store)
// ============================================================
import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch,
  StyleSheet, StatusBar, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore, Expense } from '../store/useStore';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme, PALETTES, PaletteId } from '../theme';
import { Avatar, FloatingTabBar } from '../components';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

function SettingRow({ emoji, label, value, onPress, last = false, rightContent }: {
  emoji: string; label: string; value?: string; onPress?: () => void; last?: boolean; rightContent?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <TouchableOpacity disabled={!onPress} onPress={onPress} activeOpacity={0.7}
      style={[styles.settingRow, !last && { borderBottomWidth: 1, borderBottomColor: t.outlineVariant }]}>
      <Text style={{ fontSize: 20, width: 32, textAlign: 'center', marginRight: 12 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, { color: t.onSurface }]}>{label}</Text>
        {value !== undefined && <Text style={[styles.rowValue, { color: t.onSurfaceVariant }]}>{value}</Text>}
      </View>
      {rightContent ? rightContent : (onPress && <Text style={{ color: t.onSurfaceVariant, fontSize: 20 }}>›</Text>)}
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.primary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: t.surface }]}>
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const nav       = useNavigation<any>();
  const t         = useTheme();
  const isDark    = useStore((s) => s.isDarkMode);
  const paletteId = useStore((s) => s.paletteId);
  const toggleDark = useStore((s) => s.toggleDarkMode);
  const setPalette = useStore((s) => s.setPalette);
  const user      = useAuthStore((s) => s.user);
  const groups    = useStore((s) => s.groups);
  const expenses  = useStore((s) => s.expenses);

  const handleExportData = async () => {
    try {
      const allExpenses = Object.values(expenses).flat() as Expense[];
      const header = 'Type,Group Name,Description,Amount,Date\n';
      const rows = allExpenses.map(e => {
        const group = groups.find(g => g.id === e.groupId);
        const groupName = group ? `"${group.name}"` : 'Unknown';
        const dateStr = new Date(e.date).toISOString().split('T')[0];
        return `Expense,${groupName},"${e.description}",${e.amount},${dateStr}`;
      });
      const csvContent = header + rows.join('\n');
      
      const file = new File(Paths.document, 'SplitWise_Export.csv');
      file.write(csvContent);
      
      if (await isAvailableAsync()) {
        await shareAsync(file.uri);
      }
    } catch (err) {
      console.log('Export failed', err);
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={{ fontSize: 24, color: t.onBackground }}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.onBackground }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ACCOUNT CATEGORY */}
        <Section title="ACCOUNT">
          <TouchableOpacity style={[styles.settingRow, { paddingVertical: 16 }]} onPress={() => nav.navigate('Account')} activeOpacity={0.8}>
            {user ? (
              <View style={[styles.accountAvatar, { backgroundColor: user.color }]}>
                <Text style={styles.accountAvatarText}>{user.avatar}</Text>
              </View>
            ) : (
              <View style={[styles.accountAvatar, { backgroundColor: t.surfaceVariant }]} />
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={[styles.accountName, { color: t.onSurface }]}>{user?.name ?? 'Sign In'}</Text>
              <Text style={[styles.accountSub, { color: t.onSurfaceVariant }]}>{user?.email ?? 'Manage account & sessions'}</Text>
            </View>
            <Text style={{ color: t.onSurfaceVariant, fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </Section>

        {/* ACTIONS CATEGORY */}
        <Section title="ACTIONS">
          <SettingRow emoji="📷" label="Scan QR Code" value="Join a group" onPress={() => nav.navigate('Scan')} />
          <SettingRow emoji="📊" label="Export Data (CSV)" value="Download your expenses" onPress={handleExportData} last />
        </Section>

        {/* APPEARANCE CATEGORY */}
        <Section title="APPEARANCE">
          <SettingRow 
            emoji="🌙" 
            label="Theme" 
            value={isDark ? 'Dark Mode' : 'Light Mode'}
            rightContent={
              <Switch value={isDark} onValueChange={toggleDark}
                trackColor={{ true: t.primary, false: t.outlineVariant }}
                thumbColor={isDark ? t.onPrimary : t.surface}
              />
            }
          />
          <View style={styles.paletteContainer}>
            <Text style={[styles.paletteHeader, { color: t.onSurfaceVariant }]}>Color Palettes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
              {PALETTES.map((p) => {
                const selected = paletteId === p.id;
                const preview  = isDark ? p.dark : p.light;
                return (
                  <TouchableOpacity key={p.id} onPress={() => setPalette(p.id as PaletteId)} activeOpacity={0.8}
                    style={[styles.paletteTile, selected && { borderColor: t.primary, borderWidth: 2 }]}>
                    <View style={styles.swatchRow}>
                      <View style={[styles.swatchA, { backgroundColor: preview.background }]} />
                      <View style={[styles.swatchB, { backgroundColor: preview.primary }]} />
                    </View>
                    <View style={[styles.swatchC, { backgroundColor: preview.secondary }]} />
                    {selected && (
                      <View style={[styles.selectedBadge, { backgroundColor: t.primary }]}>
                        <Text style={{ fontSize: 9, fontWeight: '800', color: t.onPrimary }}>✓</Text>
                      </View>
                    )}
                    <Text style={[styles.paletteName, { color: t.onSurface }]}>{p.emoji} {p.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Section>

        {/* ABOUT CATEGORY */}
        <Section title="ABOUT">
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={[styles.aboutText, { color: t.onSurface }]}>SplitWise — real-time group expense tracking with live sync and QR invites.</Text>
          </View>
          <SettingRow 
            emoji="👨‍💻" 
            label="Developed by Pranshu Singh" 
            value="github.com/Prans03" 
            onPress={() => Linking.openURL('https://github.com/Prans03')} 
          />
          <SettingRow emoji="⚡" label="React Native + Expo SDK 57" value="New Arch" />
          <SettingRow emoji="🖥️" label="Self-hosted Node API" value="v1.0.0" last />
        </Section>

        <View style={{ height: 100 }} />
      </ScrollView>
      
      <FloatingTabBar active="settings" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  backBtn:       { width: 40 },
  headerTitle:   { fontSize: 22, fontWeight: '700' },
  content:       { paddingHorizontal: 16, paddingTop: 10, gap: 24 },
  
  section:       { gap: 8 },
  sectionTitle:  { fontSize: 13, fontWeight: '700', letterSpacing: 1.2, marginLeft: 16, textTransform: 'uppercase' },
  sectionBody:   { borderRadius: 20, overflow: 'hidden', elevation: 2, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  
  settingRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel:      { fontSize: 16, fontWeight: '600' },
  rowValue:      { fontSize: 13, marginTop: 2 },
  
  accountAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  accountAvatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  accountName:   { fontSize: 18, fontWeight: '700' },
  accountSub:    { fontSize: 13, marginTop: 2 },
  
  paletteContainer:{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  paletteHeader: { fontSize: 13, fontWeight: '600', marginLeft: 16, marginBottom: 12 },
  paletteScroll: { paddingHorizontal: 16, gap: 12 },
  paletteTile:   { width: 85, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', paddingBottom: 6, backgroundColor: 'rgba(0,0,0,0.2)' },
  swatchRow:     { flexDirection: 'row', height: 44 },
  swatchA:       { flex: 1 },
  swatchB:       { flex: 1 },
  swatchC:       { height: 12, marginHorizontal: 4, borderRadius: 4, marginTop: 4 },
  selectedBadge: { position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  paletteName:   { fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 8 },
  
  aboutText:     { fontSize: 15, lineHeight: 22 },
});
