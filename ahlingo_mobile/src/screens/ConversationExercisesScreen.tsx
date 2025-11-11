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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect, usePreventRemove } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseInfo } from '../types';
import { RootState } from '../store';
import { ConversationView } from '../components';
import {
  getRandomConversationExerciseForTopic,
  getConversationExerciseData,
  getConversationSummary,
  getRandomConversationSummaries,
  getTopicNameForExercise,
  getUserContext,
  recordExerciseAttemptForCurrentUser,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';
import TTSService from '../services/TTSService';

type ConversationExercisesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConversationExercises'
>;

type ConversationExercisesScreenRouteProp = RouteProp<
  RootStackParamList,
  'ConversationExercises'
>;

interface Props {
  navigation: ConversationExercisesScreenNavigationProp;
  route: ConversationExercisesScreenRouteProp;
}

interface ConversationMessage {
  speaker: string;
  message: string;
  conversation_order: number;
}

interface QuizState {
  correctAnswer: string;
  options: string[];
  selectedOption: number | null;
  hasAnswered: boolean;
  isCorrect: boolean | null;
  score: number;
}

const ConversationExercisesScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
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
  const [conversationData, setConversationData] = useState<
    ConversationMessage[]
  >([]);
  const [quizState, setQuizState] = useState<QuizState>({
    correctAnswer: '',
    options: [],
    selectedOption: null,
    hasAnswered: false,
    isCorrect: null,
    score: 0,
  });
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');
  const [topicName, setTopicName] = useState<string>('');

  useEffect(() => {
    if (topicId || exerciseInfo) {
      loadConversationData();
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

  const loadConversationData = async () => {
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
        // Get random conversation exercise for this topic (prioritizing untried exercises)
        exercise = await getRandomConversationExerciseForTopic(
          topicId,
          language,
          difficulty,
          userContext.userId
        );
      }

      if (!exercise) {
        setLoading(false);
        Alert.alert('Error', 'No conversation exercises found for this topic.');
        navigation.goBack();
        return;
      }

      setCurrentExercise(exercise);

      // Get conversation data for this exercise
      const exerciseData = await getConversationExerciseData(exercise.id);

      // Clean the conversation messages
      const cleanedData = exerciseData.map(msg => ({
        ...msg,
        message: cleanText(msg.message),
        speaker: cleanText(msg.speaker),
      }));

      setConversationData(cleanedData);

      // Get topic name
      const topicNameResult = await getTopicNameForExercise(exercise.id);
      setTopicName(topicNameResult || 'Unknown Topic');

      // Get the correct answer and wrong options
      const correctSummary = await getConversationSummary(exercise.id);
      const wrongSummaries = await getRandomConversationSummaries(
        exercise.id,
        2
      );

      if (correctSummary && wrongSummaries.length >= 2) {
        // Clean all summaries
        const cleanCorrectSummary = cleanText(correctSummary);
        const cleanWrongSummaries = wrongSummaries.map(summary =>
          cleanText(summary)
        );

        // Create options array with correct answer in random position
        const options = [cleanCorrectSummary, ...cleanWrongSummaries];
        const shuffledOptions = options.sort(() => Math.random() - 0.5);

        setQuizState(prev => ({
          ...prev,
          correctAnswer: cleanCorrectSummary,
          options: shuffledOptions,
          selectedOption: null,
          hasAnswered: false,
          isCorrect: null,
        }));
      }
    } catch (error) {
      console.error('Failed to load conversation data:', error);
      Alert.alert(
        'Error',
        'Failed to load conversation exercise. Please try again.'
      );
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadConversationData();
  };

  const handleSpeak = useCallback((message: string) => {
    // Speak the message in the user's target language
    TTSService.speakWithLanguageDetection(message, userLanguage);
  }, [userLanguage]);

  const handleOptionPress = async (optionIndex: number) => {
    if (quizState.hasAnswered) return;

    const selectedAnswer = quizState.options[optionIndex];
    const isCorrect = selectedAnswer === quizState.correctAnswer;

    // Record the exercise attempt
    if (currentExercise) {
      await recordExerciseAttemptForCurrentUser(currentExercise.id, isCorrect);
    }

    setQuizState(prev => ({
      ...prev,
      selectedOption: optionIndex,
      hasAnswered: true,
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
    if (shuffleContext && quizState.hasAnswered) {
      // In shuffle mode, proceed to next exercise in shuffle
      shuffleContext.onComplete(quizState.isCorrect || false);
    } else {
      // In normal mode, load a new exercise
      loadConversationData();
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading conversation exercise...</Text>
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

      {/* Conversation display */}
      <View style={styles.conversationContainer}>
        {conversationData.length > 0 ? (
          <ConversationView messages={conversationData} onSpeak={handleSpeak} />
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No conversation data available
            </Text>
          </View>
        )}
      </View>

      {/* Quiz section */}
      <View style={styles.quizContainer}>
        <Text style={styles.quizTitle}>What is this conversation about?</Text>
        <Text style={styles.quizSubtitle}>Choose the best summary:</Text>

        <ScrollView
          style={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {quizState.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                quizState.selectedOption === index && styles.selectedOption,
                quizState.hasAnswered &&
                  option === quizState.correctAnswer &&
                  styles.correctOption,
                quizState.hasAnswered &&
                  quizState.selectedOption === index &&
                  option !== quizState.correctAnswer &&
                  styles.incorrectOption,
              ]}
              onPress={() => handleOptionPress(index)}
              disabled={quizState.hasAnswered}
            >
              <Text
                style={[
                  styles.optionText,
                  quizState.selectedOption === index &&
                    styles.selectedOptionText,
                  quizState.hasAnswered &&
                    option === quizState.correctAnswer &&
                    styles.correctOptionText,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Feedback */}
        {quizState.hasAnswered && (
          <View style={styles.feedbackContainer}>
            <Text
              style={[
                styles.feedbackText,
                quizState.isCorrect
                  ? styles.correctFeedback
                  : styles.incorrectFeedback,
              ]}
            >
              {quizState.isCorrect ? '✅ Correct!' : '❌ Incorrect. Try again!'}
            </Text>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextExercise}
            >
              <Text style={styles.nextButtonText}>
                {shuffleContext
                  ? (quizState.isCorrect ? '✅ Perfect! Next Exercise' : '➡️ Next Exercise')
                  : 'Next Exercise'
                }
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  conversationContainer: {
    flex: 1.2,
    backgroundColor: currentTheme.colors.surface,
    marginBottom: currentTheme.spacing.base,
  },
  quizContainer: {
    flex: 1.8,
    backgroundColor: currentTheme.colors.surface,
    paddingHorizontal: currentTheme.spacing.lg,
    paddingTop: currentTheme.spacing.base,
  },
  quizTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xs,
  },
  quizSubtitle: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.md,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: currentTheme.colors.background,
    borderWidth: 2,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.md,
    marginBottom: currentTheme.spacing.base,
  },
  selectedOption: {
    borderColor: currentTheme.colors.primary,
    backgroundColor: currentTheme.colors.primaryLight,
  },
  correctOption: {
    borderColor: currentTheme.colors.success,
    backgroundColor: currentTheme.colors.successLight,
  },
  incorrectOption: {
    borderColor: currentTheme.colors.error,
    backgroundColor: currentTheme.colors.errorLight,
  },
  optionText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
    lineHeight: 22,
  },
  selectedOptionText: {
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  correctOptionText: {
    color: currentTheme.colors.success,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  feedbackContainer: {
    paddingVertical: currentTheme.spacing.md,
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
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: currentTheme.spacing['2xl'],
  },
  noDataText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ConversationExercisesScreen;
