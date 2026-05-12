import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderIconButtonProps {
  onPress: () => void;
  icon: string;
  testID?: string;
}

const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({ onPress, icon, testID }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      testID={testID}
    >
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  button: {
    width: currentTheme.spacing['5xl'],
    height: currentTheme.spacing['5xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: currentTheme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  icon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    color: currentTheme.colors.background,
  },
});

export default HeaderIconButton;
