import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export interface PairButtonProps {
  text: string;
  pairId: number;
  column: number; // 0 for left, 1 for right
  selected: boolean;
  matched: boolean;
  onPress: (pairId: number, column: number) => void;
  onSpeak?: (text: string, column: number) => void;
}

const PairButton: React.FC<PairButtonProps> = ({
  text,
  pairId,
  column,
  selected,
  matched,
  onPress,
  onSpeak,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const getButtonStyle = () => {
    if (matched) {
      return [styles.button, styles.matched];
    } else if (selected) {
      return [styles.button, styles.selected];
    } else {
      return [styles.button, styles.normal];
    }
  };

  const getTextStyle = () => {
    if (matched) {
      return [styles.text, styles.matchedText];
    } else if (selected) {
      return [styles.text, styles.selectedText];
    } else {
      return [styles.text, styles.normalText];
    }
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={() => onPress(pairId, column)}
        disabled={matched}
        activeOpacity={0.8}
        testID="pair-button"
        accessibilityRole="button"
        accessibilityLabel={`Pair button: ${text}`}
        accessibilityState={{
          selected: selected,
          disabled: matched,
        }}
      >
        <Text style={getTextStyle()}>{text}</Text>
      </TouchableOpacity>
      {onSpeak && (
        <TouchableOpacity
          style={styles.speakButton}
          onPress={() => onSpeak(text, column)}
          disabled={matched}
          activeOpacity={0.8}
          testID="speak-button"
          accessibilityRole="button"
          accessibilityLabel={`Speak text: ${text}`}
        >
          <Text style={styles.speakButtonText}>🔊</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: currentTheme.spacing.xs,
  },
  button: {
    flex: 1,
    minHeight: 60,
    borderRadius: currentTheme.borderRadius.base,
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  speakButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: currentTheme.spacing.sm,
    backgroundColor: currentTheme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  speakButtonText: {
    fontSize: 16,
  },
  normal: {
    backgroundColor: currentTheme.colors.primary,
  },
  selected: {
    backgroundColor: currentTheme.colors.secondary,
  },
  matched: {
    backgroundColor: currentTheme.colors.success,
  },
  text: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.medium,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  normalText: {
    color: currentTheme.colors.background,
  },
  selectedText: {
    color: currentTheme.colors.text,
  },
  matchedText: {
    color: currentTheme.colors.background,
  },
});

export default PairButton;
