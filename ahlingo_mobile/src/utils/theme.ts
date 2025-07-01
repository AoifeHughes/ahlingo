// Nord Color Palettes
const NORD_PALETTES = {
  // Frost Theme (Default)
  frost: {
    lightest: '#8fbcbb', // Nord 7 - Frost lightest
    light: '#88c0d0',    // Nord 8 - Frost light  
    medium: '#81a1c1',   // Nord 9 - Frost medium
    dark: '#5e81ac',     // Nord 10 - Frost dark
  },
  
  // Aurora Theme
  aurora: {
    lightest: '#bf616a', // Nord 11 - Aurora red
    light: '#d08770',    // Nord 12 - Aurora orange
    medium: '#ebcb8b',   // Nord 13 - Aurora yellow
    dark: '#a3be8c',     // Nord 14 - Aurora green
  },
  
  // Polar Night Theme
  polar: {
    lightest: '#2e3440', // Nord 0 - Polar Night darkest
    light: '#3b4252',    // Nord 1 - Polar Night dark
    medium: '#434c5e',   // Nord 2 - Polar Night medium
    dark: '#4c566a',     // Nord 3 - Polar Night light
  },
};

// Theme type definition
export type ThemeVariant = 'frost' | 'aurora' | 'polar';

// Current theme (can be changed dynamically)
let currentTheme: ThemeVariant = 'frost';

// Theme creation function
const createTheme = (variant: ThemeVariant) => {
  const palette = NORD_PALETTES[variant];
  
  return {
    // Selected palette colors
    primary: palette,
  
    // Polar Night (for backgrounds and text)
    polar: {
      darkest: '#2e3440',  // Nord 0 - Polar Night darkest
      dark: '#3b4252',     // Nord 1 - Polar Night dark
      medium: '#434c5e',   // Nord 2 - Polar Night medium
      light: '#4c566a',    // Nord 3 - Polar Night light
    },
    
    // Snow Storm (for light backgrounds and text)
    snow: {
      dark: '#d8dee9',     // Nord 4 - Snow Storm dark
      medium: '#e5e9f0',   // Nord 5 - Snow Storm medium
      light: '#eceff4',    // Nord 6 - Snow Storm light
    },
    
    // Aurora (for accents and highlights)
    aurora: {
      red: '#bf616a',      // Nord 11 - Aurora red
      orange: '#d08770',   // Nord 12 - Aurora orange
      yellow: '#ebcb8b',   // Nord 13 - Aurora yellow
      green: '#a3be8c',    // Nord 14 - Aurora green
      purple: '#b48ead',   // Nord 15 - Aurora purple
    },
    
    // Semantic colors using selected palette as primary
    colors: {
      primary: palette.medium,        // Primary color from selected palette
      primaryLight: palette.light,    // Light variant
      primaryDark: palette.dark,      // Dark variant
      secondary: palette.lightest,    // Secondary color
      
      background: '#eceff4',        // Snow Storm light
      surface: '#e5e9f0',          // Snow Storm medium
      surfaceDark: '#d8dee9',      // Snow Storm dark
      
      text: '#2e3440',             // Polar Night darkest
      textSecondary: '#4c566a',    // Polar Night light
      textLight: '#434c5e',        // Polar Night medium
      
      border: '#d8dee9',           // Snow Storm dark
      borderLight: '#e5e9f0',      // Snow Storm medium
      
      success: '#a3be8c',          // Aurora green
      warning: '#ebcb8b',          // Aurora yellow
      error: '#bf616a',            // Aurora red
      info: palette.light,         // Use palette light for info
      
      // Interactive states
      buttonPrimary: palette.medium,     // Use palette medium for primary button
      buttonSecondary: palette.lightest, // Use palette lightest for secondary
      buttonDisabled: '#d8dee9',    // Snow Storm dark
      
      // Chat specific
      userMessage: palette.medium,       // Use palette medium for user messages
      assistantMessage: '#e5e9f0',  // Snow Storm medium
      systemMessage: palette.lightest,  // Use palette lightest for system
    },
  
    // Typography
    typography: {
      fontSizes: {
        xs: 10,
        sm: 12,
        base: 14,
        lg: 16,
        xl: 18,
        '2xl': 20,
        '3xl': 24,
        '4xl': 32,
      },
      fontWeights: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
      },
      lineHeights: {
        tight: 1.2,
        normal: 1.4,
        relaxed: 1.6,
      },
    },
    
    // Spacing
    spacing: {
      xs: 2,
      sm: 4,
      base: 8,
      md: 12,
      lg: 16,
      xl: 20,
      '2xl': 24,
      '3xl': 32,
      '4xl': 40,
      '5xl': 48,
    },
    
    // Border radius
    borderRadius: {
      none: 0,
      sm: 4,
      base: 6,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    
    // Shadows
    shadows: {
      sm: {
        shadowColor: '#2e3440',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      base: {
        shadowColor: '#2e3440',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      },
      lg: {
        shadowColor: '#2e3440',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
    },
  };
};

// Create initial theme
let NORD_THEME = createTheme(currentTheme);

// Theme management functions
export const setTheme = (variant: ThemeVariant) => {
  currentTheme = variant;
  NORD_THEME = createTheme(variant);
};

export const getCurrentTheme = (): ThemeVariant => currentTheme;

export const getAvailableThemes = () => [
  { key: 'frost', name: 'Frost', description: 'Cool blue tones' },
  { key: 'aurora', name: 'Aurora', description: 'Warm vibrant colors' },
  { key: 'polar', name: 'Polar Night', description: 'Dark elegant shades' },
];

// Convenience exports that always return current theme properties
export const getTheme = () => NORD_THEME;

// Simple getter functions - most reliable approach for React Native
export const getColors = () => NORD_THEME.colors;
export const getTypography = () => NORD_THEME.typography;
export const getSpacingValues = () => NORD_THEME.spacing;
export const getBorderRadius = () => NORD_THEME.borderRadius;
export const getShadows = () => NORD_THEME.shadows;

// Direct exports for backwards compatibility (these will be static references)
export const colors = NORD_THEME.colors;
export const typography = NORD_THEME.typography;
export const spacing = NORD_THEME.spacing;
export const borderRadius = NORD_THEME.borderRadius;
export const shadows = NORD_THEME.shadows;

// Helper functions
export const getPrimaryColor = (variant: 'lightest' | 'light' | 'medium' | 'dark') => {
  return NORD_THEME.primary[variant];
};

export const getSpacing = (size: keyof typeof NORD_THEME.spacing) => {
  return NORD_THEME.spacing[size];
};

export const getFontSize = (size: keyof typeof NORD_THEME.typography.fontSizes) => {
  return NORD_THEME.typography.fontSizes[size];
};