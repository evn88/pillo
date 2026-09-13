import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

export const colors = {
  light: {
    background: '#F7F4F3',
    surface: '#FFFFFF',
    surfaceMuted: '#ECEAEA',
    text: '#343434',
    textMuted: '#6B6267',
    border: '#DED7DB',
    primary: '#934562',
    brand: '#F1ABC3',
    primarySoft: '#FBE5ED',
    success: '#34785B',
    successSoft: '#DDF3E7',
    warning: '#8A5A13',
    warningSoft: '#FCECCB',
    danger: isIOS ? '#D70015' : '#BA1A1A',
    dangerSoft: '#FBE4E7'
  },
  dark: {
    background: '#14161D',
    surface: '#20232D',
    surfaceMuted: '#2D303B',
    text: '#F5F1F3',
    textMuted: '#BAB2B8',
    border: '#3D3C49',
    primary: '#F1ABC3',
    brand: '#F1ABC3',
    primarySoft: '#5A3C4A',
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
