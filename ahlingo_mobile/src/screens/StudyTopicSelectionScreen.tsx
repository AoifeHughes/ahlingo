import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootStackParamList, StudyTopicInfo } from '../types';
import { RootState } from '../store';
import {
  getTopicsForStudy,
  getRandomMixedExercisesForTopic,
  getUserContext,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';

type StudyTopicSelectionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudyTopic'
>;

type StudyTopicSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'StudyTopic'
>;

interface Props {
  navigation: StudyTopicSelectionScreenNavigationProp;
  route: StudyTopicSelectionScreenRouteProp;
}

const StudyTopicSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();
  const [topics, setTopics] = useState<StudyTopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');

  useEffect(() => {
    loadUserSettingsAndTopics();
  }, []);

  const loadUserSettingsAndTopics = async () => {
    try {
      setLoading(true);

      // Get complete user context in single call
      const userContext = await getUserContext();
      
      if (!userContext) {
        Alert.alert('Error', 'Failed to initialize user. Please try again.');
        return;
      }

      const language = userContext.settings.language || settings.language || 'French';
      const difficulty = userContext.settings.difficulty || settings.difficulty || 'Beginner';

      setUserLanguage(language);
      setUserDifficulty(difficulty);
      
      // Load topics with progress and available exercise types
      const studyTopics = await getTopicsForStudy(userContext.userId, language, difficulty);
      setTopics(studyTopics);
    } catch (error) {
      console.error('Failed to load study topics:', error);
      Alert.alert('Error', 'Failed to load topics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicPress = async (topic: StudyTopicInfo) => {
    try {
      setLoading(true);

      // Get complete user context in single call
      const userContext = await getUserContext();
      
      if (!userContext) {
        Alert.alert('Error', 'Failed to initialize user. Please try again.');
        return;
      }

      const language = userContext.settings.language || settings.language || 'French';
      const difficulty = userContext.settings.difficulty || settings.difficulty || 'Beginner';

      // Get 5 random mixed exercises for this topic
      const exercises = await getRandomMixedExercisesForTopic(
        topic.id,
        userContext.userId,
        language,
        difficulty
      );

      if (exercises.length === 0) {
        Alert.alert(
          'No Exercises Found',
          'No exercises are available for this topic with your current settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (exercises.length < 5) {
        Alert.alert(
          'Limited Exercises',
          `Only ${exercises.length} exercises are available for this topic. The study session will continue with these exercises.`,
          [
            { text: 'Cancel' },
            { 
              text: 'Continue', 
              onPress: () => navigation.navigate('StudyTopicShuffle', {
                topicId: topic.id,
                topicName: topic.topic,
                exercises,
              })
            },
          ]
        );
      } else {
        navigation.navigate('StudyTopicShuffle', {
          topicId: topic.id,
          topicName: topic.topic,
          exercises,
        });
      }
    } catch (error) {
      console.error('Failed to prepare study session:', error);
      Alert.alert('Error', 'Failed to prepare study session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserSettingsAndTopics();
    setRefreshing(false);
  };

  const renderTopicCard = ({ item }: { item: StudyTopicInfo }) => (
    <TouchableOpacity
      style={styles.topicCard}
      onPress={() => handleTopicPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.topicHeader}>
        <Text style={styles.topicTitle}>{item.topic}</Text>
        <Text style={styles.progressText}>{item.percentage}%</Text>
      </View>
      
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${item.percentage}%` }
            ]} 
          />
        </View>
      </View>

      <View style={styles.topicDetails}>
        <Text style={styles.exerciseCount}>
          {item.completedExercises}/{item.totalExercises} exercises
        </Text>
        <View style={styles.exerciseTypes}>
          {item.availableExerciseTypes.map((type, index) => (
            <View key={type} style={styles.exerciseTypeBadge}>
              <Text style={styles.exerciseTypeText}>
                {type === 'fill_in_blank' ? 'fill-in' : type}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>No Study Topics Available</Text>
      <Text style={styles.emptyText}>
        No topics with sufficient exercises found for {userLanguage} at {userDifficulty} level.
      </Text>
      <Text style={styles.emptyHint}>
        Topics need at least 5 exercises to be available for study sessions.
      </Text>
    </View>
  );

  const styles = createStyles(theme);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading study topics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Study Topics</Text>
        <Text style={styles.headerSubtitle}>
          Choose a topic for focused practice
        </Text>
        <Text style={styles.headerDetails}>
          {userLanguage} • {userDifficulty}
        </Text>
      </View>

      <FlatList
        data={topics}
        renderItem={renderTopicCard}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
  headerDetails: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.primary,
    textAlign: 'center',
    marginTop: currentTheme.spacing.xs,
    fontWeight: currentTheme.typography.fontWeights.medium,
  },
  listContainer: {
    padding: currentTheme.spacing.base,
    flexGrow: 1,
  },
  topicCard: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
    ...currentTheme.shadows.base,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  topicTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    flex: 1,
  },
  progressText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.primary,
  },
  progressBarContainer: {
    marginBottom: currentTheme.spacing.base,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: currentTheme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: currentTheme.colors.primary,
  },
  topicDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
  },
  exerciseTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exerciseTypeBadge: {
    backgroundColor: currentTheme.colors.primary + '20',
    paddingHorizontal: currentTheme.spacing.xs,
    paddingVertical: 2,
    borderRadius: currentTheme.borderRadius.sm,
    marginLeft: currentTheme.spacing.xs,
  },
  exerciseTypeText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: currentTheme.spacing['4xl'],
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: currentTheme.spacing.lg,
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

export default StudyTopicSelectionScreen;