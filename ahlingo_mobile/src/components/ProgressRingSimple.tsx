import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ProgressRingSimpleProps {
  percentage: number;
  size?: number;
}

const ProgressRingSimple: React.FC<ProgressRingSimpleProps> = ({
  percentage,
  size = 60
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.primary,
          borderWidth: 3,
        }
      ]}
    >
      <Text style={[styles.percentage, { color: theme.colors.text }]}>
        {percentage}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProgressRingSimple;
