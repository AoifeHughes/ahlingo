import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import MessageBubble from './MessageBubble';

interface ConversationMessage {
  speaker: string;
  message: string;
  conversation_order: number;
}

interface ConversationViewProps {
  messages: ConversationMessage[];
}

const ConversationView: React.FC<ConversationViewProps> = ({ messages }) => {
  // Create a mapping of speakers to determine left/right alignment
  const speakers = [...new Set(messages.map(msg => msg.speaker))];
  const speakerAlignments = new Map<string, boolean>();

  // Assign alternating alignments to speakers
  speakers.forEach((speaker, index) => {
    speakerAlignments.set(speaker, index % 2 === 0);
  });

  // Sort messages by conversation order
  const sortedMessages = [...messages].sort(
    (a, b) => a.conversation_order - b.conversation_order
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedMessages.map((message, index) => (
          <MessageBubble
            key={`${message.conversation_order}-${index}`}
            speaker={message.speaker}
            message={message.message}
            isLeft={speakerAlignments.get(message.speaker) || false}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
});

export default ConversationView;
