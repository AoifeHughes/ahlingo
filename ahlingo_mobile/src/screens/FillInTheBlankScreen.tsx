import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  BackHandler,
} from 'react-native';
import { RouteProp, useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo, FillInBlankExercise } from '../types';
import { RootState } from '../store';
import { WordButton } from '../components';
import {
  getRandomFillInBlankExerciseForTopic,
  getFillInBlankExerciseData,
  getUserContext,
  recordExerciseAttemptForCurrentUser,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';
import TTSService from '../services/TTSService';

type FillInTheBlankScreenRouteProp = RouteProp<
  RootStackParamList,
  'FillInTheBlank'
>;
type FillInTheBlankScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'FillInTheBlank'
>;

interface Props {
  route: FillInTheBlankScreenRouteProp;
  navigation: FillInTheBlankScreenNavigationProp;
}

interface GameState {
  sentence: string;
  correctAnswer: string;
  allWords: string[];
  selectedWord: string | null;
  hasSubmitted: boolean;
  isCorrect: boolean | null;
  score: number;
  translation?: string;
}

const FillInTheBlankScreen: React.FC<Props> = ({ route, navigation }) => {
  const { topicId, shuffleContext, exerciseInfo } = route.params || {};
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();

  // Safety check: if no topicId or exerciseInfo is provided, go back
  useEffect(() => {
    if (!topicId && !exerciseInfo) {
      Alert.alert('Error', 'No topic selected. Please select a topic first.');
      navigation.goBack();
      return;
    }
  }, [topicId, exerciseInfo, navigation]);

  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<ExerciseInfo | null>(null);
  const [fillInBlankData, setFillInBlankData] = useState<FillInBlankExercise[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    sentence: '',
    correctAnswer: '',
    allWords: [],
    selectedWord: null,
    hasSubmitted: false,
    isCorrect: null,
    score: 0,
  });
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');

  useEffect(() => {
    if (topicId || exerciseInfo) {
      loadFillInBlankData();
    }
  }, [topicId, exerciseInfo]);

  // Handle back button press when in shuffle mode
  const handleBackPress = useCallback(() => {
    if (shuffleContext) {
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
    }
    return false; // Allow default back action for normal mode
  }, [shuffleContext, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (shuffleContext) {
        const onBackPress = () => handleBackPress();
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
      }
    }, [shuffleContext, handleBackPress])
  );

  // Prevent removal when in shuffle mode and show warning
  usePreventRemove(!!shuffleContext, ({ data }) => {
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

  const loadFillInBlankData = async () => {
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

      let exercise: ExerciseInfo | null = null;

      // Check if we're in shuffle mode and have a specific exercise
      if (shuffleContext && exerciseInfo) {
        exercise = exerciseInfo;
      } else if (topicId) {
        // Get random fill-in-blank exercise for this topic (prioritizing untried exercises)
        exercise = await getRandomFillInBlankExerciseForTopic(
          topicId,
          language,
          difficulty,
          userContext.userId
        );
      }

      if (!exercise) {
        setLoading(false);
        Alert.alert('Error', 'No fill-in-the-blank exercises found for this topic.');
        navigation.goBack();
        return;
      }

      setCurrentExercise(exercise);

      // Get fill-in-blank data for this exercise
      const exerciseData = await getFillInBlankExerciseData(exercise.id);
      setFillInBlankData(exerciseData);

      // Set up the game with the first fill-in-blank item
      if (exerciseData.length > 0) {
        setupGame(exerciseData[0]);
      }
    } catch (error) {
      console.error('Failed to load fill-in-blank data:', error);
      Alert.alert(
        'Error',
        'Failed to load fill-in-the-blank exercise. Please try again.'
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const setupGame = (fillInBlank: FillInBlankExercise) => {
    const sentence = fillInBlank.sentence;
    const correctAnswer = fillInBlank.correct_answer.trim();
    const incorrect1 = fillInBlank.incorrect_1.trim();
    const incorrect2 = fillInBlank.incorrect_2.trim();
    const translation = fillInBlank.translation;

    // Combine correct and incorrect answers and shuffle them
    const allWords = [correctAnswer, incorrect1, incorrect2].sort(() => Math.random() - 0.5);

    setGameState({
      sentence,
      correctAnswer,
      allWords,
      selectedWord: null,
      hasSubmitted: false,
      isCorrect: null,
      score: 0,
      translation,
    });
  };

  const handleRefresh = () => {
    loadFillInBlankData();
  };

  const handleWordPress = (word: string) => {
    if (gameState.hasSubmitted) return;

    // Speak the word in the target language when clicked
    TTSService.speak(word, userLanguage);

    setGameState(prev => ({
      ...prev,
      selectedWord: word,
    }));
  };

  const handleSubmit = async () => {
    if (!gameState.selectedWord) return;

    const isCorrect = gameState.selectedWord.toLowerCase().trim() ===
                     gameState.correctAnswer.toLowerCase().trim();

    // Record the exercise attempt
    if (currentExercise) {
      await recordExerciseAttemptForCurrentUser(currentExercise.id, isCorrect);
    }

    setGameState(prev => ({
      ...prev,
      hasSubmitted: true,
      isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));

    // Speak the full correct sentence after submission
    const completeSentence = gameState.sentence.replace('_', gameState.correctAnswer);
    TTSService.speak(completeSentence, userLanguage);

    // Handle shuffle mode completion
    if (shuffleContext) {
      // Don't auto-transition in shuffle mode
    }
  };

  const handleNextExercise = () => {
    if (shuffleContext && gameState.hasSubmitted) {
      // In shuffle mode, proceed to next exercise in shuffle
      shuffleContext.onComplete(gameState.isCorrect || false);
    } else {
      // In normal mode, load a new exercise
      if (fillInBlankData.length > 1) {
        // Get a random different exercise from the current data
        const otherExercises = fillInBlankData.filter(
          (_, index) =>
            index !==
            fillInBlankData.findIndex(
              fb => fb.sentence === gameState.sentence
            )
        );

        if (otherExercises.length > 0) {
          const nextExercise =
            otherExercises[Math.floor(Math.random() * otherExercises.length)];
          setupGame(nextExercise);
          return;
        }
      }

      // If no other exercises in current data, load new data
      loadFillInBlankData();
    }
  };

  const renderSentenceWithBlank = () => {
    if (!gameState.selectedWord) {
      return gameState.sentence;
    }

    return gameState.sentence.replace('_', gameState.selectedWord);
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading fill-in-the-blank exercise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with refresh button - hidden in shuffle mode */}
      {!shuffleContext && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>🔄 New Exercise</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Fill in the blank:</Text>
      </View>

      {/* Sentence with blank/answer */}
      <View style={styles.sentenceContainer}>
        <Text style={styles.sentenceText}>
          {renderSentenceWithBlank()}
        </Text>
      </View>

      {/* Feedback */}
      {gameState.hasSubmitted && (
        <View style={styles.feedbackContainer}>
          <Text
            style={[
              styles.feedbackText,
              gameState.isCorrect
                ? styles.correctFeedback
                : styles.incorrectFeedback,
            ]}
          >
            {gameState.isCorrect ? '✅ Correct!' : '❌ Incorrect. Try again!'}
          </Text>

          {/* Show the complete correct sentence */}
          <View style={styles.correctSentenceContainer}>
            <Text style={styles.correctSentenceLabel}>Complete sentence:</Text>
            <Text style={styles.correctSentenceText}>
              {gameState.sentence.replace('_', gameState.correctAnswer)}
            </Text>
          </View>

          {/* Show translation if available */}
          {gameState.translation && (
            <View style={styles.translationContainer}>
              <Text style={styles.translationLabel}>Translation:</Text>
              <Text style={styles.translationText}>
                {gameState.translation}
              </Text>
            </View>
          )}

          {!gameState.isCorrect && (
            <Text style={styles.correctAnswerText}>
              Correct answer: {gameState.correctAnswer}
            </Text>
          )}

          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNextExercise}
          >
            <Text style={styles.nextButtonText}>
              {shuffleContext
                ? (gameState.isCorrect ? '✅ Perfect! Next Exercise' : '➡️ Next Exercise')
                : 'Next Exercise'
              }
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Word selection area */}
      <View style={styles.wordsContainer}>
        <Text style={styles.wordsTitle}>
          Choose the correct word:
        </Text>
        <View style={styles.wordsGrid}>
          {gameState.allWords.map((word, index) => (
            <WordButton
              key={`${word}-${index}`}
              word={word}
              index={index}
              isSelected={gameState.selectedWord === word}
              onPress={() => handleWordPress(word)}
              disabled={gameState.hasSubmitted}
            />
          ))}
        </View>

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!gameState.selectedWord || gameState.hasSubmitted) &&
              styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!gameState.selectedWord || gameState.hasSubmitted}
        >
          <Text
            style={[
              styles.submitButtonText,
              (!gameState.selectedWord || gameState.hasSubmitted) &&
                styles.submitButtonTextDisabled,
            ]}
          >
            Submit Answer
          </Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: currentTheme.spacing.md,
    paddingHorizontal: currentTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.colors.border,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.base,
    paddingHorizontal: currentTheme.spacing.lg,
    borderRadius: currentTheme.spacing.xl,
    ...currentTheme.shadows.base,
  },
  refreshButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  instructionsContainer: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
  },
  instructionsTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    textAlign: 'center',
  },
  sentenceContainer: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
  },
  sentenceText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.primary,
    textAlign: 'center',
    backgroundColor: currentTheme.colors.primaryLight + '20',
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.md,
    borderWidth: 2,
    borderColor: currentTheme.colors.primaryLight,
    lineHeight: currentTheme.typography.fontSizes.xl * 1.4,
  },
  feedbackContainer: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    marginBottom: currentTheme.spacing.base,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  correctFeedback: {
    color: currentTheme.colors.success,
  },
  incorrectFeedback: {
    color: currentTheme.colors.error,
  },
  correctAnswerText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.md,
    fontStyle: 'italic',
  },
  correctSentenceContainer: {
    backgroundColor: currentTheme.colors.primaryLight + '20',
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.base,
    marginVertical: currentTheme.spacing.sm,
    borderWidth: 1,
    borderColor: currentTheme.colors.primaryLight,
  },
  correctSentenceLabel: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    marginBottom: currentTheme.spacing.xs,
    textAlign: 'center',
  },
  correctSentenceText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    textAlign: 'center',
  },
  translationContainer: {
    backgroundColor: currentTheme.colors.success + '20',
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.base,
    marginVertical: currentTheme.spacing.sm,
    borderWidth: 1,
    borderColor: currentTheme.colors.success,
  },
  translationLabel: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    marginBottom: currentTheme.spacing.xs,
    textAlign: 'center',
  },
  translationText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.success,
    fontWeight: currentTheme.typography.fontWeights.medium,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.md,
    paddingHorizontal: currentTheme.spacing.xl,
    borderRadius: currentTheme.borderRadius.base,
    ...currentTheme.shadows.base,
  },
  nextButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  wordsContainer: {
    flex: 1,
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
  },
  wordsTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.lg,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: currentTheme.spacing.lg,
  },
  submitButton: {
    backgroundColor: currentTheme.colors.success,
    paddingVertical: currentTheme.spacing.md,
    paddingHorizontal: currentTheme.spacing.xl,
    borderRadius: currentTheme.borderRadius.md,
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  submitButtonDisabled: {
    backgroundColor: currentTheme.colors.buttonDisabled,
    opacity: 0.6,
  },
  submitButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  submitButtonTextDisabled: {
    color: currentTheme.colors.textSecondary,
  },
});

export default FillInTheBlankScreen;
