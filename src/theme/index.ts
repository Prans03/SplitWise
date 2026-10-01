// ============================================================
// SplitWise – Material You / MD3 Theme
// ============================================================

export const MD3Colors = {
  // Primary - Deep Purple / Violet
  primary: '#6750A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EADDFF',
  onPrimaryContainer: '#21005D',

  // Secondary - Mauve
  secondary: '#625B71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E8DEF8',
  onSecondaryContainer: '#1D192B',

  // Tertiary - Rose
  tertiary: '#7D5260',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#FFD8E4',
  onTertiaryContainer: '#31111D',

  // Error
  error: '#B3261E',
  onError: '#FFFFFF',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',

  // Success
  success: '#386A20',
  successContainer: '#C3EFAD',

  // Surface
  surface: '#FFFBFE',
  onSurface: '#1C1B1F',
  surfaceVariant: '#E7E0EC',
  onSurfaceVariant: '#49454F',

  // Background
  background: '#FFFBFE',
  onBackground: '#1C1B1F',

  // Outline
  outline: '#79747E',
  outlineVariant: '#CAC4D0',

  // Shadow
  shadow: '#000000',

  // Scrim
  scrim: '#000000',

  // Inverse
  inverseSurface: '#313033',
  inverseOnSurface: '#F4EFF4',
  inversePrimary: '#D0BCFF',
};

export const DarkMD3Colors = {
  primary: '#D0BCFF',
  onPrimary: '#381E72',
  primaryContainer: '#4F378B',
  onPrimaryContainer: '#EADDFF',

  secondary: '#CCC2DC',
  onSecondary: '#332D41',
  secondaryContainer: '#4A4458',
  onSecondaryContainer: '#E8DEF8',

  tertiary: '#EFB8C8',
  onTertiary: '#492532',
  tertiaryContainer: '#633B48',
  onTertiaryContainer: '#FFD8E4',

  error: '#F2B8B5',
  onError: '#601410',
  errorContainer: '#8C1D18',
  onErrorContainer: '#F9DEDC',

  success: '#9FD67A',
  successContainer: '#205108',

  surface: '#141218',
  onSurface: '#E6E1E5',
  surfaceVariant: '#49454F',
  onSurfaceVariant: '#CAC4D0',

  background: '#141218',
  onBackground: '#E6E1E5',

  outline: '#938F99',
  outlineVariant: '#49454F',

  shadow: '#000000',
  scrim: '#000000',

  inverseSurface: '#E6E1E5',
  inverseOnSurface: '#313033',
  inversePrimary: '#6750A4',
};

export const CATEGORY_COLORS: Record<string, string> = {
  groceries: '#4CAF50',
  food: '#FF9800',
  transport: '#2196F3',
  utilities: '#9C27B0',
  entertainment: '#E91E63',
  health: '#F44336',
  shopping: '#FF5722',
  rent: '#607D8B',
  other: '#795548',
};

export const CATEGORY_ICONS: Record<string, string> = {
  groceries: '🛒',
  food: '🍽️',
  transport: '🚗',
  utilities: '⚡',
  entertainment: '🎬',
  health: '💊',
  shopping: '🛍️',
  rent: '🏠',
  other: '📦',
};

export const AVATAR_COLORS = [
  '#6750A4', '#7B61FF', '#E91E63', '#FF5722',
  '#2196F3', '#00BCD4', '#4CAF50', '#FF9800',
  '#9C27B0', '#F44336', '#3F51B5', '#009688',
];

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Typography = {
  displayLarge: { fontSize: 57, fontWeight: '400' as const, letterSpacing: -0.25 },
  displayMedium: { fontSize: 45, fontWeight: '400' as const },
  displaySmall: { fontSize: 36, fontWeight: '400' as const },
  headlineLarge: { fontSize: 32, fontWeight: '400' as const },
  headlineMedium: { fontSize: 28, fontWeight: '400' as const },
  headlineSmall: { fontSize: 24, fontWeight: '400' as const },
  titleLarge: { fontSize: 22, fontWeight: '400' as const },
  titleMedium: { fontSize: 16, fontWeight: '500' as const, letterSpacing: 0.15 },
  titleSmall: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, letterSpacing: 0.5 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, letterSpacing: 0.25 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0.4 },
  labelLarge: { fontSize: 14, fontWeight: '500' as const, letterSpacing: 0.1 },
  labelMedium: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.5 },
  labelSmall: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.5 },
};
