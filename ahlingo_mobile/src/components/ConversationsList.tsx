import React from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Modal,
  Alert
} from 'react-native';
import { ChatDetail } from '../services/ChatService';

interface ConversationsListProps {
  visible: boolean;
  onClose: () => void;
  conversations: ChatDetail[];
  onSelectConversation: (conversation: ChatDetail) => void;
  onDeleteConversation: (conversationId: number) => void;
  onNewConversation: () => void;
  currentConversationId?: number;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  visible,
  onClose,
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  currentConversationId,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleDeleteConversation = (conversation: ChatDetail) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteConversation(conversation.id),
        },
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: ChatDetail }) => {
    const isSelected = currentConversationId === item.id;
    const displayDate = item.last_updated || item.created_at;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, isSelected && styles.selectedItem]}
        onPress={() => {
          onSelectConversation(item);
          onClose();
        }}
        onLongPress={() => handleDeleteConversation(item)}
      >
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationTitle}>
            {item.language} - {item.difficulty}
          </Text>
          <Text style={styles.conversationDate}>
            {formatDate(displayDate)}
          </Text>
        </View>
        <Text style={styles.conversationModel}>{item.model}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Conversations</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.newButton}
              onPress={() => {
                onNewConversation();
                onClose();
              }}
            >
              <Text style={styles.newButtonText}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {conversations.length > 0 ? (
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No conversations yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Start a new conversation to begin chatting
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  newButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  closeButtonText: {
    color: '#1976D2',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
    borderColor: '#1976D2',
    borderWidth: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  conversationDate: {
    fontSize: 12,
    color: '#666',
  },
  conversationModel: {
    fontSize: 14,
    color: '#888',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default ConversationsList;