import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';
import { useStore } from '../store/useStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = 'groups' | 'activity' | 'settle' | 'settings';

const tabs: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'groups', icon: '♧', label: 'Groups' },
  { id: 'activity', icon: '▤', label: 'Activity' },
  { id: 'settle', icon: '↔', label: 'Settle Up' },
  { id: 'settings', icon: '☷', label: 'Settings' },
];

import { BlurView } from 'expo-blur';

export function FloatingTabBar({ active }: { active: Tab }) {
  const nav = useNavigation<Nav>();
  const t = useTheme();
  const groups = useStore((s) => s.groups);

  const onPress = (id: Tab) => {
    if (id === 'groups') nav.navigate('Home');
    if (id === 'activity') nav.navigate('Activity');
    if (id === 'settings') nav.navigate('Settings');
    if (id === 'settle') {
      if (groups[0]) nav.navigate('Settlement', { groupId: groups[0].id });
      else nav.navigate('AddGroup');
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <BlurView 
        intensity={t.isDark ? 30 : 60} 
        tint={t.isDark ? 'dark' : 'light'} 
        style={[styles.bar, { borderColor: t.outlineVariant, shadowColor: t.onBackground, overflow: 'hidden' }]}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onPress(tab.id)}
              style={[styles.item, selected && { backgroundColor: t.secondaryContainer }]}>
              <Text style={[styles.icon, { color: selected ? t.primary : t.onSurfaceVariant }]}>{tab.icon}</Text>
              {selected && <Text style={[styles.label, { color: t.onSecondaryContainer }]}>{tab.label}</Text>}
            </Pressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 18, alignItems: 'center' },
  bar: { height: 66, width: '90%', maxWidth: 430, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, elevation: 10, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 22 },
  item: { minWidth: 46, height: 46, borderRadius: 999, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  icon: { fontSize: 21, fontWeight: '800' },
  label: { fontSize: 12, fontWeight: '800' },
});
