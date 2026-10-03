// ============================================================
// App.tsx – Root: session bootstrap + auth/main gating
// ============================================================
import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn, useSharedValue, withSpring, useAnimatedStyle, withRepeat, withTiming, Easing, withSequence, withDelay } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer, DefaultTheme, DarkTheme as NavDark } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';

import { ThemeProvider, PALETTES, useTheme } from './src/theme';
import { useAuthStore } from './src/store/useAuthStore';
import { useStore } from './src/store/useStore';
import AuthNavigator from './src/navigation/AuthNavigator';
import RootNavigator from './src/navigation/RootNavigator';

// ── Inner: rendered inside ThemeProvider ─────────────────────
function InnerApp() {
  const t          = useTheme();
  const isDark     = useStore((s) => s.isDarkMode);
  const paletteId  = useStore((s) => s.paletteId);
  const palette    = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const colors     = isDark ? palette.dark : palette.light;

  const user       = useAuthStore((s) => s.user);
  const isLoading  = useAuthStore((s) => s.isLoading);
  const bootstrap  = useAuthStore((s) => s.bootstrap);
  const initWs     = useStore((s) => s.initWsListeners);
  const fetchGroups = useStore((s) => s.fetchGroups);

  const [isAnimationDone, setIsAnimationDone] = useState(false);

  // ── Boot sequence ─────────────────────────────────────────
  useEffect(() => {
    bootstrap();
    // Artificial delay for the premium splash animation
    setTimeout(() => {
      setIsAnimationDone(true);
    }, 2800);
  }, []);

  // ── When user logs in: fetch data + connect WS ───────────
  useEffect(() => {
    if (!user) return;
    fetchGroups();
    const cleanup = initWs();
    return cleanup;
  }, [user?.id]);

  const paperTheme = isDark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: colors.primary, background: colors.background, surface: colors.surface } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: colors.primary, background: colors.background, surface: colors.surface } };

  const navTheme = isDark
    ? { ...NavDark,       colors: { ...NavDark.colors,       background: colors.background, card: colors.surface, text: colors.onSurface, border: colors.outlineVariant, primary: colors.primary, notification: colors.primary } }
    : { ...DefaultTheme,  colors: { ...DefaultTheme.colors,  background: colors.background, card: colors.surface, text: colors.onSurface, border: colors.outlineVariant, primary: colors.primary, notification: colors.primary } };



  return (
    <View style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          {user ? <RootNavigator /> : <AuthNavigator />}
        </NavigationContainer>
      </PaperProvider>

      {/* ── Premium Splash Screen Overlay ── */}
      {(isLoading || !isAnimationDone) && (
        <Animated.View 
          exiting={FadeOut.duration(800)} 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', zIndex: 999 }}
        >
          <Animated.View entering={ZoomIn.duration(800).springify()}>
            <View style={{
              width: 100, height: 100, borderRadius: 30, backgroundColor: colors.primaryContainer,
              alignItems: 'center', justifyContent: 'center', elevation: 20, shadowColor: colors.primary
            }}>
              <MaterialIcons name="call-split" size={54} color={colors.onPrimaryContainer} />
            </View>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(600).duration(800)} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.primary, letterSpacing: -1 }}>SplitWise</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.outline, letterSpacing: 4, marginTop: 4 }}>REIMAGINED</Text>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(1200).duration(800)} style={{ position: 'absolute', bottom: 50, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: colors.onSurfaceVariant, opacity: 0.6 }}>Developed by</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.primary, marginTop: 2 }}>Pranshu Singh</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <InnerApp />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
