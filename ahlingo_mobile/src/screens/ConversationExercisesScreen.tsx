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
import { RouteProp } from '@react-navigation/native';
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
  getUserSettings,
  getMostRecentUser,
  getUserId,
  recordExerciseAttempt,
} from '../services/SimpleDatabaseService';

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
    if (topicId) {
      loadConversationData();
    }
  }, [topicId]);

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

      // Get user settings
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const language = userSettings.language || settings.language || 'French';
      const difficulty =
        userSettings.difficulty || settings.difficulty || 'Beginner';

      setUserLanguage(language);
      setUserDifficulty(difficulty);

      // Get user ID for prioritizing untried exercises
      const userId = await getUserId(username);

      // Get random conversation exercise for this topic (prioritizing untried exercises)
      const exercise = await getRandomConversationExerciseForTopic(
        topicId,
        language,
        difficulty,
        userId
      );

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

  const handleOptionPress = async (optionIndex: number) => {
    if (quizState.hasAnswered) return;

    const selectedAnswer = quizState.options[optionIndex];
    const isCorrect = selectedAnswer === quizState.correctAnswer;

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

    setQuizState(prev => ({
      ...prev,
      selectedOption: optionIndex,
      hasAnswered: true,
      isCorrect,
      score: isCorrect ? prev.score + 1 : prev.score,
    }));
  };

  const handleNextExercise = () => {
    loadConversationData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading conversation exercise...</Text>
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

      {/* Conversation display */}
      <View style={styles.conversationContainer}>
        {conversationData.length > 0 ? (
          <ConversationView messages={conversationData} />
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
              <Text style={styles.nextButtonText}>Next Exercise</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
  header: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationContainer: {
    flex: 1.2,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  quizContainer: {
    flex: 1.8,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  quizSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  selectedOption: {
    borderColor: '#1976D2',
    backgroundColor: '#e3f2fd',
  },
  correctOption: {
    borderColor: '#4caf50',
    backgroundColor: '#e8f5e8',
  },
  incorrectOption: {
    borderColor: '#f44336',
    backgroundColor: '#ffebee',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  selectedOptionText: {
    color: '#1976D2',
    fontWeight: '600',
  },
  correctOptionText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  feedbackContainer: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  correctFeedback: {
    color: '#4caf50',
  },
  incorrectFeedback: {
    color: '#f44336',
  },
  nextButton: {
    backgroundColor: '#1976D2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ConversationExercisesScreen;
