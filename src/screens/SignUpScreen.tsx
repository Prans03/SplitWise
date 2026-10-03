// ============================================================
// SignUpScreen – Matching Buckwheat design
// Name + email + password + confirm-password validation
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, StatusBar, Animated, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme';
import { AuthStackParamList } from '../types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function SignUpScreen() {
  const nav  = useNavigation<Nav>();
  const t    = useTheme();
  const signUp      = useAuthStore((s) => s.signUp);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error       = useAuthStore((s) => s.error);
  const clearError  = useAuthStore((s) => s.clearError);

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const btnScale  = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const validate = (): string | null => {
    if (!name.trim())     return 'Display name is required';
    if (!email.trim())    return 'Email is required';
    if (!email.includes('@')) return 'Enter a valid email address';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirm) return 'Passwords do not match';
    return null;
  };

  const handleSignUp = async () => {
    clearError();
    setLocalErr('');
    const validErr = validate();
    if (validErr) { setLocalErr(validErr); shake(); return; }
    const ok = await signUp(name.trim(), email.trim(), password);
    if (!ok) shake();
  };

  const displayError = localErr || error;
  const onPressIn  = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1,    useNativeDriver: true }).start();

  // Password strength
  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : 2;
  const strengthColor = ['transparent', '#E53E3E', '#C8973F', '#8DC63F'][strength];
  const strengthLabel = ['', 'Too short', 'Good', 'Strong'][strength];

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.background }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.background} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Back */}
          <TouchableOpacity onPress={() => nav.goBack()} style={[styles.backBtn, { backgroundColor: t.surfaceVariant }]}>
            <Text style={[{ fontSize: 18, color: t.onSurface }]}>←</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <View style={[styles.logoCircle, { backgroundColor: t.primaryContainer }]}>
              <Text style={styles.logoEmoji}>🌾</Text>
            </View>
            <Text style={[styles.appName, { color: t.onBackground }]}>Create Account</Text>
            <Text style={[styles.tagline, { color: t.onSurfaceVariant }]}>
              Join SplitWise and start splitting expenses
            </Text>
          </View>

          {/* Form */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <View style={[styles.card, { backgroundColor: t.surface }]}>

              {/* Name */}
              <InputField icon="👤" placeholder="Display name" value={name}
                onChangeText={(v: string) => { setName(v); setLocalErr(''); clearError(); }} t={t} />

              {/* Email */}
              <InputField icon="📧" placeholder="Email address" value={email}
                onChangeText={(v: string) => { setEmail(v); setLocalErr(''); clearError(); }}
                keyboardType="email-address" autoCapitalize="none" t={t} />

              {/* Password */}
              <View style={[styles.inputWrap, { borderColor: t.outlineVariant, backgroundColor: t.background }]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { color: t.onSurface }]}
                  placeholder="Password (min. 8 characters)"
                  placeholderTextColor={t.onSurfaceVariant}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setLocalErr(''); clearError(); }}
                  secureTextEntry={!showPass}
                />
                <Pressable onPress={() => setShowPass((v) => !v)}>
                  <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
                </Pressable>
              </View>

              {/* Strength bar */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  <View style={[styles.strengthTrack, { backgroundColor: t.surfaceVariant }]}>
                    <View style={[styles.strengthFill, { width: `${strength * 33.3}%`, backgroundColor: strengthColor }]} />
                  </View>
                  <Text style={[styles.strengthLabel, { color: strengthColor }]}>{strengthLabel}</Text>
                </View>
              )}

              {/* Confirm */}
              <InputField icon="🔐" placeholder="Confirm password" value={confirm}
                onChangeText={(v: string) => { setConfirm(v); setLocalErr(''); clearError(); }}
                secureTextEntry={!showPass} t={t} />

              {/* Error */}
              {displayError ? (
                <View style={[styles.errorBanner, { backgroundColor: t.errorContainer }]}>
                  <Text style={[styles.errorText, { color: t.error }]}>⚠️ {displayError}</Text>
                </View>
              ) : null}

              {/* Submit */}
              <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: t.primary }, isSubmitting && { opacity: 0.7 }]}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  onPress={handleSignUp}
                  disabled={isSubmitting}
                >
                  <Text style={[styles.submitText, { color: t.onPrimary }]}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Text>
                </Pressable>
              </Animated.View>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: t.onSurfaceVariant }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => { clearError(); nav.goBack(); }}>
              <Text style={[styles.footerLink, { color: t.primary }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize, secureTextEntry, t }: any) {
  return (
    <View style={[styles.inputWrap, { borderColor: t.outlineVariant, backgroundColor: t.background }]}>
      <Text style={styles.inputIcon}>{icon}</Text>
      <TextInput
        style={[styles.input, { color: t.onSurface }]}
        placeholder={placeholder}
        placeholderTextColor={t.onSurfaceVariant}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
        secureTextEntry={secureTextEntry}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  scroll:        { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 24 },
  backBtn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  hero:          { alignItems: 'center', marginBottom: 24, gap: 8 },
  logoCircle:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  logoEmoji:     { fontSize: 32 },
  appName:       { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  tagline:       { fontSize: 13, textAlign: 'center' },
  card:          { borderRadius: 28, padding: 22, gap: 12, elevation: 4, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inputIcon:     { fontSize: 16 },
  input:         { flex: 1, fontSize: 15, fontWeight: '500' },
  strengthRow:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  strengthFill:  { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700', width: 55 },
  errorBanner:   { borderRadius: 12, padding: 12 },
  errorText:     { fontSize: 13, fontWeight: '600' },
  submitBtn:     { borderRadius: 999, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitText:    { fontSize: 16, fontWeight: '800' },
  footer:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText:    { fontSize: 14 },
  footerLink:    { fontSize: 14, fontWeight: '800' },
});
