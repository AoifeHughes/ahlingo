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
import { RootStackParamList, PairExercise, ExerciseInfo } from '../types';
import { RootState } from '../store';
import PairButton from '../components/PairButton';
import {
  getRandomExerciseForTopic,
  getPairExercises,
  getUserContext,
  recordExerciseAttemptForCurrentUser,
} from '../services/RefactoredDatabaseService';
import { useTheme } from '../contexts/ThemeContext';

type PairsGameScreenRouteProp = RouteProp<RootStackParamList, 'PairsGame'>;
type PairsGameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PairsGame'
>;

interface Props {
  route: PairsGameScreenRouteProp;
  navigation: PairsGameScreenNavigationProp;
}

interface PairItem {
  text: string;
  pairId: number;
  originalIndex: number;
}

interface GameState {
  selectedLeft: number | null;
  selectedRight: number | null;
  matchedPairs: number[];
  correctCount: number;
  incorrectCount: number;
}

const PairsGameScreen: React.FC<Props> = ({ route, navigation }) => {
  const { topicId, shuffleContext, exerciseInfo } = route.params;
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<ExerciseInfo | null>(
    null
  );
  const [pairs, setPairs] = useState<PairExercise[]>([]);
  const [leftColumn, setLeftColumn] = useState<PairItem[]>([]);
  const [rightColumn, setRightColumn] = useState<PairItem[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    selectedLeft: null,
    selectedRight: null,
    matchedPairs: [],
    correctCount: 0,
    incorrectCount: 0,
  });
  const [userLanguage, setUserLanguage] = useState<string>('French');
  const [userDifficulty, setUserDifficulty] = useState<string>('Beginner');
  const [isProcessingMatch, setIsProcessingMatch] = useState(false);

  useEffect(() => {
    loadGameData();
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

  const loadGameData = async () => {
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
        // Get random exercise for this topic (prioritizing untried exercises)
        exercise = await getRandomExerciseForTopic(
          topicId,
          language,
          difficulty,
          userContext.userId
        );
      }

      if (!exercise) {
        setLoading(false);
        Alert.alert('Error', 'No exercises found for this topic.');
        navigation.goBack();
        return;
      }

      setCurrentExercise(exercise);

      // Get pairs for this exercise
      const exercisePairs = await getPairExercises(exercise.id);

      if (exercisePairs.length === 0) {
        setLoading(false);
        Alert.alert('Error', 'No pairs found for this exercise.');
        navigation.goBack();
        return;
      }

      setupGame(exercisePairs);
    } catch (error) {
      console.error('Failed to load game data:', error);
      Alert.alert('Error', 'Failed to load game. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const setupGame = (exercisePairs: PairExercise[]) => {
    setPairs(exercisePairs);

    // Create left and right column items
    const leftItems: PairItem[] = exercisePairs.map((pair, index) => ({
      text: pair.language_1_content,
      pairId: index,
      originalIndex: index,
    }));

    const rightItems: PairItem[] = exercisePairs.map((pair, index) => ({
      text: pair.language_2_content,
      pairId: index,
      originalIndex: index,
    }));

    // Shuffle both columns independently
    const shuffleArray = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    setLeftColumn(shuffleArray(leftItems));
    setRightColumn(shuffleArray(rightItems));

    // Reset game state
    setGameState({
      selectedLeft: null,
      selectedRight: null,
      matchedPairs: [],
      correctCount: 0,
      incorrectCount: 0,
    });
  };

  const handleButtonPress = async (pairId: number, column: number) => {
    if (isProcessingMatch) return;

    setGameState(prevState => {
      const newState = { ...prevState };

      if (column === 0) {
        // Left column
        if (newState.selectedLeft === pairId) {
          // Deselect if already selected
          newState.selectedLeft = null;
        } else {
          // Select this button
          newState.selectedLeft = pairId;
        }
      } else {
        // Right column
        if (newState.selectedRight === pairId) {
          // Deselect if already selected
          newState.selectedRight = null;
        } else {
          // Select this button
          newState.selectedRight = pairId;
        }
      }

      return newState;
    });
  };

  // Check for matches whenever selections change
  useEffect(() => {
    if (
      gameState.selectedLeft !== null &&
      gameState.selectedRight !== null &&
      !isProcessingMatch
    ) {
      checkMatch();
    }
  }, [gameState.selectedLeft, gameState.selectedRight]);

  const checkMatch = async () => {
    if (gameState.selectedLeft === null || gameState.selectedRight === null)
      return;

    setIsProcessingMatch(true);

    if (gameState.selectedLeft === gameState.selectedRight) {
      // Correct match!
      const newMatchedPairs = [
        ...gameState.matchedPairs,
        gameState.selectedLeft!,
      ];

      setGameState(prevState => ({
        ...prevState,
        matchedPairs: newMatchedPairs,
        correctCount: prevState.correctCount + 1,
        selectedLeft: null,
        selectedRight: null,
      }));

      // Check if all pairs are matched (exercise completed)
      if (newMatchedPairs.length === pairs.length) {
        // Record exercise completion
        if (currentExercise) {
          // Exercise is considered successful only if user had no incorrect attempts
          const isSuccessful = gameState.incorrectCount === 0;
          await recordExerciseAttemptForCurrentUser(currentExercise.id, isSuccessful);
        }

        // Handle shuffle mode completion
        if (shuffleContext) {
          // Don't auto-transition in shuffle mode - let user manually proceed
          // The transition will happen when they press the next button in the UI
        }
      }
    } else {
      // Incorrect match
      setGameState(prevState => ({
        ...prevState,
        incorrectCount: prevState.incorrectCount + 1,
      }));

      // Reset selection after 1 second delay
      setTimeout(() => {
        setGameState(prevState => ({
          ...prevState,
          selectedLeft: null,
          selectedRight: null,
        }));
      }, 1000);
    }

    setIsProcessingMatch(false);
  };

  const handleRefresh = () => {
    loadGameData();
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading game...</Text>
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

      {/* Next exercise button for shuffle mode when completed */}
      {shuffleContext && gameState.matchedPairs.length === pairs.length && pairs.length > 0 && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={[styles.refreshButton, { backgroundColor: gameState.incorrectCount === 0 ? theme.colors.success : theme.colors.primary }]} 
            onPress={() => {
              const isSuccessful = gameState.incorrectCount === 0;
              shuffleContext.onComplete(isSuccessful);
            }}
          >
            <Text style={styles.refreshButtonText}>
              {gameState.incorrectCount === 0 ? '✅ Perfect! Next Exercise' : '➡️ Next Exercise'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Score display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Correct: {gameState.correctCount}</Text>
        <Text style={styles.scoreText}>
          Incorrect: {gameState.incorrectCount}
        </Text>
      </View>

      {/* Game area */}
      <View style={styles.gameContainer}>
        {/* Left column */}
        <View style={styles.column}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {leftColumn.map((item, index) => (
              <PairButton
                key={`left-${index}`}
                text={item.text}
                pairId={item.pairId}
                column={0}
                selected={gameState.selectedLeft === item.pairId}
                matched={gameState.matchedPairs.includes(item.pairId)}
                onPress={handleButtonPress}
              />
            ))}
          </ScrollView>
        </View>

        {/* Right column */}
        <View style={styles.column}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {rightColumn.map((item, index) => (
              <PairButton
                key={`right-${index}`}
                text={item.text}
                pairId={item.pairId}
                column={1}
                selected={gameState.selectedRight === item.pairId}
                matched={gameState.matchedPairs.includes(item.pairId)}
                onPress={handleButtonPress}
              />
            ))}
          </ScrollView>
        </View>
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
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: currentTheme.colors.surface,
    paddingVertical: currentTheme.spacing.md,
    marginBottom: 1,
  },
  scoreText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
  },
  gameContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    paddingHorizontal: currentTheme.spacing.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: currentTheme.spacing.lg,
  },
});

export default PairsGameScreen;
