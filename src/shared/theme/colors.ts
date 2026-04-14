export type ThemeMode = 'light' | 'dark';

export type ThemeColors = {
  text: string;
  textMuted: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  primary: string;
  secondary: string;
  accent: string;
  forest: string;
  white: string;
  error: string;
};

export const LIGHT_COLORS: ThemeColors = {
  text: '#0F1510',
  textMuted: '#5E7164',
  background: '#F1F9F4',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF8F2',
  primary: '#4DC763',
  secondary: '#86E998',
  accent: '#FCA326',
  forest: '#11351A',
  white: '#FFFFFF',
  error: '#FF4D4D',
};

export const DARK_COLORS: ThemeColors = {
  text: '#F5F7F6',
  textMuted: '#BFD4C3',
  background: '#0C100D',
  surface: '#11351A',
  surfaceAlt: '#1A2E1F',
  primary: '#4CBA5B',
  secondary: '#267F35',
  accent: '#FCA326',
  forest: '#11351A',
  white: '#F5F7F6',
  error: '#FF6B6B',
};

export const APP_THEMES: Record<ThemeMode, ThemeColors> = {
  light: LIGHT_COLORS,
  dark: DARK_COLORS,
};

export const COLORS = LIGHT_COLORS;

export function withAlpha(hex: string, alpha: string): string {
  return `${hex}${alpha}`;
}
