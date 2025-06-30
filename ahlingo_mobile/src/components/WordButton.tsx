import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

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
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.wordButton,
        isSelected && styles.selectedWord,
        disabled && styles.disabledWord,
      ]}
      onPress={() => onPress(word, index)}
      disabled={disabled}
    >
      <Text style={[
        styles.wordText,
        isSelected && styles.selectedWordText,
        disabled && styles.disabledWordText,
      ]}>
        {word}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wordButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedWord: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2',
  },
  disabledWord: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    opacity: 0.5,
  },
  wordText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedWordText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  disabledWordText: {
    color: '#999',
  },
});

export default WordButton;