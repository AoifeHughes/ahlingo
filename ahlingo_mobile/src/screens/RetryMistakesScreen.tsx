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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
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
  scrollView: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f44336',
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  topicSection: {
    marginBottom: 16,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  exerciseCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exerciseContent: {
    padding: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  exerciseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseLanguage: {
    fontSize: 12,
    color: '#666',
  },
  exerciseDate: {
    fontSize: 12,
    color: '#999',
  },
  noDataCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 12,
    textAlign: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default RetryMistakesScreen;
