import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import WordButton from './WordButton';

interface AnswerBoxProps {
  selectedWords: Array<{ word: string; originalIndex: number }>;
  onWordRemove: (word: string, originalIndex: number) => void;
}

const AnswerBox: React.FC<AnswerBoxProps> = ({
  selectedWords,
  onWordRemove,
}) => {
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  answerArea: {
    minHeight: 60,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sentence: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    fontWeight: '500',
  },
});

export default AnswerBox;
