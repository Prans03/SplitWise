// ============================================================
// App.tsx – Root: session bootstrap + auth/main gating
// ============================================================
import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
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

  // ── Boot sequence ─────────────────────────────────────────
  useEffect(() => {
    bootstrap();
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

  // ── Loading spinner (session check) ──────────────────────
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <NavigationContainer theme={navTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        {user ? <RootNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </PaperProvider>
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
