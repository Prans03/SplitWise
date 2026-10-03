// ============================================================
// BudgetCalendarScreen.tsx
// ============================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function BudgetCalendarScreen() {
  const nav = useNavigation<any>();
  const t = useTheme();
  const setBudgetConfig = useStore((s) => s.setBudgetConfig);
  const initialStart = useStore((s) => s.budgetStartDate);
  const initialEnd = useStore((s) => s.budgetEndDate);

  const [startD, setStartD] = useState(new Date(initialStart));
  const [endD, setEndD] = useState(new Date(initialEnd));

  const handleDayPress = (year: number, month: number, day: number) => {
    const selected = new Date(year, month, day);
    // Simple logic: if click is before start, it becomes start. If after start, it becomes end.
    if (selected.getTime() < startD.getTime()) {
      setStartD(selected);
    } else {
      setEndD(selected);
    }
  };

  const isSelected = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day).setHours(0, 0, 0, 0);
    const s = new Date(startD).setHours(0, 0, 0, 0);
    const e = new Date(endD).setHours(0, 0, 0, 0);
    if (d >= s && d <= e) return true;
    return false;
  };

  const handleApply = () => {
    setBudgetConfig({ budgetStartDate: startD.toISOString(), budgetEndDate: endD.toISOString() });
    nav.goBack();
  };

  const diffTime = Math.abs(endD.getTime() - startD.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const renderMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
      <View key={`${year}-${month}`} style={styles.monthContainer}>
        <Text style={[styles.monthTitle, { color: t.onBackground }]}>{MONTHS[month]}</Text>
        <View style={styles.daysHeader}>
          {DAYS.map((d, i) => (
            <Text key={i} style={[styles.dayLabel, { color: t.onSurfaceVariant }]}>{d}</Text>
          ))}
        </View>
        <View style={styles.grid}>
          {blanks.map((b) => (
            <View key={`b-${b}`} style={styles.cell} />
          ))}
          {days.map((d) => {
            const selected = isSelected(year, month, d);
            return (
              <TouchableOpacity
                key={d}
                activeOpacity={0.8}
                onPress={() => handleDayPress(year, month, d)}
                style={[
                  styles.cell,
                  selected && { backgroundColor: t.tertiary || '#FFB74D', borderRadius: 20 } // Amber selection
                ]}
              >
                <Text style={[styles.cellText, { color: selected ? '#4E342E' : t.onSurface }]}>
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const nextNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const formattedTitle = `${startD.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })} — ${endD.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' })}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />
      
      {/* ── Header ────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
          <Text style={{ fontSize: 24, color: t.onBackground }}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleApply} style={[styles.applyBtn, { backgroundColor: t.tertiary || '#FFB74D' }]}>
          <Text style={[styles.applyText, { color: '#4E342E' }]}>✓ Apply</Text>
        </TouchableOpacity>
      </View>

      <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
        <Text style={[styles.dateRange, { color: t.onBackground }]}>{formattedTitle}</Text>
        <Text style={[styles.daysCount, { color: t.onSurfaceVariant }]}>{diffDays} days</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {renderMonth(today)}
        {renderMonth(nextMonth)}
        {renderMonth(nextNextMonth)}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  closeBtn: { padding: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
  applyText: { fontSize: 14, fontWeight: '700' },
  dateRange: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  daysCount: { fontSize: 16, fontWeight: '500' },
  monthContainer: { paddingHorizontal: 20, marginBottom: 30 },
  monthTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  daysHeader: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  dayLabel: { fontSize: 12, fontWeight: '700', width: 40, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  cellText: { fontSize: 16, fontWeight: '600' },
});
