// ============================================================
// SplitWise – Full Theme System with 8 Color Palettes + Dark variants
// ============================================================
import React, { createContext, useContext } from 'react';
import { useStore } from '../store/useStore';

export type PaletteId =
  | 'buckwheat'   // warm cream + lime (default)
  | 'ocean'       // navy + cyan
  | 'blossom'     // blush + rose
  | 'forest'      // dark green + lime
  | 'ember'       // dark brown + amber
  | 'midnight'    // near-black + violet
  | 'sunflower'   // warm yellow + orange
  | 'grape';      // deep purple + lavender

export interface ThemePalette {
  id: PaletteId;
  name: string;
  emoji: string;
  // Swatches for picker preview
  swatchPrimary: string;
  swatchBg: string;

  // Light variant
  light: ColorSet;
  // Dark variant
  dark: ColorSet;
}

export interface ColorSet {
  background: string;
  surface: string;
  surfaceVariant: string;
  primary: string;
  primaryLight: string;
  primaryContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  success: string;
  successContainer: string;
  error: string;
  errorContainer: string;
  onBackground: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  keypadBg: string;
  keypadKey: string;
  keypadKeyText: string;
  isDark: boolean;
}

export const PALETTES: ThemePalette[] = [
  {
    id: 'buckwheat',
    name: 'Buckwheat',
    emoji: '🌾',
    swatchPrimary: '#8DC63F',
    swatchBg: '#FAF6F0',
    light: {
      background: '#FBF9F2', surface: '#F5F4ED', surfaceVariant: '#E4E3DC',
      primary: '#334F25', primaryLight: '#AFD09B', primaryContainer: '#4A673B',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#C2E4AD',
      secondary: '#586249', secondaryContainer: '#DCE7C7', onSecondary: '#FFFFFF', onSecondaryContainer: '#161E0B',
      tertiary: '#614200', tertiaryContainer: '#FFDEAC',
      success: '#386A20', successContainer: '#B8F599', error: '#BA1A1A', errorContainer: '#FFDAD6',
      onBackground: '#1B1C18', onSurface: '#1B1C18', onSurfaceVariant: '#43483F', outline: '#74796E', outlineVariant: '#C3C8BB',
      keypadBg: '#EFEDE7', keypadKey: '#FFFFFF', keypadKeyText: '#1B1C18', isDark: false,
    },
    dark: {
      background: '#15120D', surface: '#1E1A14', surfaceVariant: '#2A251D',
      primary: '#CBEA86', primaryLight: '#A8D660', primaryContainer: '#2E4A00',
      onPrimary: '#1A2E00', onPrimaryContainer: '#CBEA86',
      secondary: '#F98D51', secondaryContainer: '#5A2800', onSecondary: '#4A1800', onSecondaryContainer: '#FFB88A',
      tertiary: '#C9AEFF', tertiaryContainer: '#4E3870',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#EDE0D4', onSurface: '#EDE0D4', onSurfaceVariant: '#AFA090', outline: '#5C5040', outlineVariant: '#3A3028',
      keypadBg: '#2A251D', keypadKey: '#342E25', keypadKeyText: '#EDE0D4', isDark: true,
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    swatchPrimary: '#00BCD4',
    swatchBg: '#F0F8FF',
    light: {
      background: '#F0F8FF', surface: '#FFFFFF', surfaceVariant: '#E0F2F7',
      primary: '#0097A7', primaryLight: '#4DD0E1', primaryContainer: '#B2EBF2',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#00363D',
      secondary: '#0F4C75', secondaryContainer: '#B3D4F0', onSecondary: '#FFFFFF', onSecondaryContainer: '#001E34',
      tertiary: '#006064', tertiaryContainer: '#A7FFEB',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#D4433B', errorContainer: '#FFDAD6',
      onBackground: '#001D24', onSurface: '#001D24', onSurfaceVariant: '#3F5860', outline: '#6F898E', outlineVariant: '#BDD4D8',
      keypadBg: '#E0F2F7', keypadKey: '#FFFFFF', keypadKeyText: '#001D24', isDark: false,
    },
    dark: {
      background: '#001418', surface: '#041C20', surfaceVariant: '#0A2830',
      primary: '#4DD0E1', primaryLight: '#80DEEA', primaryContainer: '#004E59',
      onPrimary: '#001D24', onPrimaryContainer: '#A2F0F9',
      secondary: '#82B1D4', secondaryContainer: '#0F3A5A', onSecondary: '#001D24', onSecondaryContainer: '#B3D4F0',
      tertiary: '#80CBC4', tertiaryContainer: '#004043',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#B8EBF4', onSurface: '#B8EBF4', onSurfaceVariant: '#7CC8D4', outline: '#3A6470', outlineVariant: '#1A3840',
      keypadBg: '#0A2830', keypadKey: '#10333C', keypadKeyText: '#B8EBF4', isDark: true,
    },
  },
  {
    id: 'blossom',
    name: 'Blossom',
    emoji: '🌺',
    swatchPrimary: '#E91E8C',
    swatchBg: '#FFF0F5',
    light: {
      background: '#FFF0F5', surface: '#FFFFFF', surfaceVariant: '#FCDDE8',
      primary: '#C2185B', primaryLight: '#F48FB1', primaryContainer: '#FFD6E4',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#3E0022',
      secondary: '#FF6B9D', secondaryContainer: '#FFD6E6', onSecondary: '#FFFFFF', onSecondaryContainer: '#3E0022',
      tertiary: '#9B59B6', tertiaryContainer: '#E8D5F5',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#B71C1C', errorContainer: '#FFDAD6',
      onBackground: '#25000F', onSurface: '#25000F', onSurfaceVariant: '#6E3050', outline: '#C49EB0', outlineVariant: '#EDCCD8',
      keypadBg: '#FCDDE8', keypadKey: '#FFFFFF', keypadKeyText: '#25000F', isDark: false,
    },
    dark: {
      background: '#160009', surface: '#200012', surfaceVariant: '#30001C',
      primary: '#F48FB1', primaryLight: '#F8BBD9', primaryContainer: '#5C0026',
      onPrimary: '#3E0022', onPrimaryContainer: '#FFD6E4',
      secondary: '#FFB3C8', secondaryContainer: '#6B0031', onSecondary: '#3E0022', onSecondaryContainer: '#FFD6E6',
      tertiary: '#CE93D8', tertiaryContainer: '#4A148C',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#FFD8E8', onSurface: '#FFD8E8', onSurfaceVariant: '#CCA0B5', outline: '#7A3050', outlineVariant: '#4A1030',
      keypadBg: '#30001C', keypadKey: '#3C0025', keypadKeyText: '#FFD8E8', isDark: true,
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    swatchPrimary: '#4CAF50',
    swatchBg: '#F1F8E9',
    light: {
      background: '#F1F8E9', surface: '#FFFFFF', surfaceVariant: '#DCEDC8',
      primary: '#2E7D32', primaryLight: '#81C784', primaryContainer: '#C8E6C9',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#00210A',
      secondary: '#8D6E63', secondaryContainer: '#E8D5C8', onSecondary: '#FFFFFF', onSecondaryContainer: '#2A1000',
      tertiary: '#006400', tertiaryContainer: '#B9F6CA',
      success: '#1B5E20', successContainer: '#A5D6A7', error: '#D4433B', errorContainer: '#FFDAD6',
      onBackground: '#001A04', onSurface: '#001A04', onSurfaceVariant: '#3D5B40', outline: '#72926A', outlineVariant: '#C5E1C0',
      keypadBg: '#DCEDC8', keypadKey: '#FFFFFF', keypadKeyText: '#001A04', isDark: false,
    },
    dark: {
      background: '#00120A', surface: '#001A0E', surfaceVariant: '#1A3020',
      primary: '#81C784', primaryLight: '#A5D6A7', primaryContainer: '#1B5E20',
      onPrimary: '#003910', onPrimaryContainer: '#C8E6C9',
      secondary: '#BCAAA4', secondaryContainer: '#5D4037', onSecondary: '#2A1000', onSecondaryContainer: '#E8D5C8',
      tertiary: '#69F0AE', tertiaryContainer: '#005025',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#C8EEC0', onSurface: '#C8EEC0', onSurfaceVariant: '#90B890', outline: '#406040', outlineVariant: '#203825',
      keypadBg: '#1A3020', keypadKey: '#203828', keypadKeyText: '#C8EEC0', isDark: true,
    },
  },
  {
    id: 'ember',
    name: 'Ember',
    emoji: '🔥',
    swatchPrimary: '#FF6D00',
    swatchBg: '#FFF3E0',
    light: {
      background: '#FFF8F2', surface: '#FFFFFF', surfaceVariant: '#FFE0C2',
      primary: '#E65100', primaryLight: '#FF9800', primaryContainer: '#FFE0B2',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#3D1400',
      secondary: '#C62828', secondaryContainer: '#FFCDD2', onSecondary: '#FFFFFF', onSecondaryContainer: '#3D0000',
      tertiary: '#F9A825', tertiaryContainer: '#FFF9C4',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#B71C1C', errorContainer: '#FFDAD6',
      onBackground: '#1E0A00', onSurface: '#1E0A00', onSurfaceVariant: '#6B3A20', outline: '#C4956A', outlineVariant: '#EDD5B8',
      keypadBg: '#FFE0C2', keypadKey: '#FFFFFF', keypadKeyText: '#1E0A00', isDark: false,
    },
    dark: {
      background: '#150A00', surface: '#1E1000', surfaceVariant: '#2E1C08',
      primary: '#FF9800', primaryLight: '#FFCC02', primaryContainer: '#3D1400',
      onPrimary: '#1E0A00', onPrimaryContainer: '#FFE0B2',
      secondary: '#FF8A80', secondaryContainer: '#6B0000', onSecondary: '#3D0000', onSecondaryContainer: '#FFCDD2',
      tertiary: '#FFF176', tertiaryContainer: '#6B5800',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#FFE5CC', onSurface: '#FFE5CC', onSurfaceVariant: '#D4A070', outline: '#7A4020', outlineVariant: '#4A2510',
      keypadBg: '#2E1C08', keypadKey: '#3A2210', keypadKeyText: '#FFE5CC', isDark: true,
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    swatchPrimary: '#7C4DFF',
    swatchBg: '#EDE7F6',
    light: {
      background: '#EDE7F6', surface: '#FFFFFF', surfaceVariant: '#D1C4E9',
      primary: '#5C35B0', primaryLight: '#9575CD', primaryContainer: '#D1C4E9',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#1A0062',
      secondary: '#283593', secondaryContainer: '#C5CAE9', onSecondary: '#FFFFFF', onSecondaryContainer: '#000051',
      tertiary: '#6A1B9A', tertiaryContainer: '#E1BEE7',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#D4433B', errorContainer: '#FFDAD6',
      onBackground: '#0D0025', onSurface: '#0D0025', onSurfaceVariant: '#4A3870', outline: '#8E7AAA', outlineVariant: '#C8BDE0',
      keypadBg: '#D1C4E9', keypadKey: '#FFFFFF', keypadKeyText: '#0D0025', isDark: false,
    },
    dark: {
      background: '#060014', surface: '#0E0820', surfaceVariant: '#1C1432',
      primary: '#B39DDB', primaryLight: '#CE93D8', primaryContainer: '#2C1870',
      onPrimary: '#0D0025', onPrimaryContainer: '#D1C4E9',
      secondary: '#9FA8DA', secondaryContainer: '#0D1466', onSecondary: '#000051', onSecondaryContainer: '#C5CAE9',
      tertiary: '#CE93D8', tertiaryContainer: '#38006B',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#E0D8FF', onSurface: '#E0D8FF', onSurfaceVariant: '#A898C8', outline: '#503870', outlineVariant: '#2A1E48',
      keypadBg: '#1C1432', keypadKey: '#241A3C', keypadKeyText: '#E0D8FF', isDark: true,
    },
  },
  {
    id: 'sunflower',
    name: 'Sunflower',
    emoji: '☀️',
    swatchPrimary: '#FFC107',
    swatchBg: '#FFFDE7',
    light: {
      background: '#FFFDE7', surface: '#FFFFFF', surfaceVariant: '#FFF9C4',
      primary: '#F57F17', primaryLight: '#FFD54F', primaryContainer: '#FFF176',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#3D2000',
      secondary: '#F4511E', secondaryContainer: '#FFCCBC', onSecondary: '#FFFFFF', onSecondaryContainer: '#3E0A00',
      tertiary: '#827717', tertiaryContainer: '#F9A825',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#D4433B', errorContainer: '#FFDAD6',
      onBackground: '#1C1400', onSurface: '#1C1400', onSurfaceVariant: '#5C4A00', outline: '#B89A00', outlineVariant: '#EDE080',
      keypadBg: '#FFF9C4', keypadKey: '#FFFFFF', keypadKeyText: '#1C1400', isDark: false,
    },
    dark: {
      background: '#100E00', surface: '#181400', surfaceVariant: '#252000',
      primary: '#FFD54F', primaryLight: '#FFE082', primaryContainer: '#4A3300',
      onPrimary: '#1C1400', onPrimaryContainer: '#FFF9C4',
      secondary: '#FF8A65', secondaryContainer: '#5A1A00', onSecondary: '#3E0A00', onSecondaryContainer: '#FFCCBC',
      tertiary: '#FFE57F', tertiaryContainer: '#404000',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#FFF5CC', onSurface: '#FFF5CC', onSurfaceVariant: '#D4B860', outline: '#604C00', outlineVariant: '#3C3000',
      keypadBg: '#252000', keypadKey: '#302800', keypadKeyText: '#FFF5CC', isDark: true,
    },
  },
  {
    id: 'grape',
    name: 'Grape',
    emoji: '🍇',
    swatchPrimary: '#9B27AF',
    swatchBg: '#F3E5F5',
    light: {
      background: '#F8F0FC', surface: '#FFFFFF', surfaceVariant: '#EDD5F5',
      primary: '#7B1FA2', primaryLight: '#CE93D8', primaryContainer: '#E1BEE7',
      onPrimary: '#FFFFFF', onPrimaryContainer: '#2A0040',
      secondary: '#4A148C', secondaryContainer: '#D1C4E9', onSecondary: '#FFFFFF', onSecondaryContainer: '#1A0062',
      tertiary: '#AD1457', tertiaryContainer: '#FCE4EC',
      success: '#4CAF50', successContainer: '#C8F5CC', error: '#D4433B', errorContainer: '#FFDAD6',
      onBackground: '#1C0028', onSurface: '#1C0028', onSurfaceVariant: '#5E3870', outline: '#A87EBC', outlineVariant: '#DDBBEC',
      keypadBg: '#EDD5F5', keypadKey: '#FFFFFF', keypadKeyText: '#1C0028', isDark: false,
    },
    dark: {
      background: '#100018', surface: '#18002A', surfaceVariant: '#28003D',
      primary: '#CE93D8', primaryLight: '#E1BEE7', primaryContainer: '#4A1060',
      onPrimary: '#2A0040', onPrimaryContainer: '#E1BEE7',
      secondary: '#B39DDB', secondaryContainer: '#2A0065', onSecondary: '#1A0062', onSecondaryContainer: '#D1C4E9',
      tertiary: '#F48FB1', tertiaryContainer: '#5E0030',
      success: '#6FCF73', successContainer: '#1B4020', error: '#FF897D', errorContainer: '#5C1916',
      onBackground: '#EDD0FF', onSurface: '#EDD0FF', onSurfaceVariant: '#C090D8', outline: '#6A3880', outlineVariant: '#3C1855',
      keypadBg: '#28003D', keypadKey: '#340050', keypadKeyText: '#EDD0FF', isDark: true,
    },
  },
];

export type Theme = ColorSet & { palette: ThemePalette };

const ThemeContext = createContext<Theme>({ ...PALETTES[0].light, palette: PALETTES[0] });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useStore((s) => s.isDarkMode);
  const paletteId = useStore((s) => s.paletteId);

  const palette = PALETTES.find((p) => p.id === paletteId) ?? PALETTES[0];
  const colorSet = isDark ? palette.dark : palette.light;
  const theme: Theme = { ...colorSet, palette };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

// ── Extra design constants ──────────────────────────────
export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const Radius = { sm: 8, md: 14, lg: 20, xl: 28, full: 999 };
