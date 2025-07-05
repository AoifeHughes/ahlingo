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
import { RootStackParamList, Topic, TopicWithProgress } from '../types';
import { RootState } from '../store';
import TopicCard from '../components/TopicCard';
import {
  getTopicsForPairs,
  getTopicsForConversation,
  getTopicsForTranslation,
  getTopicsForFillInBlank,
  getUserSettings,
  getMostRecentUser,
  getUserId,
  getTopicProgress,
} from '../services/SimpleDatabaseService';
import { useTheme } from '../contexts/ThemeContext';

type TopicSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TopicSelection'
>;

type TopicSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'TopicSelection'
>;

interface Props {
  navigation: TopicSelectionScreenNavigationProp;
  route: TopicSelectionScreenRouteProp;
}

const TopicSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();
  const [topics, setTopics] = useState<TopicWithProgress[]>([]);
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
      const difficulty =
        userSettings.difficulty || settings.difficulty || 'Beginner';

      setUserLanguage(language);
      setUserDifficulty(difficulty);

      // Get user ID for progress tracking
      const userId = await getUserId(username);
      
      // Load topics based on exercise type
      let availableTopics: Topic[] = [];
      if (exerciseType === 'pairs') {
        availableTopics = await getTopicsForPairs(language, difficulty);
      } else if (exerciseType === 'conversation') {
        availableTopics = await getTopicsForConversation(language, difficulty);
      } else if (exerciseType === 'translation') {
        availableTopics = await getTopicsForTranslation(language, difficulty);
      } else if (exerciseType === 'fill_in_blank') {
        availableTopics = await getTopicsForFillInBlank(language, difficulty);
      } else {
        // Fallback to pairs for unknown exercise types
        availableTopics = await getTopicsForPairs(language, difficulty);
      }

      // Fetch progress for each topic
      const topicsWithProgress: TopicWithProgress[] = await Promise.all(
        availableTopics.map(async (topic) => {
          const progress = userId
            ? await getTopicProgress(userId, topic.id, exerciseType, language, difficulty)
            : { totalExercises: 0, completedExercises: 0, percentage: 0 };
          return { ...topic, progress };
        })
      );

      setTopics(topicsWithProgress);
    } catch (error) {
      console.error('Failed to load topics:', error);
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = (topic: TopicWithProgress) => {
    if (exerciseType === 'pairs') {
      navigation.navigate('PairsGame', { topicId: topic.id });
    } else if (exerciseType === 'conversation') {
      navigation.navigate('ConversationExercises', { topicId: topic.id });
    } else if (exerciseType === 'translation') {
      navigation.navigate('TranslationExercises', { topicId: topic.id });
    } else if (exerciseType === 'fill_in_blank') {
      navigation.navigate('FillInTheBlank', { topicId: topic.id });
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
      case 'fill_in_blank':
        return 'Fill in the Blank Exercises';
      default:
        return 'Choose a Topic';
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserSettingsAndTopics();
    setRefreshing(false);
  };

  const renderTopicCard = ({ item, index }: { item: TopicWithProgress; index: number }) => (
    <View style={styles.cardWrapper}>
      <TopicCard topic={item} onPress={handleTopicPress} />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Topics Available</Text>
      <Text style={styles.emptyText}>
        No {exerciseType} exercises found for {userLanguage} at {userDifficulty}{' '}
        level.
      </Text>
      <Text style={styles.emptyHint}>
        Try changing your language or difficulty in Settings.
      </Text>
    </View>
  );

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.background,
  },
  loadingText: {
    marginTop: currentTheme.spacing.lg,
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
  },
  header: {
    backgroundColor: currentTheme.colors.surface,
    paddingVertical: currentTheme.spacing.xl,
    paddingHorizontal: currentTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.border,
  },
  headerTitle: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: currentTheme.spacing.xs,
  },
  listContainer: {
    paddingVertical: currentTheme.spacing.base,
    paddingHorizontal: currentTheme.spacing.base,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    flex: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: currentTheme.spacing['4xl'],
  },
  emptyTitle: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  emptyHint: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TopicSelectionScreen;
