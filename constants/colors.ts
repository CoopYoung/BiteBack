export const COLORS = {
  // Primary brand colors
  primary: '#00D9A3', // Teal accent
  dark: '#0F0F0F', // Matte black
  white: '#FFFFFF',

  // Value score colors (heat map)
  excellent: '#10B981', // Green (150+ cals/$)
  good: '#F59E0B', // Amber (50-150 cals/$)
  poor: '#EF4444', // Red (<50 cals/$)

  // Neutral palette
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const THEME = {
  colors: COLORS,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fonts: {
    xs: 10,
    small: 12,
    sm: 13,
    base: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};
