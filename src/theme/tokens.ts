export const colors = {
  light: {
    background: '#F5F3F8',
    surface: '#FFFFFF',
    surfaceMuted: '#ECE9F2',
    text: '#26242A',
    textMuted: '#69646F',
    border: '#DED9E5',
    primary: '#7C5CB8',
    primarySoft: '#E9DFF7',
    success: '#3D775D',
    successSoft: '#DEEEE6',
    warning: '#986A27',
    warningSoft: '#F5E8CE',
    danger: '#A14850'
  },
  dark: {
    background: '#17151B',
    surface: '#232027',
    surfaceMuted: '#302B34',
    text: '#F3EFF7',
    textMuted: '#B8B0BF',
    border: '#403946',
    primary: '#C0A3ED',
    primarySoft: '#392D4D',
    success: '#8BC9AA',
    successSoft: '#253D33',
    warning: '#E3BC79',
    warningSoft: '#443720',
    danger: '#E99AA0'
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
  md: 12,
  lg: 16,
  pill: 999
} as const;
