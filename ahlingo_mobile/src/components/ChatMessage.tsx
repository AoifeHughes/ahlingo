import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isStreaming?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
  isStreaming = false,
}) => {
  const { theme } = useTheme();
  const isUser = role === 'user';
  const isSystem = role === 'system';

  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={[styles.systemText, { color: theme.colors.textSecondary, backgroundColor: theme.colors.surface }]}>{content}</Text>
      </View>
    );
  }

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.container, isUser ? styles.userAlign : styles.assistantAlign]}>
      <View style={[
        styles.bubble,
        {
          backgroundColor: isUser ? theme.colors.userMessage : theme.colors.assistantMessage,
          shadowColor: theme.colors.text,
        },
        isUser ? styles.userBubble : styles.assistantBubble
      ]}>
        <Text style={[
          styles.messageText,
          { color: isUser ? '#fff' : theme.colors.text }
        ]}>
          {content}
          {isStreaming && !isUser && <Text style={[styles.streamingCursor, { color: theme.colors.primary }]}>▊</Text>}
        </Text>
        {timestamp && (
          <Text style={[
            styles.timestamp,
            { color: isUser ? '#fff' : theme.colors.textSecondary },
            isUser ? styles.userTimestamp : styles.assistantTimestamp
          ]}>
            {formatTime(timestamp)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 16,
  },
  userAlign: {
    alignItems: 'flex-end',
  },
  assistantAlign: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '85%',
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
  userBubble: {
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
  systemContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  systemText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  streamingCursor: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ChatMessage;
