// ============================================================
// SignInScreen – Matching the uploaded media_1790930720682.png
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Pressable,
  KeyboardAvoidingView, Platform, StatusBar, Animated,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { TouchableRipple } from 'react-native-paper';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/useAuthStore';
import { useTheme } from '../theme';
import { AuthStackParamList } from '../types';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export default function SignInScreen() {
  const nav = useNavigation<Nav>();
  const t = useTheme();
  const signIn = useAuthStore((s) => s.signIn);
  const isSubmitting = useAuthStore((s) => s.isSubmitting);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const btnScale = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSignIn = async () => {
    clearError();
    if (!contact.trim() || !password) { shake(); return; }
    // Just try to sign in
    const ok = await signIn(contact.trim(), password); 
    if (!ok) shake();
  };



  const onPressIn = () => Animated.spring(btnScale, { toValue: 0.95, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.surface }]} edges={['top', 'bottom']}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} backgroundColor={t.surface} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Top Header - Removed back arrow and side images as requested */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: t.onSurface }]}>Splitwise</Text>
        </View>

        <View style={styles.content}>
          {/* Logo & Hero */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <View style={[styles.logoBox, { backgroundColor: t.surface, borderColor: t.outlineVariant }]}>
                <Image
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0QTl8yfIq3SeHcHCNQ8nn-7oEDrBcgDjMZdvBbvQC8KjC9YeIzQT2GjLmkgfg8FEUtklldEb_kQt1No9i0F8mFyMJ-wlZiuQ-IerGws4DjROxBKqFOsbY6etGWEe5yO92Jf5_GqzqafFdqXPQRG3wL4ql_22GePOafdSngOdTTM1hBnkXYZlmpEFj_ZBSdlFnG6Hoa6peMzojKM04Ev_kEYwJCcTkQgHWydGY3KsDz7Z59nk2eBgYGg' }}
                  style={{ width: 64, height: 64 }}
                  resizeMode="contain"
                />
              </View>
              <View style={[styles.badge, { backgroundColor: t.primary }]}>
                <MaterialIcons name="eco" size={16} color={t.onPrimary} />
              </View>
            </View>

            <Text style={[styles.appName, { color: t.onSurface }]}>Splitwise</Text>

            <Text style={[styles.termsText, { color: t.onSurfaceVariant }]}>
              By continuing, you agree to Splitwise{'\n'}
              <Text style={{ textDecorationLine: 'underline', color: t.onSurface }}>Terms of Service</Text> & <Text style={{ textDecorationLine: 'underline', color: t.onSurface }}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* OAuth & Form */}
          <Animated.View style={{ transform: [{ translateX: shakeAnim }], width: '100%', paddingHorizontal: 24, gap: 16, marginTop: 32 }}>



            {/* Input Email */}
            <View style={[styles.inputWrap, { backgroundColor: t.surfaceVariant }]}>
              <MaterialIcons name="fingerprint" size={24} color={t.outline} />
              <TextInput
                style={[styles.input, { color: t.onSurface, marginLeft: 12 }]}
                placeholder="Email or mobile number"
                placeholderTextColor={t.onSurfaceVariant}
                value={contact}
                onChangeText={(v) => { setContact(v); clearError(); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Input Password */}
            <View style={[styles.inputWrap, { backgroundColor: t.surfaceVariant }]}>
              <Text style={{ fontSize: 18, marginLeft: 4, marginRight: 8, color: t.outline }}>🔒</Text>
              <TextInput
                style={[styles.input, { color: t.onSurface }]}
                placeholder="Password"
                placeholderTextColor={t.onSurfaceVariant}
                value={password}
                onChangeText={(v) => { setPassword(v); clearError(); }}
                secureTextEntry={!showPass}
              />
              <Pressable onPress={() => setShowPass((v) => !v)} style={{ padding: 4 }}>
                <Text style={{ fontSize: 16 }}>{showPass ? '🙈' : '👁️'}</Text>
              </Pressable>
            </View>

            {/* Error */}
            {error && (
              <Text style={[styles.errorText, { color: t.error }]}>{error}</Text>
            )}

            {/* Submit */}
            <Animated.View style={{ transform: [{ scale: btnScale }], marginTop: 8 }}>
              <TouchableRipple
                style={[styles.submitBtn, { backgroundColor: t.primary }]}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={handleSignIn}
                disabled={isSubmitting}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                  <Text style={[styles.submitText, { color: t.onPrimary }]}>
                    Continue
                  </Text>
                  <MaterialIcons name="arrow-forward" size={20} color={t.onPrimary} style={{ marginLeft: 8 }} />
                </View>
              </TouchableRipple>
            </Animated.View>

            {/* Create Account Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <Text style={{ color: t.onSurfaceVariant, fontSize: 14 }}>New to Splitwise? </Text>
              <TouchableOpacity onPress={() => { clearError(); nav.navigate('SignUp'); }}>
                <Text style={{ color: t.primary, fontSize: 14, fontWeight: '700' }}>Create an account</Text>
              </TouchableOpacity>
            </View>

          </Animated.View>

          {/* Bottom Footer */}
          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: 24, paddingHorizontal: 32 }}>
            <Text style={[styles.bottomTerms, { color: t.onSurfaceVariant }]}>
              By continuing, you agree to Splitwise <Text style={{ textDecorationLine: 'underline' }}>Terms of Service</Text> & <Text style={{ textDecorationLine: 'underline' }}>Privacy Policy</Text>.
            </Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, height: 60 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', paddingTop: 24 },
  hero: { alignItems: 'center', paddingHorizontal: 32, gap: 16 },
  logoContainer: { position: 'relative', marginBottom: 8 },
  logoBox: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4 },
  badge: { position: 'absolute', bottom: -4, right: -4, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  appName: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  termsText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  googleBtn: { height: 56, borderRadius: 28, borderWidth: 1, width: '100%', overflow: 'hidden' },
  googleText: { fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 64, borderRadius: 16, paddingHorizontal: 20 },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  errorText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  submitBtn: { height: 64, borderRadius: 32, elevation: 2, overflow: 'hidden' },
  submitText: { fontSize: 18, fontWeight: '700' },
  bottomTerms: { fontSize: 12, textAlign: 'center', lineHeight: 18 }
});
