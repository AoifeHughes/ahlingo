import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootStackParamList, Topic } from '../types';
import { RootState } from '../store';
import TopicCard from '../components/TopicCard';
import {
  getTopicsForPairs,
  getTopicsForConversations,
  getUserSettings,
  getMostRecentUser,
} from '../services/SimpleDatabaseService';

type TopicSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TopicSelection'
>;

type TopicSelectionScreenRouteProp = RouteProp<RootStackParamList, 'TopicSelection'>;

interface Props {
  navigation: TopicSelectionScreenNavigationProp;
  route: TopicSelectionScreenRouteProp;
}

const TopicSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { settings } = useSelector((state: RootState) => state.settings);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');
  
  const exerciseType = route.params?.exerciseType || 'pairs';

  useEffect(() => {
    loadUserSettingsAndTopics();
  }, [exerciseType]);

  const loadUserSettingsAndTopics = async () => {
    try {
      setLoading(true);
      
      // Get current user settings from database
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      
      const language = userSettings.language || settings.language || 'French';
      const difficulty = userSettings.difficulty || settings.difficulty || 'Beginner';
      
      setUserLanguage(language);
      setUserDifficulty(difficulty);
      
      // Load topics based on exercise type
      let availableTopics: Topic[] = [];
      if (exerciseType === 'pairs') {
        availableTopics = await getTopicsForPairs(language, difficulty);
      } else if (exerciseType === 'conversation') {
        availableTopics = await getTopicsForConversations(language, difficulty);
      } else {
        // For translation exercises, use pairs for now (you can add getTopicsForTranslation later)
        availableTopics = await getTopicsForPairs(language, difficulty);
      }
      
      setTopics(availableTopics);
      
    } catch (error) {
      console.error('Failed to load topics:', error);
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: Topic) => {
    if (exerciseType === 'pairs') {
      navigation.navigate('PairsGame', { topicId: topic.id });
    } else if (exerciseType === 'conversation') {
      navigation.navigate('ConversationExercises', { topicId: topic.id });
    } else if (exerciseType === 'translation') {
      navigation.navigate('TranslationExercises', { topicId: topic.id });
    }
  };

  const getExerciseTypeTitle = () => {
    switch (exerciseType) {
      case 'pairs':
        return 'Pairs Exercises';
      case 'conversation':
        return 'Conversation Exercises';
      case 'translation':
        return 'Translation Exercises';
      default:
        return 'Choose a Topic';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserSettingsAndTopics();
    setRefreshing(false);
  };

  const renderTopicCard = ({ item }: { item: Topic }) => (
    <TopicCard topic={item} onPress={handleTopicPress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Topics Available</Text>
      <Text style={styles.emptyText}>
        No {exerciseType} exercises found for {userLanguage} at {userDifficulty} level.
      </Text>
      <Text style={styles.emptyHint}>
        Try changing your language or difficulty in Settings.
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading topics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{getExerciseTypeTitle()}</Text>
        <Text style={styles.headerSubtitle}>
          {userLanguage} • {userDifficulty}
        </Text>
      </View>
      
      <FlatList
        data={topics}
        renderItem={renderTopicCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1976D2']}
            tintColor="#1976D2"
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
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
  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  listContainer: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TopicSelectionScreen;