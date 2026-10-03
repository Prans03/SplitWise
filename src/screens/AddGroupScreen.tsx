// ============================================================
// AddGroupScreen – API-backed group creation
// ============================================================
import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Animated, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStore } from '../store/useStore';
import { useTheme } from '../theme';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const EMOJIS = ['👥','🏠','✈️','🍽️','🎉','🛒','💼','🏋️','🎮','📚','🌴','💊','🚗','🎸'];

export default function AddGroupScreen() {
  const nav  = useNavigation<Nav>();
  const t    = useTheme();
  const createGroup = useStore((s) => s.createGroup);

  const [name,     setName]     = useState('');
  const [emoji,    setEmoji]    = useState('👥');
  const [loading,  setLoading]  = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  const handleCreate = useCallback(async () => {
    if (!name.trim()) { Alert.alert('Name required'); return; }
    setLoading(true);
    const group = await createGroup(name.trim(), emoji);
    setLoading(false);
    if (group) {
      nav.replace('GroupDetail', { groupId: group.id });
    } else {
      Alert.alert('Error', 'Failed to create group. Check your connection.');
    }
  }, [name, emoji, createGroup, nav]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />

      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]}>
          <Text style={[{ fontSize: 18, color: t.onSurface }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.onBackground }]}>New Group</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: t.primaryContainer }]}>
          <Text style={{ fontSize: 56 }}>{emoji}</Text>
          <Text style={[styles.previewName, { color: t.onPrimaryContainer }]}>
            {name || 'Group Name'}
          </Text>
        </View>

        {/* Group name */}
        <Text style={[styles.label, { color: t.onSurfaceVariant }]}>GROUP NAME</Text>
        <View style={[styles.inputWrap, { backgroundColor: t.surface, borderColor: t.outlineVariant }]}>
          <TextInput
            style={[styles.input, { color: t.onSurface }]}
            placeholder="e.g. Flatmates, Goa Trip, Office Lunch…"
            placeholderTextColor={t.onSurfaceVariant}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
        </View>

        {/* Emoji picker */}
        <Text style={[styles.label, { color: t.onSurfaceVariant }]}>PICK AN EMOJI</Text>
        <View style={styles.emojiGrid}>
          {EMOJIS.map((e) => (
            <TouchableOpacity
              key={e}
              onPress={() => setEmoji(e)}
              style={[styles.emojiBtn, { backgroundColor: e === emoji ? t.primaryContainer : t.surfaceVariant }]}
            >
              <Text style={{ fontSize: 26 }}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create button */}
      <View style={[styles.footer, { backgroundColor: t.background, borderTopColor: t.outlineVariant }]}>
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: t.primary }, loading && { opacity: 0.7 }]}
            onPressIn={onIn}
            onPressOut={onOut}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={[styles.createText, { color: t.onPrimary }]}>
              {loading ? 'Creating...' : `${emoji} Create Group`}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  topBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:    { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title:      { fontSize: 18, fontWeight: '800' },
  content:    { paddingHorizontal: 16 },
  preview:    { borderRadius: 24, alignItems: 'center', paddingVertical: 32, marginBottom: 24, gap: 10 },
  previewName:{ fontSize: 22, fontWeight: '800' },
  label:      { fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 },
  inputWrap:  { borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 20 },
  input:      { fontSize: 16, fontWeight: '500' },
  emojiGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  emojiBtn:   { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footer:     { padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  createBtn:  { borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  createText: { fontSize: 16, fontWeight: '800' },
});
