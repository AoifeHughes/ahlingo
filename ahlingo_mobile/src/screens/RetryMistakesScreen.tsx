import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  getUserFailedExercises,
  getMostRecentUser,
  getUserSettings,
  getUserId,
} from '../services/SimpleDatabaseService';
import { useTheme } from '../contexts/ThemeContext';

type RetryMistakesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RetryMistakes'
>;

interface Props {
  navigation: RetryMistakesScreenNavigationProp;
}

interface FailedExercise {
  exercise_id: number;
  exercise_name: string;
  exercise_type: string;
  topic: string;
  topic_id: number;
  difficulty_level: string;
  language: string;
  last_failed_date: string;
}

const RetryMistakesScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [failedExercises, setFailedExercises] = useState<FailedExercise[]>([]);

  useEffect(() => {
    loadFailedExercises();
  }, []);

  const loadFailedExercises = async () => {
    try {
      setLoading(true);

      // Get user settings (this creates user if doesn't exist)
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);

      // Now get the user ID
      const userId = await getUserId(username);

      if (!userId) {
        setLoading(false);
        Alert.alert('Error', 'Failed to initialize user. Please try again.');
        return;
      }

      const failed = await getUserFailedExercises(userId);
      setFailedExercises(failed);
    } catch (error) {
      console.error('Failed to load failed exercises:', error);
      Alert.alert('Error', 'Failed to load exercises. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryExercise = (exercise: FailedExercise) => {
    // Navigate to the appropriate exercise screen based on type
    switch (exercise.exercise_type) {
      case 'pairs':
        navigation.navigate('PairsGame', { topicId: exercise.topic_id });
        break;
      case 'conversation':
        navigation.navigate('ConversationExercises', {
          topicId: exercise.topic_id,
        });
        break;
      case 'translation':
        navigation.navigate('TranslationExercises', {
          topicId: exercise.topic_id,
        });
        break;
      default:
        Alert.alert('Error', 'Unknown exercise type');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  const getExerciseIcon = (exerciseType: string) => {
    switch (exerciseType) {
      case 'pairs':
        return '🎯';
      case 'conversation':
        return '💬';
      case 'translation':
        return '📝';
      default:
        return '❓';
    }
  };

  const getExerciseTypeName = (exerciseType: string) => {
    switch (exerciseType) {
      case 'pairs':
        return 'Match Words';
      case 'conversation':
        return 'Conversation';
      case 'translation':
        return 'Translation';
      default:
        return 'Unknown';
    }
  };

  // Group exercises by topic for better organization
  const groupedExercises = failedExercises.reduce((groups, exercise) => {
    const topicName = exercise.topic;
    if (!groups[topicName]) {
      groups[topicName] = [];
    }
    groups[topicName].push(exercise);
    return groups;
  }, {} as Record<string, FailedExercise[]>);

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading mistakes to retry...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {failedExercises.length > 0 ? (
          <>
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Practice Makes Perfect!</Text>
              <Text style={styles.headerSubtitle}>
                Retry exercises you got wrong to improve your skills
              </Text>
              <Text style={styles.exerciseCount}>
                {failedExercises.length} exercise
                {failedExercises.length !== 1 ? 's' : ''} to retry
              </Text>
            </View>

            {Object.entries(groupedExercises).map(([topicName, exercises]) => (
              <View key={topicName} style={styles.topicSection}>
                <Text style={styles.topicTitle}>{topicName}</Text>
                {exercises.map((exercise, index) => (
                  <TouchableOpacity
                    key={exercise.exercise_id}
                    style={styles.exerciseCard}
                    onPress={() => handleRetryExercise(exercise)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.exerciseContent}>
                      <View style={styles.exerciseHeader}>
                        <View style={styles.exerciseInfo}>
                          <Text style={styles.exerciseIcon}>
                            {getExerciseIcon(exercise.exercise_type)}
                          </Text>
                          <View style={styles.exerciseDetails}>
                            <Text style={styles.exerciseType}>
                              {getExerciseTypeName(exercise.exercise_type)}
                            </Text>
                            <Text style={styles.exerciseName}>
                              {exercise.exercise_name}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.retryButton}>
                          <Text style={styles.retryButtonText}>Retry</Text>
                        </View>
                      </View>
                      <View style={styles.exerciseFooter}>
                        <Text style={styles.exerciseLanguage}>
                          {exercise.language} • {exercise.difficulty_level}
                        </Text>
                        <Text style={styles.exerciseDate}>
                          Last attempt: {formatDate(exercise.last_failed_date)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </>
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataIcon}>🎉</Text>
            <Text style={styles.noDataTitle}>Great job!</Text>
            <Text style={styles.noDataText}>
              You haven't made any mistakes yet, or you've already corrected
              them all.
            </Text>
            <Text style={styles.noDataSubtext}>
              Keep practicing to maintain your perfect record!
            </Text>
          </View>
        )}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: currentTheme.colors.surface,
    margin: currentTheme.spacing.lg,
    padding: currentTheme.spacing.xl,
    borderRadius: currentTheme.borderRadius.md,
    ...currentTheme.shadows.lg,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.md,
    textAlign: 'center',
  },
  exerciseCount: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.error,
    backgroundColor: currentTheme.colors.error + '20',
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.md,
  },
  topicSection: {
    marginBottom: currentTheme.spacing.lg,
  },
  topicTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginLeft: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
    marginTop: currentTheme.spacing.base,
  },
  exerciseCard: {
    backgroundColor: currentTheme.colors.surface,
    marginHorizontal: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
    borderRadius: currentTheme.borderRadius.base,
    ...currentTheme.shadows.base,
  },
  exerciseContent: {
    padding: currentTheme.spacing.lg,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIcon: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    marginRight: currentTheme.spacing.md,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseType: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.primary,
    marginBottom: currentTheme.spacing.xs,
  },
  exerciseName: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.medium,
    color: currentTheme.colors.text,
  },
  retryButton: {
    backgroundColor: currentTheme.colors.error,
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.base,
    borderRadius: currentTheme.spacing.xl,
    ...currentTheme.shadows.sm,
  },
  retryButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseLanguage: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
  },
  exerciseDate: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textLight,
  },
  noDataCard: {
    backgroundColor: currentTheme.colors.surface,
    margin: currentTheme.spacing.lg,
    padding: currentTheme.spacing['4xl'],
    borderRadius: currentTheme.borderRadius.md,
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  noDataIcon: {
    fontSize: currentTheme.spacing['5xl'],
    marginBottom: currentTheme.spacing.lg,
  },
  noDataTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.success,
    marginBottom: currentTheme.spacing.md,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textLight,
    textAlign: 'center',
  },
});

export default RetryMistakesScreen;
