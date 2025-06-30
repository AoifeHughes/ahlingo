import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  getUserStatsByTopic,
  getUserProgressSummary,
  getMostRecentUser,
  getUserId,
} from '../services/SimpleDatabaseService';

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
  const [loading, setLoading] = useState(true);
  const [topicStats, setTopicStats] = useState<TopicStats[]>([]);
  const [progressSummary, setProgressSummary] = useState<ProgressSummary | null>(null);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      setLoading(true);
      
      const username = await getMostRecentUser();
      const userId = await getUserId(username);
      
      if (!userId) {
        Alert.alert('Error', 'User not found. Please check your settings.');
        return;
      }

      // Load topic stats and progress summary
      const [topicData, summaryData] = await Promise.all([
        getUserStatsByTopic(userId),
        getUserProgressSummary(userId)
      ]);

      setTopicStats(topicData);
      setProgressSummary(summaryData);
      
    } catch (error) {
      console.error('Failed to load user stats:', error);
      Alert.alert('Error', 'Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderProgressBar = (percentage: number) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${Math.min(percentage || 0, 100)}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{percentage || 0}%</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading your statistics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Overall Progress Summary */}
        {progressSummary && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overall Progress</Text>
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progressSummary.total_correct}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progressSummary.total_attempted}</Text>
                <Text style={styles.statLabel}>Attempted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{progressSummary.total_available}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>
            <View style={styles.overallProgress}>
              <Text style={styles.overallProgressLabel}>
                Overall Completion: {progressSummary.overall_completion_percentage || 0}%
              </Text>
              {renderProgressBar(progressSummary.overall_completion_percentage || 0)}
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  overallProgress: {
    marginBottom: 16,
  },
  overallProgressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 40,
  },
  topicsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  topicCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  topicStats: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  topicAttempted: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  noDataCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
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

export default StatsScreen;