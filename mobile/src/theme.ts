export type ThemeMode = 'dark' | 'light';

export type ThemePalette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  mutedText: string;
  inputBackground: string;
  overlay: string;
  primary: string;
  primaryBorder: string;
  danger: string;
  dangerBorder: string;
};

const darkPalette: ThemePalette = {
  background: '#0d1117',
  surface: '#161b22',
  surfaceAlt: '#0f141b',
  border: '#30363d',
  text: '#f0f6fc',
  mutedText: '#8b949e',
  inputBackground: '#10161f',
  overlay: 'rgba(0,0,0,0.35)',
  primary: '#1f6feb',
  primaryBorder: '#388bfd',
  danger: '#301417',
  dangerBorder: '#8f3c42',
};

const lightPalette: ThemePalette = {
  background: '#f3f5f8',
  surface: '#ffffff',
  surfaceAlt: '#eef2f7',
  border: '#d0d8e3',
  text: '#1b1f24',
  mutedText: '#5c6877',
  inputBackground: '#f7f9fc',
  overlay: 'rgba(10,15,22,0.18)',
  primary: '#2d74da',
  primaryBorder: '#4a8ff2',
  danger: '#fff1f1',
  dangerBorder: '#e0a6a6',
};

export function getThemePalette(mode: ThemeMode): ThemePalette {
  return mode === 'light' ? lightPalette : darkPalette;
}
