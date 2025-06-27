import React, {createContext, useContext} from 'react';
import {ThemeProvider as ElementsThemeProvider} from 'react-native-elements';

interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  light: string;
  dark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
}

interface AppTheme {
  colors: ThemeColors;
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  fontSize: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

const lightTheme: AppTheme = {
  colors: {
    primary: '#2196F3',
    secondary: '#1976D2',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#00BCD4',
    light: '#F5F5F5',
    dark: '#212121',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
  fontSize: {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
};

// React Native Elements theme
const elementsTheme = {
  colors: {
    primary: lightTheme.colors.primary,
    secondary: lightTheme.colors.secondary,
    success: lightTheme.colors.success,
    warning: lightTheme.colors.warning,
    error: lightTheme.colors.error,
  },
  Button: {
    raised: true,
    buttonStyle: {
      borderRadius: lightTheme.borderRadius.md,
      paddingVertical: lightTheme.spacing.md,
    },
    titleStyle: {
      fontSize: lightTheme.fontSize.md,
      fontWeight: '600',
    },
  },
  Header: {
    backgroundColor: lightTheme.colors.secondary,
    centerComponent: {
      style: {
        color: '#FFFFFF',
        fontSize: lightTheme.fontSize.lg,
        fontWeight: 'bold',
      },
    },
  },
  Card: {
    containerStyle: {
      borderRadius: lightTheme.borderRadius.md,
      marginVertical: lightTheme.spacing.sm,
      marginHorizontal: lightTheme.spacing.md,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  },
};

const ThemeContext = createContext<AppTheme>(lightTheme);

export function useTheme(): AppTheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({children}: ThemeProviderProps): JSX.Element {
  return (
    <ThemeContext.Provider value={lightTheme}>
      <ElementsThemeProvider theme={elementsTheme}>
        {children}
      </ElementsThemeProvider>
    </ThemeContext.Provider>
  );
}