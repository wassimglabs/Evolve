/**
 * EVOLVE design tokens. Dark is the source of truth; light is derived from the
 * same structure and kept compatible with the same token names.
 */

export const colors = {
  dark: {
    background: '#0E1014',
    surface: '#161A21',
    surface2: '#1D222B',
    tabBar: '#12151B',
    border: '#232833',
    borderStrong: '#2A303B',
    dashed: '#3A4250',
    text: '#ECEEF2',
    textMuted: '#A3AAB8',
    muted: '#A3AAB8',
    accent: '#6FE3B5',
    onAccent: '#08130E',
    primary: '#6FE3B5',
    onPrimary: '#08130E',
    danger: '#F87171',
    destructive: '#F87171',
    onDestructive: '#FFFFFF',
    laneStudy: '#8AB4FF',
    laneSolven: '#6FE3B5',
    laneCareer: '#F4B860',
    laneLife: '#C4B5FD',
    highlightBg: '#12261F',
    highlightBorder: '#2E5C4B',
    highlightCareerBg: '#241D10',
    highlightCareerBorder: '#5C4A22',
  },
  light: {
    background: '#F3F5F7',
    surface: '#FFFFFF',
    surface2: '#EEF2F7',
    tabBar: '#F4F7FA',
    border: '#D8DEE7',
    borderStrong: '#BFC9D8',
    dashed: '#B9C0CC',
    text: '#161B22',
    textMuted: '#5F6B7A',
    muted: '#5F6B7A',
    accent: '#56C69E',
    onAccent: '#08130E',
    primary: '#56C69E',
    onPrimary: '#08130E',
    danger: '#D86060',
    destructive: '#D86060',
    onDestructive: '#FFFFFF',
    laneStudy: '#4B82F7',
    laneSolven: '#49BE8A',
    laneCareer: '#D99A2B',
    laneLife: '#9C7BE3',
    highlightBg: '#E7F6EF',
    highlightBorder: '#89B8A4',
    highlightCareerBg: '#F6E9D3',
    highlightCareerBorder: '#D7B36E',
  },
} as const;

export type ThemeColors = (typeof colors)['dark'];

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 22,
} as const;

export const sidePadding = 20;

export const fontSizes = {
  h1: 32,
  h2: 17,
  body: 16,
  bodySmall: 15,
  caption: 14,
  small: 13,
  tiny: 12.5,
  micro: 12,
  mini: 11,
} as const;

export const fontFamilies = {
  title: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;
