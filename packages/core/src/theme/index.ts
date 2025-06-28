// Shared theme configuration for both desktop and mobile apps

export const colors = {
  primary: {
    main: '#2196F3',
    dark: '#1976D2',
    light: '#64B5F6',
  },
  secondary: {
    main: '#FFC107',
    dark: '#F57C00',
    light: '#FFD54F',
  },
  success: {
    main: '#4CAF50',
    dark: '#388E3C',
    light: '#81C784',
  },
  warning: {
    main: '#FF9800',
    dark: '#F57C00',
    light: '#FFB74D',
  },
  error: {
    main: '#F44336',
    dark: '#D32F2F',
    light: '#E57373',
  },
  info: {
    main: '#2196F3',
    dark: '#1976D2',
    light: '#64B5F6',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
    surface: '#f5f5f5',
  },
  text: {
    primary: '#333333',
    secondary: '#666666',
    disabled: '#999999',
    inverse: '#ffffff',
  },
  divider: '#e0e0e0',
  border: '#e0e0e0',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  fontFamily: {
    regular: 'System', // Will be platform-specific
    medium: 'System-Medium',
    bold: 'System-Bold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 28,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    bold: '700',
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const shadows = {
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  md: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
};

// Exercise type colors
export const exerciseColors = {
  pairs: colors.success.main,
  conversation: colors.primary.main,
  translation: colors.warning.main,
  chatbot: '#9C27B0',
  settings: '#607D8B',
};

// Theme interface for type safety
export interface Theme {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  exerciseColors: typeof exerciseColors;
}

export const theme: Theme = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  exerciseColors,
};