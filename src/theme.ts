export const colors = {
  primary: '#CE6A1B',
  primaryLight: '#F6EADA',
  primaryDark: '#9A4C10',

  background: '#FBF4EA',
  surface: '#FBEADA',
  surfaceHover: '#F6EADA',
  card: '#FFFFFF',

  navy: '#16233F',

  text: '#16233F',
  textSecondary: 'rgba(22, 35, 63, 0.65)',
  textTertiary: 'rgba(22, 35, 63, 0.45)',
  textInverse: '#FFFFFF',

  border: 'rgba(22, 35, 63, 0.08)',
  borderHover: 'rgba(22, 35, 63, 0.15)',

  danger: '#B3372F',
  dangerLight: '#F7E6E2',
  warning: '#A87700',
  warningLight: '#F7EDD5',
  success: '#1F7A5C',
  successLight: '#E1EFE7',
  info: '#2F6FA8',
  infoLight: '#E3EDF6',

  chartGradientStart: '#F0C793',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

export const typography = {
  display: {
    fontSize: 40,
    fontWeight: '800' as const,
    letterSpacing: -1.5,
  },
  h1: {
    fontSize: 32,
    fontWeight: '800' as const,
    letterSpacing: -1,
  },
  h2: {
    fontSize: 24,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  h3: {
    fontSize: 18,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
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
  eyebrow: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.7,
  },
} as const;
