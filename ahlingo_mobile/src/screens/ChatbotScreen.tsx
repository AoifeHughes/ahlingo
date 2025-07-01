import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  Alert, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import ChatInput from '../components/ChatInput';
import ChatMessage from '../components/ChatMessage';
import ConversationsList from '../components/ConversationsList';
import { 
  ChatDetail, 
  ChatMessage as ChatMessageType,
  createChat,
  getUserChats,
  getChatMessages,
  addChatMessage,
  deleteChat,
  getRecentChatForUser,
  getChatById,
  updateChatModel,
  updateChatName
} from '../services/ChatService';
import { 
  OpenAIService, 
  APISettings,
  StreamingCallbacks
} from '../services/OpenAIService';
import { ModelService, ModelInfo } from '../services/ModelService';
import { getUserSettings, getUserId } from '../services/SimpleDatabaseService';
import { useTheme } from '../contexts/ThemeContext';
import LocalLlamaService from '../services/LocalLlamaService';

type ChatbotScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chatbot'
>;

interface Props {
  navigation: ChatbotScreenNavigationProp;
}

const ChatbotScreen: React.FC<Props> = ({ navigation }) => {
  const settings = useSelector((state: RootState) => state.settings.settings);
  const { theme } = useTheme();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatDetail | null>(null);
  const [conversations, setConversations] = useState<ChatDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState('qwen/qwen3-4b');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamController, setStreamController] = useState<AbortController | null>(null);

  const loadUserChats = useCallback(async () => {
    try {
      const userId = await getUserId(settings.username || 'default_user');
      if (userId) {
        const userChats = await getUserChats(userId);
        setConversations(userChats);
        return userId;
      }
      return null;
    } catch (error) {
      console.error('Failed to load user chats:', error);
      return null;
    }
  }, [settings.username]);

  const loadChatMessages = useCallback(async (chatId: number) => {
    try {
      const chatMessages = await getChatMessages(chatId);
      setMessages(chatMessages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      Alert.alert('Error', 'Failed to load chat messages');
    }
  }, []);

  const initializeChat = useCallback(async () => {
    console.log('🔄 Initializing chat...');
    setIsInitializing(true);
    try {
      const userId = await loadUserChats();
      if (userId) {
        const recentChat = await getRecentChatForUser(userId);
        if (recentChat) {
          setCurrentChat(recentChat);
          setSelectedModel(recentChat.model); // Set the model from the loaded chat
          await loadChatMessages(recentChat.id);
        }
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [loadUserChats, loadChatMessages]);

  const loadAvailableModels = useCallback(async () => {
    try {
      const userSettings = await getUserSettings(settings.username || 'default_user');
      const includeLocal = userSettings.enable_local_models === 'true' || false;
      
      console.log('🔍 Loading available models...', {
        serverUrl: userSettings.server_url,
        includeLocal,
      });

      const models = await ModelService.fetchAllModels(
        userSettings.server_url, 
        userSettings.api_key,
        includeLocal
      );
      setAvailableModels(models);
      
      // Set the first available model as default if none selected
      if (models.length > 0 && !selectedModel) {
        // Prefer local models if available and preference is set
        const preferLocal = userSettings.prefer_local_models === 'true' || false;
        const localModels = models.filter(m => m.isLocal && m.isDownloaded);
        const remoteModels = models.filter(m => !m.isLocal);
        
        let defaultModel: ModelInfo | undefined;
        if (preferLocal && localModels.length > 0) {
          defaultModel = localModels[0];
        } else if (remoteModels.length > 0) {
          defaultModel = remoteModels[0];
        } else if (localModels.length > 0) {
          defaultModel = localModels[0];
        } else {
          defaultModel = models[0];
        }
        
        if (defaultModel) {
          setSelectedModel(defaultModel.id);
        }
      }
      
      console.log('✅ Loaded models:', models);
    } catch (error) {
      console.error('Failed to load models:', error);
      // Don't show alert here, just log the error
    }
  }, [settings.username]); // Removed selectedModel dependency to prevent reloading on model change

  useEffect(() => {
    const initialize = async () => {
      await initializeChat();
      await loadAvailableModels();
    };
    initialize();
  }, [initializeChat, loadAvailableModels]);

  const createNewChat = async () => {
    console.log('🆕 Creating new chat...');
    try {
      const userId = await getUserId(settings.username || 'default_user');
      console.log('👤 Got user ID:', userId);
      if (!userId) {
        Alert.alert('Error', 'Failed to get user information');
        return;
      }

      const language = settings.language || 'Spanish';
      const difficulty = settings.difficulty || 'Beginner';
      const model = selectedModel;
      
      console.log('📝 Creating chat with:', { userId, language, difficulty, model });

      const chatId = await createChat(userId, language, difficulty, model);
      console.log('🆔 Created chat with ID:', chatId);
      
      if (chatId) {
        const newChat = await getChatById(chatId);
        console.log('💬 Retrieved new chat:', newChat);
        
        if (newChat) {
          setCurrentChat(newChat);
          setMessages([]);
          await loadUserChats();
          console.log('✅ New chat set successfully');
        }
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const sendMessage = async (content: string) => {
    console.log('📤 ChatbotScreen sendMessage called with:', content);
    console.log('📋 Current chat state:', currentChat ? `Chat ID: ${currentChat.id}` : 'No current chat');
    
    if (!currentChat) {
      console.log('🔄 No current chat, creating new chat...');
      await createNewChat();
      if (!currentChat) {
        console.log('❌ Failed to create new chat');
        return;
      }
    }

    console.log('⏳ Setting loading state...');
    setIsLoading(true);

    try {
      // Add user message to database
      await addChatMessage(currentChat.id, 'user', content);
      const updatedMessages = await getChatMessages(currentChat.id);
      setMessages(updatedMessages);

      const userSettings = await getUserSettings(settings.username || 'default_user');
      const modelId = currentChat.model;
      const isLocalModel = ModelService.isLocalModel(modelId);
      
      console.log('📋 Model routing info:', {
        modelId,
        isLocalModel,
        username: settings.username || 'default_user',
      });

      // Start streaming
      setIsLoading(false);
      setIsStreaming(true);
      setStreamingContent('');

      console.log('🌊 Starting streaming response...');

      const commonCallbacks = {
        onContent: (chunk: string) => {
          console.log('📝 Streaming chunk:', chunk);
          setStreamingContent(prev => prev + chunk);
        },
        onComplete: async (fullContent: string) => {
          console.log('✅ Streaming completed. Full content length:', fullContent.length);
          try {
            // Save the complete assistant message to database
            await addChatMessage(currentChat.id, 'assistant', fullContent);
            
            // Reload messages from database
            const finalMessages = await getChatMessages(currentChat.id);
            setMessages(finalMessages);
            
            // Clear streaming state
            setIsStreaming(false);
            setStreamingContent('');
            setStreamController(null);
          } catch (error) {
            console.error('Failed to save streaming message:', error);
            Alert.alert('Error', 'Failed to save message');
            setIsStreaming(false);
            setStreamingContent('');
          }
        },
        onError: (error: Error) => {
          console.error('Streaming error:', error);
          Alert.alert('Error', error.message);
          setIsStreaming(false);
          setStreamingContent('');
          setStreamController(null);
        }
      };

      if (isLocalModel) {
        // Route to local model
        console.log('🏠 Using local model:', modelId);
        
        try {
          const localModelId = ModelService.extractLocalModelId(modelId);
          
          // Initialize the model if needed
          if (!LocalLlamaService.isReady() || LocalLlamaService.getCurrentModel() !== localModelId) {
            console.log('🔧 Initializing local model...');
            setIsLoading(true);
            setIsStreaming(false);
            await LocalLlamaService.initializeModel(localModelId);
            setIsLoading(false);
            setIsStreaming(true);
          }

          // Prepare messages for local model
          const systemPrompt = OpenAIService.generateSystemPrompt(
            currentChat.language,
            currentChat.difficulty
          );

          const localMessages = [
            { role: 'system' as const, content: systemPrompt },
            ...updatedMessages.slice(-10).map(msg => ({ // Limit context for performance
              role: msg.role as 'user' | 'assistant',
              content: msg.content
            }))
          ];

          await LocalLlamaService.completion(localMessages, commonCallbacks);

        } catch (error) {
          console.error('Local model error:', error);
          commonCallbacks.onError(error instanceof Error ? error : new Error('Local model failed'));
        }

      } else {
        // Route to remote model
        console.log('🌐 Using remote model:', modelId);
        
        const apiSettings: APISettings = {
          apiKey: userSettings.api_key || '',
          apiUrl: userSettings.server_url,
        };

        const validation = OpenAIService.validateAPISettings(apiSettings);
        if (!validation.isValid) {
          Alert.alert('API Configuration Error', validation.error);
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        const systemPrompt = OpenAIService.generateSystemPrompt(
          currentChat.language,
          currentChat.difficulty
        );

        const openAIMessages = OpenAIService.convertChatMessagesToOpenAI(
          updatedMessages,
          systemPrompt
        );

        const streamingCallbacks: StreamingCallbacks = commonCallbacks;

        const controller = await OpenAIService.sendMessageStream(
          openAIMessages,
          apiSettings,
          streamingCallbacks,
          modelId
        );

        setStreamController(controller);
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      Alert.alert('Error', errorMessage);
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const stopGeneration = () => {
    console.log('🛑 Stopping generation...');
    
    // Stop remote model generation
    if (streamController) {
      streamController.abort();
      setStreamController(null);
    }
    
    // For local models, we don't have direct cancellation support in this implementation
    // But we can stop the streaming state
    setIsStreaming(false);
    setStreamingContent('');
  };


  const handleModelChange = async (newModel: string) => {
    try {
      console.log('🔄 Changing model to:', newModel);
      
      // Check if it's a local model and if it's downloaded
      if (ModelService.isLocalModel(newModel)) {
        const localModelId = ModelService.extractLocalModelId(newModel);
        const isDownloaded = await LocalLlamaService.isModelDownloaded(localModelId);
        
        if (!isDownloaded) {
          Alert.alert(
            'Model Not Downloaded',
            'This local model is not downloaded yet. Please download it from Settings first.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Go to Settings', 
                onPress: () => navigation.navigate('Settings' as any)
              }
            ]
          );
          return;
        }
      }
      
      setSelectedModel(newModel);
      
      if (currentChat) {
        await updateChatModel(currentChat.id, newModel);
        console.log('✅ Updated chat model to:', newModel);
        
        // Update the current chat object
        setCurrentChat(prev => prev ? { ...prev, model: newModel } : null);
      }
    } catch (error) {
      console.error('Failed to update chat model:', error);
      Alert.alert('Error', 'Failed to update model');
    }
  };

  const selectConversation = async (conversation: ChatDetail) => {
    setCurrentChat(conversation);
    setSelectedModel(conversation.model);
    await loadChatMessages(conversation.id);
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      const userId = await getUserId(settings.username || 'default_user');
      if (userId) {
        await deleteChat(conversationId, userId);
        await loadUserChats();
        
        if (currentChat?.id === conversationId) {
          setCurrentChat(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  const styles = createStyles(theme);

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.conversationsButton}
          onPress={() => setShowConversations(true)}
        >
          <Text style={styles.conversationsButtonText}>Conversations</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {currentChat ? (currentChat.chat_name || `${currentChat.language} - ${currentChat.difficulty}`) : 'New Chat'}
          </Text>
          {availableModels.length > 0 && (
            <TouchableOpacity
              style={styles.modelSelector}
              onPress={() => setShowModelDropdown(!showModelDropdown)}
            >
              <Text style={styles.modelSelectorText}>
                {selectedModel}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={createNewChat}
        >
          <Text style={styles.newChatButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {showModelDropdown && availableModels.length > 0 && (
        <View style={styles.modelDropdownContainer}>
          <ScrollView style={styles.modelDropdown} showsVerticalScrollIndicator={false}>
            {availableModels.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[
                  styles.modelOption,
                  selectedModel === model.id && styles.selectedModelOption,
                ]}
                onPress={() => {
                  handleModelChange(model.id);
                  setShowModelDropdown(false);
                }}
              >
                <View style={styles.modelOptionContent}>
                  <Text style={[
                    styles.modelOptionText,
                    selectedModel === model.id && styles.selectedModelOptionText,
                  ]}>
                    {model.name}
                  </Text>
                  <View style={styles.modelMetadata}>
                    {model.isLocal && (
                      <Text style={[
                        styles.modelBadge,
                        styles.localBadge,
                        !model.isDownloaded && styles.notDownloadedBadge
                      ]}>
                        {model.isDownloaded ? '📱 Local' : '📱 Not Downloaded'}
                      </Text>
                    )}
                    {!model.isLocal && (
                      <Text style={[styles.modelBadge, styles.remoteBadge]}>
                        🌐 Remote
                      </Text>
                    )}
                    {model.fileSize && (
                      <Text style={styles.modelSizeText}>
                        {ModelService.getModelSize(model)}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && !isStreaming ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Start a conversation!</Text>
            <Text style={styles.emptyStateSubtext}>
              Type a message below to begin chatting in {currentChat?.language || settings.language || 'your target language'}.
            </Text>
          </View>
        ) : (
          <>
            {messages.map((message, index) => (
              <ChatMessage
                key={`${message.id}-${index}`}
                role={message.role}
                content={message.content}
                timestamp={message.timestamp}
              />
            ))}
            {isStreaming && (
              <ChatMessage
                key="streaming-message"
                role="assistant"
                content={streamingContent}
                isStreaming={true}
              />
            )}
          </>
        )}
        {isLoading && (
          <View style={styles.loadingMessage}>
            <ActivityIndicator size="small" color="#1976D2" />
            <Text style={styles.loadingMessageText}>Assistant is typing...</Text>
          </View>
        )}
      </ScrollView>

      <ChatInput
        onSendMessage={sendMessage}
        onStopGeneration={stopGeneration}
        isLoading={isLoading}
        isStreaming={isStreaming}
        placeholder="Type your message..."
      />

      <ConversationsList
        visible={showConversations}
        onClose={() => setShowConversations(false)}
        conversations={conversations}
        onSelectConversation={selectConversation}
        onDeleteConversation={deleteConversation}
        onNewConversation={createNewChat}
        onRefreshConversations={loadUserChats}
        currentConversationId={currentChat?.id}
      />
    </SafeAreaView>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    backgroundColor: currentTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.border,
  },
  conversationsButton: {
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.base,
    backgroundColor: currentTheme.colors.surfaceDark,
    ...currentTheme.shadows.sm,
  },
  conversationsButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    textAlign: 'center',
  },
  modelSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.surfaceDark,
    paddingHorizontal: currentTheme.spacing.base,
    paddingVertical: currentTheme.spacing.xs,
    borderRadius: currentTheme.borderRadius.base,
    marginTop: currentTheme.spacing.xs,
  },
  modelSelectorText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginRight: currentTheme.spacing.xs,
  },
  dropdownArrow: {
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.textSecondary,
  },
  modelDropdownContainer: {
    backgroundColor: currentTheme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.border,
    maxHeight: 200,
  },
  modelDropdown: {
    maxHeight: 200,
  },
  modelOption: {
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.borderLight,
  },
  selectedModelOption: {
    backgroundColor: currentTheme.colors.secondary,
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  selectedModelOptionText: {
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  modelMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: currentTheme.spacing.xs,
  },
  modelBadge: {
    fontSize: currentTheme.typography.fontSizes.xs,
    paddingHorizontal: currentTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: currentTheme.borderRadius.sm,
    overflow: 'hidden',
  },
  localBadge: {
    backgroundColor: currentTheme.colors.success,
    color: currentTheme.colors.background,
  },
  remoteBadge: {
    backgroundColor: currentTheme.colors.primary,
    color: currentTheme.colors.background,
  },
  notDownloadedBadge: {
    backgroundColor: currentTheme.colors.warning,
    color: currentTheme.colors.text,
  },
  modelSizeText: {
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.textSecondary,
  },
  newChatButton: {
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.base,
    backgroundColor: currentTheme.colors.primary,
    ...currentTheme.shadows.sm,
  },
  newChatButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.background,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  messagesContent: {
    paddingVertical: currentTheme.spacing.lg,
    flexGrow: 1,
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
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textLight,
    textAlign: 'center',
    lineHeight: currentTheme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: currentTheme.spacing.lg,
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
  },
  loadingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: currentTheme.spacing.lg,
  },
  loadingMessageText: {
    marginLeft: currentTheme.spacing.base,
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default ChatbotScreen;
