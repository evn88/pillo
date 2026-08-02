import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const colors = {
  light: {
    background: isIOS ? '#F2F2F7' : '#F7F2FA',
    surface: '#FFFFFF',
    surfaceMuted: isIOS ? '#E9E9EF' : '#E8DEF8',
    text: isIOS ? '#1C1C1E' : '#1D1B20',
    textMuted: isIOS ? '#636366' : '#49454F',
    border: isIOS ? '#D1D1D6' : '#CAC4D0',
    primary: '#6557C8',
    primarySoft: isIOS ? '#E5E1FA' : '#E8DEF8',
    success: '#34785B',
    successSoft: '#DDF3E7',
    warning: '#8A5A13',
    warningSoft: '#FCECCB',
    danger: isIOS ? '#D70015' : '#BA1A1A',
    dangerSoft: '#FBE4E7'
  },
  dark: {
    background: isIOS ? '#000000' : '#141218',
    surface: isIOS ? '#1C1C1E' : '#211F26',
    surfaceMuted: isIOS ? '#2C2C2E' : '#36303D',
    text: isIOS ? '#FFFFFF' : '#E6E0E9',
    textMuted: isIOS ? '#AEAEB2' : '#CAC4D0',
    border: isIOS ? '#38383A' : '#49454F',
    primary: '#C8BFFF',
    primarySoft: '#3E3763',
    success: '#8BC9AA',
    successSoft: '#253D33',
    warning: '#E3BC79',
    warningSoft: '#443720',
    danger: isIOS ? '#FF6961' : '#FFB4AB',
    dangerSoft: '#4B2329'
  }
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
} as const;

export const radii = {
  sm: 8,
  md: isIOS ? 12 : 16,
  lg: isIOS ? 18 : 24,
  pill: 999
} as const;
