// ============================================================
// BudgetConfigScreen.tsx - Perfected UI
// ============================================================
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../store/useStore';

export default function BudgetConfigScreen() {
  const nav = useNavigation<any>();

  const currentBudget = useStore((s) => s.dailyBudget);
  const startDate = useStore((s) => s.budgetStartDate);
  const endDate = useStore((s) => s.budgetEndDate);
  const setBudgetConfig = useStore((s) => s.setBudgetConfig);

  const [inputVal, setInputVal] = useState(String(currentBudget));
  const [restMenuOpen, setRestMenuOpen] = useState(false);
  const [restOption, setRestOption] = useState('Always ask');

  // Compute days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

  const handleKey = (key: string) => {
    if (key === 'del') {
      setInputVal((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
    } else {
      setInputVal((prev) => {
        if (prev === '0' && key !== '.') return key;
        if (key === '.' && prev.includes('.')) return prev;
        if (prev.length >= 7) return prev; // limit length
        return prev + key;
      });
    }
  };

  const handleSave = () => {
    setBudgetConfig({ dailyBudget: parseFloat(inputVal) || 0 });
    nav.goBack();
  };

  const formattedEnd = end.toLocaleDateString('en-GB', { day: '2-digit', month: 'long' });
  const totalPerDay = Math.round((parseFloat(inputVal) || 0) / diffDays);

  const numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];
  const restOptions = ['Always ask', 'Rollover', 'Discard'];

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#171614" />

      <View style={{ flex: 1 }}>
        {/* ── Header ────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 24, color: '#f5f4ed' }}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Setting up a budget</Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity style={styles.prevBtn}>
            <Text style={{ fontSize: 14 }}>🔄</Text>
            <Text style={styles.prevBtnText}>Previous values</Text>
          </TouchableOpacity>
        </View>

        {/* ── Big Input Display (Responsive) ── */}
        <View style={styles.displayArea}>
          <Text style={styles.displayText}>{inputVal}</Text>
        </View>

        {/* ── Config Rows ───────────────────── */}
        <View style={styles.configArea}>
          <TouchableOpacity style={styles.row} onPress={() => nav.navigate('BudgetCalendar')}>
            <View style={styles.iconCircle}><Text style={{ fontSize: 16 }}>🕒</Text></View>
            <Text style={styles.rowText}>To {formattedEnd} ({diffDays} days)</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => setRestMenuOpen(true)}>
            <View style={styles.iconCircle}><Text style={{ fontSize: 16 }}>💸</Text></View>
            <Text style={[styles.rowText, { flex: 1 }]}>Rest</Text>
            <Text style={styles.rowVal}>{restOption}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexShrink: 0 }}>
        {/* ── Bottom Section ────────────────── */}
        <View style={styles.bottomArea}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalSub}>{totalPerDay} ₹ per day</Text>
          </View>
          <TouchableOpacity onPress={handleSave} activeOpacity={0.8} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Change budget →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Sleek Numpad ──────────────────── */}
        <View style={styles.numpad}>
          {numpadKeys.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleKey(key)}
              style={styles.numpadBtn}
              activeOpacity={0.6}
            >
              {key === 'del' ? (
                <Text style={styles.numpadText}>⌫</Text>
              ) : (
                <Text style={styles.numpadText}>{key}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Rest Options Menu Modal ───────── */}
      {restMenuOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setRestMenuOpen(false)} />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What to do with the rest?</Text>
            {restOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.modalRow}
                onPress={() => {
                  setRestOption(opt);
                  setRestMenuOpen(false);
                }}
              >
                <Text style={[styles.modalRowText, restOption === opt && { color: '#ffb74d' }]}>{opt}</Text>
                {restOption === opt && <Text style={{ color: '#ffb74d', fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#171614' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
  backBtn: { marginRight: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f5f4ed' },
  prevBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, alignSelf: 'flex-start', marginTop: 10 },
  prevBtnText: { fontSize: 13, fontWeight: '600', color: '#f5f4ed' },
  displayArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  displayText: { fontSize: 68, fontWeight: '900', letterSpacing: -2, color: '#f5f4ed' },
  configArea: { paddingHorizontal: 20, gap: 24 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 32, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 16, fontWeight: '600', marginLeft: 12, color: '#f5f4ed' },
  rowVal: { fontSize: 15, fontWeight: '500', color: '#a0a09a' },
  bottomArea: { paddingHorizontal: 20, paddingBottom: 24, marginTop: 'auto' },
  totalRow: { marginBottom: 16 },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#f5f4ed' },
  totalSub: { fontSize: 14, marginTop: 2, color: '#a0a09a' },
  saveBtn: { paddingVertical: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffb74d' },
  saveBtnText: { fontSize: 18, fontWeight: '800', color: '#4E342E' },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', paddingBottom: 10, backgroundColor: '#1b1a18', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  numpadBtn: { width: '33.33%', height: 60, alignItems: 'center', justifyContent: 'center' },
  numpadText: { fontSize: 28, fontWeight: '500', color: '#f5f4ed' },

  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#21201d', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#f5f4ed', marginBottom: 16 },
  modalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  modalRowText: { fontSize: 16, fontWeight: '600', color: '#f5f4ed' },
});
