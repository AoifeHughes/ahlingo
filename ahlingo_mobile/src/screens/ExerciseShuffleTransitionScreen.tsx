import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { RootStackParamList, ExerciseShuffleContext } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type ExerciseShuffleTransitionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ExerciseShuffleTransition'
>;

type ExerciseShuffleTransitionScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseShuffleTransition'
>;

interface Props {
  navigation: ExerciseShuffleTransitionScreenNavigationProp;
  route: ExerciseShuffleTransitionScreenRouteProp;
}

const ExerciseShuffleTransitionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { currentChallenge, totalChallenges, success, nextExercise, results, exercises } = route.params;
  const { theme } = useTheme();

  const isLastExercise = currentChallenge >= totalChallenges;

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Alert.alert(
      'Exit Shuffle?',
      'Your progress will be lost if you exit now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.navigate('MainMenu')
        },
      ]
    );
    return true; // Prevent default back action
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => handleBackPress();
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  // Prevent removal and show warning for navigation header back button
  usePreventRemove(true, ({ data }) => {
    Alert.alert(
      'Exit Shuffle?',
      'Your progress will be lost if you exit now.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => navigation.navigate('MainMenu')
        },
      ]
    );
  });

  const message = success
    ? "Well done! Ready for the next?"
    : "Keep trying, you've got this";

  const buttonText = isLastExercise ? "See Results" : "Next Challenge";

  const handleContinue = () => {
    if (isLastExercise) {
      // Navigate to summary screen with all results
      navigation.navigate('ExerciseShuffleSummary', {
        results,
        exercises,
      });
    } else {
      // Navigate to next exercise
      const nextChallengeIndex = currentChallenge; // currentChallenge is 1-based, array is 0-based
      const nextExerciseData = exercises[nextChallengeIndex];

      const shuffleContext: ExerciseShuffleContext = {
        isShuffleMode: true,
        currentChallenge: currentChallenge + 1,
        totalChallenges,
        onComplete: (nextSuccess: boolean) => {
          const updatedResults = [...results, nextSuccess];

          if (currentChallenge + 1 >= totalChallenges) {
            // Last exercise completed, go to summary
            navigation.navigate('ExerciseShuffleSummary', {
              results: updatedResults,
              exercises,
            });
          } else {
            // More exercises remaining
            const upcomingExercise = exercises[currentChallenge + 1] || null;
            navigation.navigate('ExerciseShuffleTransition', {
              currentChallenge: currentChallenge + 1,
              totalChallenges,
              success: nextSuccess,
              nextExercise: upcomingExercise,
              results: updatedResults,
              exercises,
            });
          }
        },
      };

      // Navigate to the appropriate exercise screen
      if (nextExerciseData) {
        switch (nextExerciseData.exerciseType) {
          case 'pairs':
            navigation.navigate('PairsGame', {
              shuffleContext,
              exerciseInfo: nextExerciseData.exerciseInfo,
            });
            break;
          case 'conversation':
            navigation.navigate('ConversationExercises', {
              shuffleContext,
              exerciseInfo: nextExerciseData.exerciseInfo,
            });
            break;
          case 'translation':
            navigation.navigate('TranslationExercises', {
              shuffleContext,
              exerciseInfo: nextExerciseData.exerciseInfo,
            });
            break;
          case 'fill_in_blank':
            navigation.navigate('FillInTheBlank', {
              shuffleContext,
              exerciseInfo: nextExerciseData.exerciseInfo,
            });
            break;
        }
      }
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{success ? '🎉' : '💪'}</Text>

        <Text style={styles.message}>{message}</Text>

        <View style={styles.progressIndicator}>
          <Text style={styles.progressText}>
            Challenge {currentChallenge}/{totalChallenges}
          </Text>
        </View>

        {!isLastExercise && nextExercise && (
          <View style={styles.nextExercisePreview}>
            <Text style={styles.previewTitle}>Next up:</Text>
            <Text style={styles.exerciseDetails}>
              {nextExercise.topicName} ({nextExercise.exerciseType})
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: success ? theme.colors.success : theme.colors.primary }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: currentTheme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  icon: {
    fontSize: 80,
    marginBottom: currentTheme.spacing.xl,
  },
  message: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xl,
  },
  progressIndicator: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.base,
    paddingHorizontal: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.xl,
  },
  progressText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.background,
  },
  nextExercisePreview: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.xl,
    width: '100%',
  },
  previewTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
    textAlign: 'center',
  },
  exerciseDetails: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
  continueButton: {
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing['2xl'],
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.lg,
    width: '100%',
    ...currentTheme.shadows.base,
  },
  continueButtonText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    textAlign: 'center',
  },
  exitButton: {
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing.lg,
  },
  exitButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExerciseShuffleTransitionScreen;
