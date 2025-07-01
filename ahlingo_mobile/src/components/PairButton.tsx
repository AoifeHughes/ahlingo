import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

export interface PairButtonProps {
  text: string;
  pairId: number;
  column: number; // 0 for left, 1 for right
  selected: boolean;
  matched: boolean;
  onPress: (pairId: number, column: number) => void;
}

const PairButton: React.FC<PairButtonProps> = ({
  text,
  pairId,
  column,
  selected,
  matched,
  onPress,
}) => {
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
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={() => onPress(pairId, column)}
      disabled={matched}
      activeOpacity={0.8}
    >
      <Text style={getTextStyle()}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 60,
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  normal: {
    backgroundColor: '#2196F3', // Blue - normal state
  },
  selected: {
    backgroundColor: '#E0E0E0', // Gray - selected state
  },
  matched: {
    backgroundColor: '#81C784', // Green - matched state
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  normalText: {
    color: '#FFFFFF',
  },
  selectedText: {
    color: '#333333',
  },
  matchedText: {
    color: '#FFFFFF',
  },
});

export default PairButton;
