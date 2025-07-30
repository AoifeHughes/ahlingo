import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type ExerciseShuffleSummaryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ExerciseShuffleSummary'
>;

type ExerciseShuffleSummaryScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseShuffleSummary'
>;

interface Props {
  navigation: ExerciseShuffleSummaryScreenNavigationProp;
  route: ExerciseShuffleSummaryScreenRouteProp;
}

const ExerciseShuffleSummaryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { results, exercises } = route.params;
  const { theme } = useTheme();

  const successCount = results.filter(result => result).length;

  // Handle back button press - on summary screen, just go to main menu without warning
  const handleBackPress = useCallback(() => {
    navigation.navigate('MainMenu');
    return true; // Prevent default back action
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => handleBackPress();
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );
  const totalCount = results.length;
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  const getOverallMessage = () => {
    if (successRate >= 80) return "Excellent work! 🌟";
    if (successRate >= 60) return "Great progress! 👏";
    if (successRate >= 40) return "Good effort! 💪";
    return "Keep practicing! 📚";
  };

  const getEncouragementMessage = () => {
    if (successRate >= 80) return "You're mastering these topics!";
    if (successRate >= 60) return "You're making solid progress!";
    if (successRate >= 40) return "Practice makes perfect!";
    return "Every attempt makes you stronger!";
  };

  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.icon}>🎯</Text>
        <Text style={styles.title}>Shuffle Complete!</Text>
        <Text style={styles.overallMessage}>{getOverallMessage()}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{successCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalCount}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{successRate}%</Text>
          <Text style={styles.statLabel}>Success Rate</Text>
        </View>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Challenge Results:</Text>
        {exercises.map((exercise, index) => (
          <View key={index} style={styles.resultItem}>
            <View style={styles.resultIcon}>
              <Text style={styles.resultEmoji}>
                {results[index] ? '✅' : '❌'}
              </Text>
            </View>
            <View style={styles.resultDetails}>
              <Text style={styles.resultTitle}>
                Challenge {index + 1}: {exercise.topicName}
              </Text>
              <Text style={styles.resultType}>
                {exercise.exerciseType}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.encouragementContainer}>
        <Text style={styles.encouragementText}>
          {getEncouragementMessage()}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.shuffleAgainButton}
          onPress={() => navigation.navigate('ExerciseShuffle')}
          activeOpacity={0.8}
        >
          <Text style={styles.shuffleAgainButtonText}>Shuffle Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.mainMenuButton}
          onPress={() => navigation.navigate('MainMenu')}
          activeOpacity={0.8}
        >
          <Text style={styles.mainMenuButtonText}>Back to Main Menu</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  contentContainer: {
    padding: currentTheme.spacing.xl,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: currentTheme.spacing.xl,
  },
  icon: {
    fontSize: 80,
    marginBottom: currentTheme.spacing.lg,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  overallMessage: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.primary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: currentTheme.spacing.xl,
  },
  statCard: {
    backgroundColor: currentTheme.colors.surface,
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing.base,
    borderRadius: currentTheme.borderRadius.lg,
    alignItems: 'center',
    minWidth: 80,
    ...currentTheme.shadows.base,
  },
  statNumber: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.primary,
    marginBottom: currentTheme.spacing.xs,
  },
  statLabel: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
  resultsContainer: {
    width: '100%',
    marginBottom: currentTheme.spacing.xl,
  },
  resultsTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.lg,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.base,
    borderRadius: currentTheme.borderRadius.base,
    marginBottom: currentTheme.spacing.base,
  },
  resultIcon: {
    marginRight: currentTheme.spacing.base,
  },
  resultEmoji: {
    fontSize: 24,
  },
  resultDetails: {
    flex: 1,
  },
  resultTitle: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.medium,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  resultType: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    textTransform: 'capitalize',
  },
  encouragementContainer: {
    marginBottom: currentTheme.spacing.xl,
  },
  encouragementText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
  },
  shuffleAgainButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing['2xl'],
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.lg,
    ...currentTheme.shadows.base,
  },
  shuffleAgainButtonText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    textAlign: 'center',
  },
  mainMenuButton: {
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing.lg,
  },
  mainMenuButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExerciseShuffleSummaryScreen;