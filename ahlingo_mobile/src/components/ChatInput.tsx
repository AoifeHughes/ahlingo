import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
  placeholder = 'Type your message...',
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('🔘 ChatInput handleSend called:', { message: message.trim(), isLoading });
    if (message.trim() && !isLoading) {
      console.log('✅ Calling onSendMessage with:', message.trim());
      onSendMessage(message.trim());
      setMessage('');
    } else {
      console.log('❌ Send blocked - empty message or loading');
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
          editable={!isLoading}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    maxHeight: 100,
    paddingVertical: 8,
    paddingRight: 12,
  },
  sendButton: {
    backgroundColor: '#1976D2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#999',
  },
});

export default ChatInput;