import { registerRootComponent } from 'expo';
import App from "./App";
import RootLayout from "./_layout";
export const colors = {
  primary: '#1D9E75',
  primaryLight: '#E1F5EE',
  primaryDark: '#0F6E56',

  background: '#FFFFFF',
  surface: '#F5F5F3',
  surfaceHover: '#EDEDEB',

  text: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9B9B9B',
  textInverse: '#FFFFFF',

  border: 'rgba(0,0,0,0.08)',
  borderHover: 'rgba(0,0,0,0.15)',

  danger: '#E24B4A',
  dangerLight: '#FCEBEB',
  warning: '#EF9F27',
  warningLight: '#FAEEDA',
  success: '#1D9E75',
  successLight: '#E1F5EE',
  info: '#378ADD',
  infoLight: '#E6F1FB',

  coral: '#D85A30',
  coralLight: '#FAECE7',
  purple: '#7F77DD',
  purpleLight: '#EEEDFE',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
  },
} as const;

registerRootComponent(RootLayout);
