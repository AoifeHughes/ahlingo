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
import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';

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
        style={[styles.conversationItem, isSelected && styles.selectedItem]}
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
                style={styles.editInput}
                value={editingChatName}
                onChangeText={setEditingChatName}
                autoFocus
                onSubmitEditing={saveRename}
                onBlur={saveRename}
              />
              <TouchableOpacity onPress={cancelRename} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.conversationTitle}>
                {item.chat_name || `${item.language} - ${item.difficulty}`}
              </Text>
              <Text style={styles.conversationDate}>
                {formatDate(displayDate)}
              </Text>
            </>
          )}
        </View>
        {!isEditing && (
          <View style={styles.conversationDetails}>
            <Text style={styles.conversationLanguage}>
              {item.language} - {item.difficulty}
            </Text>
            <Text style={styles.conversationModel}>{item.model}</Text>
          </View>
        )}
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
          <>
            <Text style={styles.instructionText}>
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
  },
  instructionText: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    fontStyle: 'italic',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  newButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.base,
  },
  newButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
  closeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
  },
  closeButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.base,
  },
  selectedItem: {
    backgroundColor: colors.secondary,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  conversationTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    flex: 1,
  },
  conversationDate: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
  },
  conversationDetails: {
    marginTop: spacing.xs,
  },
  conversationLanguage: {
    fontSize: typography.fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  conversationModel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textLight,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  editInput: {
    flex: 1,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
    marginRight: spacing.base,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  cancelButtonText: {
    fontSize: typography.fontSizes.lg,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['4xl'],
  },
  emptyStateText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.base,
  },
  emptyStateSubtext: {
    fontSize: typography.fontSizes.base,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: spacing.xl,
  },
});

export default ConversationsList;