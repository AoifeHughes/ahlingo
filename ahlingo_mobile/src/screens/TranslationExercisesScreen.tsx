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
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo } from '../types';
import { RootState } from '../store';
import { WordButton, AnswerBox } from '../components';
import {
  getRandomTranslationExerciseForTopic,
  getTranslationExerciseData,
  getUserSettings,
  getMostRecentUser,
  getUserId,
  recordExerciseAttempt,
} from '../services/SimpleDatabaseService';
import { colors, spacing, borderRadius, shadows, typography } from '../utils/theme';

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
  const { topicId } = route.params || {};
  const { settings } = useSelector((state: RootState) => state.settings);

  // Safety check: if no topicId is provided, go back
  useEffect(() => {
    if (!topicId) {
      Alert.alert('Error', 'No topic selected. Please select a topic first.');
      navigation.goBack();
      return;
    }
  }, [topicId, navigation]);

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
    if (topicId) {
      loadTranslationData();
    }
  }, [topicId]);

  const loadTranslationData = async () => {
    try {
      setLoading(true);

      // Get user settings
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const language = userSettings.language || settings.language || 'French';
      const difficulty =
        userSettings.difficulty || settings.difficulty || 'Beginner';

      setUserLanguage(language);
      setUserDifficulty(difficulty);

      // Get random translation exercise for this topic
      const exercise = await getRandomTranslationExerciseForTopic(
        topicId,
        language,
        difficulty
      );

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
      } else {
        // Add word to selected
        return {
          ...prev,
          selectedWords: [...prev.selectedWords, { word, originalIndex }],
          targetWords: prev.targetWords.map(w =>
            w.originalIndex === originalIndex ? { ...w, isUsed: true } : w
          ),
        };
      }
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
    try {
      const username = await getMostRecentUser();
      const userId = await getUserId(username);
      if (userId && currentExercise) {
        await recordExerciseAttempt(userId, currentExercise.id, isCorrect);
      }
    } catch (error) {
      console.error('Failed to record exercise attempt:', error);
    }

    setGameState(prev => ({
      ...prev,
      hasSubmitted: true,
      isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const handleNextExercise = () => {
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
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading translation exercise...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with refresh button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Text style={styles.refreshButtonText}>🔄 New Exercise</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.nextButtonText}>Next Exercise</Text>
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

        {/* Submit button - always visible */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSizes.lg,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.xl,
    ...shadows.base,
  },
  refreshButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
  },
  sourceContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  sourceTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  sourceText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    textAlign: 'center',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primaryLight,
  },
  answerSection: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.base,
  },
  submitButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.base,
  },
  submitButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  submitButtonTextDisabled: {
    color: colors.textSecondary,
  },
  feedbackContainer: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  correctFeedback: {
    color: colors.success,
  },
  incorrectFeedback: {
    color: colors.error,
  },
  correctAnswerText: {
    fontSize: typography.fontSizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.base,
    ...shadows.base,
  },
  nextButtonText: {
    color: colors.background,
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  wordsContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  wordsTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
});

export default TranslationExercisesScreen;
