import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo, ConversationExercise } from '../types';
import { RootState } from '../store';
import { 
  getRandomConversationExerciseForTopic, 
  getGroupedConversationExercises,
  ConversationGroup,
  debugConversationTables,
  getUserSettings,
  getMostRecentUser
} from '../services/SimpleDatabaseService';

type ConversationExercisesScreenRouteProp = RouteProp<RootStackParamList, 'ConversationExercises'>;
type ConversationExercisesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConversationExercises'
>;

interface Props {
  route: ConversationExercisesScreenRouteProp;
  navigation: ConversationExercisesScreenNavigationProp;
}

interface MessageBubbleProps {
  message: ConversationExercise;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isFirstInGroup, isLastInGroup }) => {
  const isPerson1 = message.speaker === 'person1';
  
  return (
    <View style={[
      styles.messageContainer,
      isPerson1 ? styles.person1Container : styles.person2Container
    ]}>
      <View style={[
        styles.messageBubble,
        isPerson1 ? styles.person1Bubble : styles.person2Bubble,
        isFirstInGroup && styles.firstMessage,
        isLastInGroup && styles.lastMessage
      ]}>
        <Text style={[
          styles.messageText,
          isPerson1 ? styles.person1Text : styles.person2Text
        ]}>
          {message.message}
        </Text>
      </View>
    </View>
  );
};

interface ConversationProps {
  conversation: ConversationGroup;
  onPress: () => void;
}

const ConversationCard: React.FC<ConversationProps> = ({ conversation, onPress }) => {
  const firstMessage = conversation.messages[0]?.message || '';
  const messageCount = conversation.messages.length;
  
  return (
    <TouchableOpacity style={styles.conversationCard} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Conversation {conversation.conversationOrder + 1}</Text>
        <Text style={styles.messageCount}>{messageCount} messages</Text>
      </View>
      <Text style={styles.preview} numberOfLines={2}>
        {firstMessage}
      </Text>
    </TouchableOpacity>
  );
};

const ConversationExercisesScreen: React.FC<Props> = ({ route, navigation }) => {
  const { topicId } = route.params;
  const { settings } = useSelector((state: RootState) => state.settings);
  
  const [loading, setLoading] = useState(true);
  const [exerciseInfo, setExerciseInfo] = useState<ExerciseInfo | null>(null);
  const [conversations, setConversations] = useState<ConversationGroup[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationGroup | null>(null);
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');
  
  useEffect(() => {
    // Run debug function first
    debugConversationTables();
    loadUserSettingsAndConversations();
  }, []);
  
  const loadUserSettingsAndConversations = async () => {
    try {
      setLoading(true);
      
      // Get current user settings from database
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      
      const language = userSettings.language || settings.language || 'French';
      const difficulty = userSettings.difficulty || settings.difficulty || 'Beginner';
      
      setUserLanguage(language);
      setUserDifficulty(difficulty);
      
      console.log(`🔍 [DEBUG] Loading conversations for topic ${topicId}, language: ${language}, difficulty: ${difficulty}`);
      
      // Get a random conversation exercise for this topic
      const exercise = await getRandomConversationExerciseForTopic(topicId, language, difficulty);
      
      if (!exercise) {
        console.log('❌ [DEBUG] No exercise found for topic');
        Alert.alert('No Conversations Found', 'No conversation exercises found for this topic and difficulty level.');
        return;
      }
      
      console.log('✅ [DEBUG] Found exercise:', exercise);
      setExerciseInfo(exercise);
      
      // Get all conversations grouped by conversation_order
      const groupedConversations = await getGroupedConversationExercises(exercise.id);
      console.log('✅ [DEBUG] Found grouped conversations:', groupedConversations);
      console.log('✅ [DEBUG] Number of conversation groups:', groupedConversations.length);
      setConversations(groupedConversations);
      
      if (groupedConversations.length === 0) {
        console.log('⚠️ [WARNING] No conversations found for exercise, but exercise exists');
      }
      
    } catch (error) {
      console.error('❌ [ERROR] Failed to load conversation exercise:', error);
      Alert.alert('Error', 'Failed to load conversation exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleConversationSelect = (conversation: ConversationGroup) => {
    setSelectedConversation(conversation);
  };
  
  const handleBackToList = () => {
    setSelectedConversation(null);
  };
  
  const handleRefresh = () => {
    setSelectedConversation(null);
    loadUserSettingsAndConversations();
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }
  
  if (!exerciseInfo) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No conversation exercises found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadUserSettingsAndConversations}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  // Show individual conversation
  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToList}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation {selectedConversation.conversationOrder + 1}</Text>
        </View>
        
        <FlatList
          data={selectedConversation.messages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={({ item, index }) => (
            <MessageBubble 
              message={item}
              isFirstInGroup={index === 0 || selectedConversation.messages[index - 1].speaker !== item.speaker}
              isLastInGroup={index === selectedConversation.messages.length - 1 || 
                            selectedConversation.messages[index + 1].speaker !== item.speaker}
            />
          )}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationContent}
        />
      </SafeAreaView>
    );
  }
  
  // Show conversation list
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversation Exercises</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>New Exercise</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.exerciseTitle}>{exerciseInfo.exercise_name}</Text>
      
      {conversations.length === 0 ? (
        <View style={styles.emptyConversationsContainer}>
          <Text style={styles.emptyConversationsTitle}>No Conversations Available</Text>
          <Text style={styles.emptyConversationsText}>
            This exercise doesn't have any conversation data yet.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Another Exercise</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => `conversation-${item.conversationOrder}`}
          renderItem={({ item }) => (
            <ConversationCard 
              conversation={item}
              onPress={() => handleConversationSelect(item)}
            />
          )}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1976D2',
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  conversationCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  messageCount: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  preview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  conversationList: {
    flex: 1,
  },
  conversationContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 8,
  },
  person1Container: {
    alignItems: 'flex-end',
  },
  person2Container: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  person1Bubble: {
    backgroundColor: '#1976D2',
    borderBottomRightRadius: 4,
  },
  person2Bubble: {
    backgroundColor: '#e5e5ea',
    borderBottomLeftRadius: 4,
  },
  firstMessage: {
    marginTop: 12,
  },
  lastMessage: {
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  person1Text: {
    color: '#fff',
  },
  person2Text: {
    color: '#000',
  },
  emptyConversationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyConversationsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyConversationsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default ConversationExercisesScreen;