import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../utils/theme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStopGeneration?: () => void;
  isLoading?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopGeneration,
  isLoading = false,
  isStreaming = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('🔘 ChatInput handleSend called:', { message: message.trim(), isLoading, isStreaming });
    if (message.trim() && !isLoading && !isStreaming) {
      console.log('✅ Calling onSendMessage with:', message.trim());
      onSendMessage(message.trim());
      setMessage('');
    } else {
      console.log('❌ Send blocked - empty message, loading, or streaming');
    }
  };

  const handleStop = () => {
    if (onStopGeneration) {
      console.log('🛑 Stop generation requested');
      onStopGeneration();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!isLoading && !isStreaming}
          onSubmitEditing={isStreaming ? undefined : handleSend}
          blurOnSubmit={false}
        />
        {isStreaming ? (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={handleStop}
          >
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isLoading}
          >
            <Text
              style={[
                styles.sendButtonText,
                (!message.trim() || isLoading) && styles.sendButtonTextDisabled,
              ]}
            >
              {isLoading ? '...' : 'Send'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    minHeight: spacing['5xl'],
  },
  textInput: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: spacing.base,
    paddingRight: spacing.md,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  sendButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
  sendButtonTextDisabled: {
    color: colors.textLight,
  },
  stopButton: {
    backgroundColor: colors.error,
    borderRadius: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
});

export default ChatInput;