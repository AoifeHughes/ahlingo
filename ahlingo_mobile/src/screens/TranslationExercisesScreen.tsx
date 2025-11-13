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
  SafeAreaView,
} from 'react-native';
import { RouteProp, useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo } from '../types';
import { RootState } from '../store';
import { WordButton, AnswerBox } from '../components';
import {
  getRandomTranslationExerciseForTopic,
  getTranslationExerciseData,
  getUserContext,
  recordExerciseAttemptForCurrentUser,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';
import TTSService from '../services/TTSService';

type TranslationExercisesScreenRouteProp = RouteProp<
  RootStackParamList,
  'TranslationExercises'
>;
type TranslationExercisesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'TranslationExercises'
>;

interface Props {
  route: TranslationExercisesScreenRouteProp;
  navigation: TranslationExercisesScreenNavigationProp;
}

interface TranslationExercise {
  language_1_content: string;
  language_2_content: string;
}

interface WordState {
  word: string;
  originalIndex: number;
  isUsed: boolean;
}

interface GameState {
  sourceText: string;
  targetWords: WordState[];
  selectedWords: Array<{ word: string; originalIndex: number }>;
  correctAnswer: string;
  hasSubmitted: boolean;
  isCorrect: boolean | null;
  score: number;
}

const TranslationExercisesScreen: React.FC<Props> = ({ route, navigation }) => {
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
  const [currentExercise, setCurrentExercise] = useState<ExerciseInfo | null>(
    null
  );
  const [translationData, setTranslationData] = useState<TranslationExercise[]>(
    []
  );
  const [gameState, setGameState] = useState<GameState>({
    sourceText: '',
    targetWords: [],
    selectedWords: [],
    correctAnswer: '',
    hasSubmitted: false,
    isCorrect: null,
    score: 0,
  });
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');

  useEffect(() => {
    if (topicId || exerciseInfo) {
      loadTranslationData();
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

  const loadTranslationData = async () => {
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
        // Get random translation exercise for this topic (prioritizing untried exercises)
        exercise = await getRandomTranslationExerciseForTopic(
          topicId,
          language,
          difficulty,
          userContext.userId
        );
      }

      if (!exercise) {
        setLoading(false);
        Alert.alert('Error', 'No translation exercises found for this topic.');
        navigation.goBack();
        return;
      }

      setCurrentExercise(exercise);

      // Get translation data for this exercise
      const exerciseData = await getTranslationExerciseData(exercise.id);
      setTranslationData(exerciseData);

      // Set up the game with the first translation pair
      if (exerciseData.length > 0) {
        setupGame(exerciseData[0]);
      }
    } catch (error) {
      console.error('Failed to load translation data:', error);
      Alert.alert(
        'Error',
        'Failed to load translation exercise. Please try again.'
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Clean text to handle spacing issues around punctuation
  const cleanText = (text: string): string => {
    return (
      text
        // Attach punctuation to the preceding word (remove spaces before punctuation)
        .replace(/\s+([.,!?;:])/g, '$1')
        // Normalize multiple spaces to single space
        .replace(/\s+/g, ' ')
        // Trim leading and trailing spaces
        .trim()
    );
  };

  const setupGame = (translation: TranslationExercise) => {
    const sourceText = cleanText(translation.language_1_content);
    const correctAnswer = cleanText(translation.language_2_content);

    // Split the target sentence into words and shuffle them
    const words = correctAnswer.split(' ').filter(word => word.trim() !== '');
    const wordStates: WordState[] = words.map((word, index) => ({
      word: cleanText(word), // Keep punctuation as part of the word
      originalIndex: index,
      isUsed: false,
    }));

    // Shuffle the words
    const shuffledWords = [...wordStates].sort(() => Math.random() - 0.5);

    setGameState({
      sourceText,
      targetWords: shuffledWords,
      selectedWords: [],
      correctAnswer,
      hasSubmitted: false,
      isCorrect: null,
      score: 0,
    });
  };

  const handleRefresh = () => {
    loadTranslationData();
  };

  const handleWordPress = (word: string, originalIndex: number) => {
    setGameState(prev => {
      const wordInSelected = prev.selectedWords.find(
        w => w.originalIndex === originalIndex
      );

      if (wordInSelected) {
        // Remove word from selected
        return {
          ...prev,
          selectedWords: prev.selectedWords.filter(
            w => w.originalIndex !== originalIndex
          ),
          targetWords: prev.targetWords.map(w =>
            w.originalIndex === originalIndex ? { ...w, isUsed: false } : w
          ),
        };
      }

      // Speak the word in the target language only when it is added
      TTSService.speakWithLanguageDetection(word, userLanguage);

      // Add word to selected
      return {
        ...prev,
        selectedWords: [...prev.selectedWords, { word, originalIndex }],
        targetWords: prev.targetWords.map(w =>
          w.originalIndex === originalIndex ? { ...w, isUsed: true } : w
        ),
      };
    });
  };

  const handleSubmit = async () => {
    const userAnswer = gameState.selectedWords.map(w => w.word).join(' ');
    const correctAnswer = gameState.correctAnswer;

    // Clean both answers for comparison (punctuation is now part of words)
    const cleanUserAnswer = cleanText(userAnswer);
    const cleanCorrectAnswer = cleanText(correctAnswer);

    const isCorrect =
      cleanUserAnswer.toLowerCase().trim() ===
      cleanCorrectAnswer.toLowerCase().trim();

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

    // Handle shuffle mode completion - don't auto-transition
    if (shuffleContext) {
      // Don't auto-transition in shuffle mode - let user manually proceed
      // The transition will happen when they press the next button in the UI
    }
  };

  const handleNextExercise = () => {
    if (shuffleContext && gameState.hasSubmitted) {
      // In shuffle mode, proceed to next exercise in shuffle
      shuffleContext.onComplete(gameState.isCorrect || false);
    } else {
      // In normal mode, load a new exercise
      if (translationData.length > 1) {
        // Get a random different exercise from the current data
        const otherExercises = translationData.filter(
          (_, index) =>
            index !==
            translationData.findIndex(
              t => t.language_1_content === gameState.sourceText
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
      loadTranslationData();
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading translation exercise...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header with refresh button - hidden in shuffle mode */}
        {!shuffleContext && (
          <View style={styles.header}>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Text style={styles.refreshButtonText}>🔄 New Exercise</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.contentWrapper}>
          {/* Source text */}
          <View style={styles.sourceContainer}>
            <Text style={styles.sourceTitle}>Translate this sentence:</Text>
            <Text style={styles.sourceText}>{gameState.sourceText}</Text>
          </View>

          {/* Answer box */}
          <View style={styles.answerSection}>
            <AnswerBox
              selectedWords={gameState.selectedWords}
              onWordRemove={handleWordPress}
            />

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
                      : 'Next Exercise'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Word selection area */}
          <View style={styles.wordsContainer}>
            <Text style={styles.wordsTitle}>
              Tap words to build your translation:
            </Text>
            <View style={styles.wordsGrid}>
              {gameState.targetWords.map((wordState, index) => (
                <WordButton
                  key={`${wordState.originalIndex}-${index}`}
                  word={wordState.word}
                  index={wordState.originalIndex}
                  isSelected={wordState.isUsed}
                  onPress={handleWordPress}
                  disabled={gameState.hasSubmitted}
                />
              ))}
            </View>
          </View>
        </View>

        <View style={styles.submitWrapper}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              (gameState.targetWords.length === 0 ||
                gameState.targetWords.some(word => !word.isUsed) ||
                gameState.hasSubmitted) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              gameState.targetWords.length === 0 ||
              gameState.targetWords.some(word => !word.isUsed) ||
              gameState.hasSubmitted
            }
          >
            <Text
              style={[
                styles.submitButtonText,
                (gameState.targetWords.length === 0 ||
                  gameState.targetWords.some(word => !word.isUsed) ||
                  gameState.hasSubmitted) &&
                  styles.submitButtonTextDisabled,
              ]}
            >
              Submit Translation
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
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
    contentWrapper: {
      flex: 1,
    },
    sourceContainer: {
      backgroundColor: currentTheme.colors.surface,
      padding: currentTheme.spacing.lg,
      marginBottom: currentTheme.spacing.base,
    },
    sourceTitle: {
      fontSize: currentTheme.typography.fontSizes.lg,
      fontWeight: currentTheme.typography.fontWeights.semibold,
      color: currentTheme.colors.text,
      textAlign: 'center',
      marginBottom: currentTheme.spacing.md,
    },
    sourceText: {
      fontSize: currentTheme.typography.fontSizes.xl,
      fontWeight: currentTheme.typography.fontWeights.bold,
      color: currentTheme.colors.primary,
      textAlign: 'center',
      backgroundColor: currentTheme.colors.primaryLight + '20',
      padding: currentTheme.spacing.lg,
      borderRadius: currentTheme.borderRadius.md,
      borderWidth: 2,
      borderColor: currentTheme.colors.primaryLight,
    },
    answerSection: {
      backgroundColor: currentTheme.colors.surface,
      padding: currentTheme.spacing.lg,
      marginBottom: currentTheme.spacing.base,
      borderRadius: currentTheme.borderRadius.base,
      flexShrink: 0,
    },
    submitButton: {
      backgroundColor: currentTheme.colors.success,
      paddingVertical: currentTheme.spacing.md,
      paddingHorizontal: currentTheme.spacing.xl,
      borderRadius: currentTheme.borderRadius.md,
      alignItems: 'center',
      marginTop: currentTheme.spacing.lg,
      width: '100%',
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
    feedbackContainer: {
      marginTop: currentTheme.spacing.lg,
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
    },
    submitWrapper: {
      borderTopWidth: 1,
      borderTopColor: currentTheme.colors.border,
      backgroundColor: currentTheme.colors.surface,
      padding: currentTheme.spacing.lg,
    },
  });

export default TranslationExercisesScreen;
