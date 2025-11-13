import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WordButton from './WordButton';
import { useTheme } from '../contexts/ThemeContext';

interface AnswerBoxProps {
  selectedWords: Array<{ word: string; originalIndex: number }>;
  onWordRemove: (word: string, originalIndex: number) => void;
}

const AnswerBox: React.FC<AnswerBoxProps> = ({
  selectedWords,
  onWordRemove,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const hasWords = selectedWords.length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.answerArea}>
        {!hasWords ? (
          <Text style={styles.placeholder}>
            Tap words below to build your translation
          </Text>
        ) : (
          <ScrollView
            style={styles.wordsScroll}
            contentContainerStyle={styles.wordsInner}
            showsVerticalScrollIndicator={false}
          >
            {selectedWords.map((wordObj, index) => (
              <WordButton
                key={`${wordObj.originalIndex}-${index}`}
                word={wordObj.word}
                index={wordObj.originalIndex}
                isSelected={true}
                onPress={() =>
                  onWordRemove(wordObj.word, wordObj.originalIndex)
                }
              />
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.md,
    padding: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.lg,
    borderWidth: 2,
    borderColor: currentTheme.colors.border,
    ...currentTheme.shadows.base,
  },
  answerArea: {
    minHeight: 60,
    backgroundColor: currentTheme.colors.background,
    borderRadius: currentTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'stretch',
    padding: currentTheme.spacing.base,
    marginBottom: currentTheme.spacing.md,
  },
  placeholder: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wordsScroll: {
    width: '100%',
    maxHeight: 140,
  },
  wordsInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    paddingBottom: currentTheme.spacing.sm,
  },
});

export default AnswerBox;
