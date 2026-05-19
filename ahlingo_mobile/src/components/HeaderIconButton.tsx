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
      hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
    >
      <Text style={styles.icon}>{icon}</Text>
    </TouchableOpacity>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: currentTheme.spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
  },
  icon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    color: currentTheme.colors.background,
  },
});

export default HeaderIconButton;
