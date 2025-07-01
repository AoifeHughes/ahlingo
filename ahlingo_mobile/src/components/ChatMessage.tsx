import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  timestamp,
}) => {
  const isUser = role === 'user';
  const isSystem = role === 'system';
  
  if (isSystem) {
    return (
      <View style={styles.systemContainer}>
        <Text style={styles.systemText}>{content}</Text>
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
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
          {content}
        </Text>
        {timestamp && (
          <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#1976D2',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#fff',
    textAlign: 'right',
  },
  assistantTimestamp: {
    color: '#666',
    textAlign: 'left',
  },
  systemContainer: {
    marginVertical: 8,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  systemText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
});

export default ChatMessage;