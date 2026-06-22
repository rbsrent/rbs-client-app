export const COLORS = {
  brandNavy: '#1B2A41',
  brandCyan: '#2BC4E5',
  brandViolet: '#7B5CE6',
  brandMagenta: '#E260C0',
  brandBlue: '#2086D9',

  grey: '#8E8E8E',
  greyDark: '#D9D9D9',
  greyLight: '#F7F7F7',
  greyLight2: '#F2F2F2',

  gradientStart: '#2BC4E5',
  gradientMid: '#7B5CE6',
  gradientEnd: '#E260C0',

  success: '#25A077',
  successLight: '#E8F7F2',
  warning: '#F5A623',
  warningLight: '#FEF6E7',
  error: '#F24242',
  errorLight: '#FEF0F0',

  background: '#FFFFFF',
  backgroundAlt: '#F5F7FA',
  card: '#FFFFFF',
  border: '#DDE3EC',
  divider: '#F0F4F9',
  muted: '#EEF2F7',


  text1: '#0B1120',
  text2: '#6B7A8D',
  text3: '#9AAABB',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  red: '#FF6C6C',
  yellow: '#FFDA62'
} as const;

export type Color = keyof typeof COLORS;
