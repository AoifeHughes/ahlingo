import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  return (
    <View
      style={[styles.container, isLeft ? styles.leftAlign : styles.rightAlign]}
    >
      <View
        style={[styles.bubble, isLeft ? styles.leftBubble : styles.rightBubble]}
      >
        <Text style={styles.speakerName}>{speaker}</Text>
        <Text
          style={[
            styles.messageText,
            isLeft ? styles.leftText : styles.rightText,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  leftBubble: {
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  rightBubble: {
    backgroundColor: '#1976D2',
    borderBottomRightRadius: 4,
  },
  speakerName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  leftText: {
    color: '#333',
  },
  rightText: {
    color: '#fff',
  },
});

export default MessageBubble;
