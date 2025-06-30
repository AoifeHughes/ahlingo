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
import { RootStackParamList, PairExercise, ExerciseInfo } from '../types';
import { RootState } from '../store';
import PairButton from '../components/PairButton';
import {
  getRandomExerciseForTopic,
  getPairExercises,
  getUserSettings,
  getMostRecentUser,
  getUserId,
  recordExerciseAttempt,
} from '../services/SimpleDatabaseService';

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
  const { topicId } = route.params;
  const { settings } = useSelector((state: RootState) => state.settings);
  
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState<ExerciseInfo | null>(null);
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
  }, [topicId]);

  const loadGameData = async () => {
    try {
      setLoading(true);
      
      // Get user settings
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const language = userSettings.language || settings.language || 'French';
      const difficulty = userSettings.difficulty || settings.difficulty || 'Beginner';
      
      setUserLanguage(language);
      setUserDifficulty(difficulty);
      
      // Get random exercise for this topic
      const exercise = await getRandomExerciseForTopic(topicId, language, difficulty);
      
      if (!exercise) {
        Alert.alert('Error', 'No exercises found for this topic.');
        navigation.goBack();
        return;
      }
      
      setCurrentExercise(exercise);
      
      // Get pairs for this exercise
      const exercisePairs = await getPairExercises(exercise.id);
      
      if (exercisePairs.length === 0) {
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
    if (gameState.selectedLeft !== null && gameState.selectedRight !== null && !isProcessingMatch) {
      checkMatch();
    }
  }, [gameState.selectedLeft, gameState.selectedRight]);

  const checkMatch = async () => {
    if (gameState.selectedLeft === null || gameState.selectedRight === null) return;
    
    setIsProcessingMatch(true);
    
    if (gameState.selectedLeft === gameState.selectedRight) {
      // Correct match!
      const newMatchedPairs = [...gameState.matchedPairs, gameState.selectedLeft!];
      
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
        try {
          const username = await getMostRecentUser();
          const userId = await getUserId(username);
          if (userId && currentExercise) {
            // Exercise is considered successful if user completed it
            await recordExerciseAttempt(userId, currentExercise.id, true);
          }
        } catch (error) {
          console.error('Failed to record exercise completion:', error);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading game...</Text>
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
      
      {/* Score display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Correct: {gameState.correctCount}</Text>
        <Text style={styles.scoreText}>Incorrect: {gameState.incorrectCount}</Text>
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
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 12,
    marginBottom: 1,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  gameContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
  },
});

export default PairsGameScreen;