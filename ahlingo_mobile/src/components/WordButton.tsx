import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface WordButtonProps {
  word: string;
  index: number;
  isSelected: boolean;
  onPress: (word: string, index: number) => void;
  disabled?: boolean;
}

const WordButton: React.FC<WordButtonProps> = ({
  word,
  index,
  isSelected,
  onPress,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  return (
    <TouchableOpacity
      style={[
        styles.wordButton,
        isSelected && styles.selectedWord,
        disabled && styles.disabledWord,
      ]}
      onPress={() => onPress(word, index)}
      disabled={disabled}
      testID="word-button"
    >
      <Text
        style={[
          styles.wordText,
          isSelected && styles.selectedWordText,
          disabled && styles.disabledWordText,
        ]}
      >
        {word}
      </Text>
    </TouchableOpacity>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  wordButton: {
    backgroundColor: currentTheme.colors.surface,
    borderWidth: 2,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.borderRadius.base,
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.base,
    margin: currentTheme.spacing.xs,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...currentTheme.shadows.sm,
  },
  selectedWord: {
    backgroundColor: currentTheme.colors.primaryLight + '30',
    borderColor: currentTheme.colors.primary,
  },
  disabledWord: {
    backgroundColor: currentTheme.colors.buttonDisabled,
    borderColor: currentTheme.colors.border,
    opacity: 0.5,
  },
  wordText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
    fontWeight: currentTheme.typography.fontWeights.medium,
  },
  selectedWordText: {
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  disabledWordText: {
    color: currentTheme.colors.textLight,
  },
});

export default WordButton;
