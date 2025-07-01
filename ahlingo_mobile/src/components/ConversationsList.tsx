import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Modal,
  Alert,
  TextInput
} from 'react-native';
import { ChatDetail, updateChatName } from '../services/ChatService';
import { useTheme } from '../contexts/ThemeContext';

interface ConversationsListProps {
  visible: boolean;
  onClose: () => void;
  conversations: ChatDetail[];
  onSelectConversation: (conversation: ChatDetail) => void;
  onDeleteConversation: (conversationId: number) => void;
  onNewConversation: () => void;
  onRefreshConversations: () => void;
  currentConversationId?: number;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  visible,
  onClose,
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onNewConversation,
  onRefreshConversations,
  currentConversationId,
}) => {
  const { theme } = useTheme();
  const [editingChatId, setEditingChatId] = useState<number | null>(null);
  const [editingChatName, setEditingChatName] = useState('');
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

  const handleLongPress = (conversation: ChatDetail) => {
    Alert.alert(
      'Conversation Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: () => startRenaming(conversation),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteConversation(conversation),
        },
      ]
    );
  };

  const startRenaming = (conversation: ChatDetail) => {
    setEditingChatId(conversation.id);
    setEditingChatName(conversation.chat_name || `${conversation.language} - ${conversation.difficulty}`);
  };

  const saveRename = async () => {
    if (!editingChatId || !editingChatName.trim()) return;

    try {
      await updateChatName(editingChatId, editingChatName.trim());
      setEditingChatId(null);
      setEditingChatName('');
      onRefreshConversations();
    } catch (error) {
      console.error('Failed to rename chat:', error);
      Alert.alert('Error', 'Failed to rename conversation');
    }
  };

  const cancelRename = () => {
    setEditingChatId(null);
    setEditingChatName('');
  };

  const renderConversationItem = ({ item }: { item: ChatDetail }) => {
    const isSelected = currentConversationId === item.id;
    const displayDate = item.last_updated || item.created_at;
    const isEditing = editingChatId === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem, 
          { backgroundColor: theme.colors.surface },
          isSelected && [styles.selectedItem, { 
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.primary 
          }]
        ]}
        onPress={() => {
          if (!isEditing) {
            onSelectConversation(item);
            onClose();
          }
        }}
        onLongPress={() => !isEditing && handleLongPress(item)}
      >
        <View style={styles.conversationHeader}>
          {isEditing ? (
            <View style={styles.editingContainer}>
              <TextInput
                style={[styles.editInput, { 
                  color: theme.colors.text,
                  borderBottomColor: theme.colors.primary 
                }]}
                value={editingChatName}
                onChangeText={setEditingChatName}
                autoFocus
                onSubmitEditing={saveRename}
                onBlur={saveRename}
              />
              <TouchableOpacity onPress={cancelRename} style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.conversationTitle, { color: theme.colors.text }]}>
                {item.chat_name || `${item.language} - ${item.difficulty}`}
              </Text>
              <Text style={[styles.conversationDate, { color: theme.colors.textSecondary }]}>
                {formatDate(displayDate)}
              </Text>
            </>
          )}
        </View>
        {!isEditing && (
          <View style={styles.conversationDetails}>
            <Text style={[styles.conversationLanguage, { color: theme.colors.textSecondary }]}>
              {item.language} - {item.difficulty}
            </Text>
            <Text style={[styles.conversationModel, { color: theme.colors.textLight }]}>{item.model}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { 
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border 
        }]}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Conversations</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.newButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                onNewConversation();
                onClose();
              }}
            >
              <Text style={[styles.newButtonText, { color: theme.colors.background }]}>New</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        {conversations.length > 0 ? (
          <>
            <Text style={[styles.instructionText, { color: theme.colors.textSecondary }]}>
              Press and hold to edit or delete chats
            </Text>
            <FlatList
              data={conversations}
              renderItem={renderConversationItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>No conversations yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.textLight }]}>
              Start a new conversation to begin chatting
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: currentTheme.spacing.xl,
    paddingVertical: currentTheme.spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  instructionText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.base,
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: currentTheme.spacing.md,
  },
  newButton: {
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.base,
    borderRadius: currentTheme.borderRadius.base,
  },
  newButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  closeButton: {
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.base,
  },
  closeButtonText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    marginHorizontal: currentTheme.spacing.lg,
    marginVertical: currentTheme.spacing.xs,
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.lg,
    ...currentTheme.shadows.base,
  },
  selectedItem: {
    borderWidth: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.xs,
  },
  conversationTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    flex: 1,
  },
  conversationDate: {
    fontSize: currentTheme.typography.fontSizes.sm,
  },
  conversationDetails: {
    marginTop: currentTheme.spacing.xs,
  },
  conversationLanguage: {
    fontSize: currentTheme.typography.fontSizes.sm,
    marginBottom: currentTheme.spacing.xs,
  },
  conversationModel: {
    fontSize: currentTheme.typography.fontSizes.sm,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    borderBottomWidth: 1,
    paddingVertical: currentTheme.spacing.xs,
    marginRight: currentTheme.spacing.base,
  },
  cancelButton: {
    padding: currentTheme.spacing.xs,
  },
  cancelButtonText: {
    fontSize: currentTheme.typography.fontSizes.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: currentTheme.spacing['4xl'],
  },
  emptyStateText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    marginBottom: currentTheme.spacing.base,
  },
  emptyStateSubtext: {
    fontSize: currentTheme.typography.fontSizes.base,
    textAlign: 'center',
    lineHeight: currentTheme.spacing.xl,
  },
});

export default ConversationsList;