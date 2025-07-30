import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface MessageBubbleProps {
  speaker: string;
  message: string;
  isLeft: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  speaker,
  message,
  isLeft,
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.container, isLeft ? styles.leftAlign : styles.rightAlign]}
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
        <Text style={[styles.speakerName, { color: theme.colors.textSecondary }]}>{speaker}</Text>
        <Text
          style={[
            styles.messageText,
            { color: isLeft ? theme.colors.text : '#fff' }
          ]}
        >
          {message}
        </Text>
      </View>
    </View>
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
  speakerName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
});

export default MessageBubble;
