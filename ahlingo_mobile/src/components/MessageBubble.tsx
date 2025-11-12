import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface MessageBubbleProps {
  speaker: string;
  message: string;
  isLeft: boolean;
  onSpeak?: (message: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  speaker,
  message,
  isLeft,
  onSpeak,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onSpeak) {
      onSpeak(message);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isLeft ? styles.leftAlign : styles.rightAlign]}
      onPress={handlePress}
      activeOpacity={onSpeak ? 0.7 : 1}
      disabled={!onSpeak}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isLeft ? theme.colors.assistantMessage : theme.colors.userMessage,
            shadowColor: theme.colors.text,
          },
          isLeft ? styles.leftBubble : styles.rightBubble
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.speakerName, { color: theme.colors.textSecondary }]}>{speaker}</Text>
          {onSpeak && (
            <Text style={styles.speakerIcon}>🔊</Text>
          )}
        </View>
        <Text
          style={[
            styles.messageText,
            { color: isLeft ? theme.colors.text : '#fff' }
          ]}
        >
          {message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  leftAlign: {
    alignItems: 'flex-start',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftBubble: {
    borderBottomLeftRadius: 4,
  },
  rightBubble: {
    borderBottomRightRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  speakerIcon: {
    fontSize: 14,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
});

export default MessageBubble;
