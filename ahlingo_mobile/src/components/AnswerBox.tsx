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
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Translation:</Text>
      <View style={styles.answerArea}>
        {selectedWords.length === 0 ? (
          <Text style={styles.placeholder}>
            Tap words below to build your translation
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wordsContainer}
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
      {selectedWords.length > 0 && (
        <Text style={styles.sentence}>
          {selectedWords.map(wordObj => wordObj.word).join(' ')}
        </Text>
      )}
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
  title: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.md,
    textAlign: 'center',
  },
  answerArea: {
    minHeight: 60,
    backgroundColor: currentTheme.colors.background,
    borderRadius: currentTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: currentTheme.spacing.base,
    marginBottom: currentTheme.spacing.md,
  },
  placeholder: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sentence: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
    textAlign: 'center',
    backgroundColor: currentTheme.colors.primaryLight + '20',
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.base,
    fontWeight: currentTheme.typography.fontWeights.medium,
    borderWidth: 1,
    borderColor: currentTheme.colors.primaryLight,
  },
});

export default AnswerBox;
