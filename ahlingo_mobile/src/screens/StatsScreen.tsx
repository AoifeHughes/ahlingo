import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import {
  getUserStatsByTopic,
  getUserProgressSummary,
  getUserStatsAndSummary,
  getMostRecentUser,
  getUserSettings,
  getUserId,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';

type StatsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Stats'
>;

interface Props {
  navigation: StatsScreenNavigationProp;
}

interface TopicStats {
  topic: string;
  topic_id: number;
  attempted_exercises: number;
  correct_exercises: number;
  total_exercises: number;
  completion_percentage: number;
}

interface ProgressSummary {
  total_attempted: number;
  total_correct: number;
  total_available: number;
  overall_completion_percentage: number;
  success_rate: number;
}

const StatsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [progressSummary, setProgressSummary] =
    useState<ProgressSummary | null>(null);
  const [userLanguage, setUserLanguage] = useState<string>('');
  const [userDifficulty, setUserDifficulty] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const loadUserStats = useCallback(async () => {
    // Prevent multiple concurrent requests
    if (isLoadingRef.current) {
      console.log(
        'Stats loading already in progress, skipping duplicate request'
      );
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Set loading guard
    isLoadingRef.current = true;

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setLoading(true);

      const raceWithTimeout = async <T>(task: Promise<T>): Promise<T> => {
        let timeoutId: ReturnType<typeof setTimeout>;
        let cleanupCalled = false;
        let onAbort: () => void = () => {};

        const cleanup = () => {
          if (cleanupCalled) return;
          cleanupCalled = true;
          clearTimeout(timeoutId);
          signal.removeEventListener('abort', onAbort);
        };

        const timeoutPromise = new Promise<never>((_, reject) => {
          onAbort = () => {
            cleanup();
            reject(new Error('Request was cancelled'));
          };

          timeoutId = setTimeout(() => {
            cleanup();
            reject(new Error('Database operation timed out'));
          }, 10000);

          signal.addEventListener('abort', onAbort);
        });

        try {
          return await Promise.race([task, timeoutPromise]);
        } finally {
          cleanup();
        }
      };

      // Get user settings (this creates user if doesn't exist)
      const username = await raceWithTimeout(getMostRecentUser());

      if (signal.aborted) return;

      const userSettings = await raceWithTimeout(getUserSettings(username));

      if (signal.aborted) return;

      // Now get the user ID
      const userId = await raceWithTimeout(getUserId(username));

      if (signal.aborted) return;

      if (!userId) {
        if (!signal.aborted) {
          setLoading(false);
          Alert.alert('Error', 'Failed to initialize user. Please try again.');
        }
        return;
      }

      // Get user's language and difficulty from settings
      const language = userSettings.language || 'French';
      const difficulty = userSettings.difficulty || 'Beginner';

      // Store for display in UI
      setUserLanguage(language);
      setUserDifficulty(difficulty);

      // Load topic stats and progress summary with timeout using batched function
      const { stats: topicData, summary: summaryData } =
        await raceWithTimeout(getUserStatsAndSummary(userId, language, difficulty));

      if (signal.aborted) return;

      setTopicStats(topicData);
      setProgressSummary(summaryData);
    } catch (error) {
      if (signal.aborted) return;

      console.error('Failed to load user stats:', error);
      if (
        error instanceof Error &&
        error.message === 'Database operation timed out'
      ) {
        Alert.alert(
          'Timeout',
          'Loading statistics is taking too long. Please try again.'
        );
      } else if (
        error instanceof Error &&
        error.message === 'Request was cancelled'
      ) {
        // Don't show alert for cancelled requests
        return;
      } else {
        Alert.alert('Error', 'Failed to load statistics. Please try again.');
      }
    } finally {
      // Always clear the loading guard
      isLoadingRef.current = false;

      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUserStats();

      // Cleanup function - runs when screen loses focus or unmounts
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }
        // Clear loading guard
        isLoadingRef.current = false;
        // Reset loading state when leaving screen
        setLoading(true);
      };
    }, []) // Remove loadUserStats dependency to prevent re-creation
  );

  const renderProgressBar = (percentage: number) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(percentage || 0, 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{percentage || 0}%</Text>
      </View>
    );
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Overall Progress Summary */}
        {progressSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overall Progress</Text>
            {userLanguage && userDifficulty && (
              <Text style={styles.summarySubtitle}>
                {userLanguage} • {userDifficulty} Level
              </Text>
            )}
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {progressSummary.total_correct}
                </Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {progressSummary.total_attempted}
                </Text>
                <Text style={styles.statLabel}>Attempted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {progressSummary.total_available}
                </Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>
                Overall Completion:{' '}
                {progressSummary.overall_completion_percentage || 0}%
              </Text>
              {renderProgressBar(
                progressSummary.overall_completion_percentage || 0
              )}
            </View>
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>
                Success Rate: {progressSummary.success_rate || 0}%
              </Text>
              {renderProgressBar(progressSummary.success_rate || 0)}
            </View>
          </View>
        )}

        {/* Topic Breakdown */}
        <View style={styles.topicsSection}>
          <Text style={styles.sectionTitle}>Progress by Topic</Text>
          {userLanguage && userDifficulty && (
            <Text style={styles.sectionSubtitle}>
              Showing {userLanguage} • {userDifficulty} Level
            </Text>
          )}
          {topicStats.length > 0 ? (
            topicStats.map((topic, index) => (
              <View key={topic.topic_id} style={styles.topicCard}>
                <View style={styles.topicHeader}>
                  <Text style={styles.topicName}>{topic.topic}</Text>
                  <Text style={styles.topicStats}>
                    {topic.correct_exercises}/{topic.total_exercises}
                  </Text>
                </View>
                <Text style={styles.topicAttempted}>
                  Attempted: {topic.attempted_exercises} exercises
                </Text>
                {renderProgressBar(topic.completion_percentage || 0)}
              </View>
            ))
          ) : (
            <View style={styles.noDataCard}>
              <Text style={styles.noDataText}>No exercise data yet.</Text>
              <Text style={styles.noDataSubtext}>
                Start completing exercises to see your progress!
              </Text>
            </View>
          )}
        </View>
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
  summaryCard: {
    backgroundColor: currentTheme.colors.surface,
    margin: currentTheme.spacing.lg,
    padding: currentTheme.spacing.xl,
    borderRadius: currentTheme.borderRadius.md,
    ...currentTheme.shadows.lg,
  },
  summaryTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  summarySubtitle: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.lg,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: currentTheme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.primary,
  },
  statLabel: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginTop: currentTheme.spacing.xs,
  },
  overallProgress: {
    marginBottom: currentTheme.spacing.lg,
  },
  overallProgressLabel: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.base,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: currentTheme.spacing.base,
    backgroundColor: currentTheme.colors.border,
    borderRadius: currentTheme.borderRadius.sm,
    marginRight: currentTheme.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: currentTheme.colors.success,
    borderRadius: currentTheme.borderRadius.sm,
  },
  progressText: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    minWidth: 40,
  },
  topicsSection: {
    margin: currentTheme.spacing.lg,
  },
  sectionTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.md,
    fontStyle: 'italic',
  },
  topicCard: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.base,
    marginBottom: currentTheme.spacing.md,
    ...currentTheme.shadows.base,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.xs,
  },
  topicName: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
  },
  topicStats: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.primary,
  },
  topicAttempted: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.base,
  },
  noDataCard: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing['4xl'],
    borderRadius: currentTheme.borderRadius.base,
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  noDataText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
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

export default StatsScreen;
