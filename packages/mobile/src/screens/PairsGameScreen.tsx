import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {Button} from 'react-native-elements';
import {useRoute, RouteProp} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationParams, GamePair, PairsGameLogic} from '@ahlingo/core';
import {useTheme} from '../components/ThemeProvider';
import {RootState} from '../store';
import {loadPairExercises} from '../store/slices/exerciseSlice';
import {
  initializeGame,
  selectPair,
  clearSelectionAfterDelay,
  resetGame,
} from '../store/slices/gameSlice';

type PairsGameRouteProp = RouteProp<NavigationParams, 'PairsGame'>;

interface PairButtonProps {
  pair: GamePair;
  isSelected: boolean;
  isMatched: boolean;
  onPress: () => void;
  disabled: boolean;
}

function PairButton({pair, isSelected, isMatched, onPress, disabled}: PairButtonProps) {
  const theme = useTheme();
  
  const getButtonStyle = () => {
    if (isMatched) {
      return {backgroundColor: theme.colors.success};
    }
    if (isSelected) {
      return {backgroundColor: theme.colors.warning};
    }
    return {backgroundColor: theme.colors.primary};
  };

  return (
    <TouchableOpacity
      style={[styles.pairButton, getButtonStyle()]}
      onPress={onPress}
      disabled={disabled || isMatched}
      activeOpacity={0.7}
    >
      <Text style={styles.pairButtonText}>
        {pair.leftText || pair.rightText}
      </Text>
    </TouchableOpacity>
  );
}

export function PairsGameScreen(): JSX.Element {
  const theme = useTheme();
  const route = useRoute<PairsGameRouteProp>();
  const dispatch = useDispatch();
  
  const {topicId} = route.params;
  
  const {pairExercises, isLoading} = useSelector((state: RootState) => state.exercise);
  const gameState = useSelector((state: RootState) => state.game);
  
  const [delayTimeout, setDelayTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load pair exercises when screen loads
    dispatch(loadPairExercises(topicId));
  }, [dispatch, topicId]);

  useEffect(() => {
    // Initialize game when exercises are loaded
    if (pairExercises.length > 0) {
      const initialGameState = PairsGameLogic.initializeGameState(pairExercises);
      dispatch(initializeGame(initialGameState));
    }
  }, [dispatch, pairExercises]);

  useEffect(() => {
    // Handle incorrect match delay
    if (gameState.isMatchCheckInProgress) {
      const timeout = setTimeout(() => {
        dispatch(clearSelectionAfterDelay());
      }, 1000);
      
      setDelayTimeout(timeout);
    } else if (delayTimeout) {
      clearTimeout(delayTimeout);
      setDelayTimeout(null);
    }

    return () => {
      if (delayTimeout) {
        clearTimeout(delayTimeout);
      }
    };
  }, [gameState.isMatchCheckInProgress, dispatch, delayTimeout]);

  useEffect(() => {
    // Check for game completion
    if (PairsGameLogic.isGameComplete(gameState)) {
      Alert.alert(
        'Congratulations!',
        `Game completed!\nCorrect: ${gameState.score.correct}\nIncorrect: ${gameState.score.incorrect}\nAccuracy: ${PairsGameLogic.getAccuracy(gameState).toFixed(1)}%`,
        [
          {text: 'Play Again', onPress: handleNewGame},
          {text: 'OK', style: 'default'},
        ]
      );
    }
  }, [gameState.matchedPairs.size, gameState.pairs.length]);

  const handlePairSelect = (pairId: number, isLeftSide: boolean) => {
    if (gameState.isMatchCheckInProgress) return;
    
    dispatch(selectPair({pairId, isLeftSide}));
  };

  const handleNewGame = () => {
    dispatch(loadPairExercises(topicId));
  };

  const handleRefresh = () => {
    const newGameState = PairsGameLogic.resetGame(gameState);
    dispatch(resetGame(newGameState));
  };

  if (isLoading || pairExercises.length === 0) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, {color: theme.colors.text}]}>
            {isLoading ? 'Loading exercises...' : 'No exercises available for this topic'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Game Header */}
      <View style={styles.gameHeader}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, {color: theme.colors.success}]}>
            Correct: {gameState.score.correct}
          </Text>
          <Text style={[styles.scoreText, {color: theme.colors.error}]}>
            Incorrect: {gameState.score.incorrect}
          </Text>
        </View>
        <Text style={[styles.progressText, {color: theme.colors.textSecondary}]}>
          {gameState.matchedPairs.size} / {gameState.pairs.length} matched
        </Text>
      </View>

      {/* Game Area */}
      <ScrollView style={styles.gameArea} contentContainerStyle={styles.gameContent}>
        <View style={styles.pairsContainer}>
          {/* Left Column */}
          <View style={styles.column}>
            <Text style={[styles.columnHeader, {color: theme.colors.text}]}>
              English
            </Text>
            {gameState.leftPairs.map((pair) => (
              <PairButton
                key={`left-${pair.id}`}
                pair={pair}
                isSelected={pair.leftSelected}
                isMatched={pair.matched}
                onPress={() => handlePairSelect(pair.id, true)}
                disabled={gameState.isMatchCheckInProgress}
              />
            ))}
          </View>

          {/* Right Column */}
          <View style={styles.column}>
            <Text style={[styles.columnHeader, {color: theme.colors.text}]}>
              French
            </Text>
            {gameState.rightPairs.map((pair) => (
              <PairButton
                key={`right-${pair.id}`}
                pair={pair}
                isSelected={pair.rightSelected}
                isMatched={pair.matched}
                onPress={() => handlePairSelect(pair.id, false)}
                disabled={gameState.isMatchCheckInProgress}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Game Controls */}
      <View style={styles.controlsContainer}>
        <Button
          title="New Game"
          onPress={handleNewGame}
          buttonStyle={[styles.controlButton, {backgroundColor: theme.colors.primary}]}
          titleStyle={styles.controlButtonText}
        />
        <Button
          title="Shuffle"
          onPress={handleRefresh}
          buttonStyle={[styles.controlButton, {backgroundColor: theme.colors.secondary}]}
          titleStyle={styles.controlButtonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
  },
  gameHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressText: {
    fontSize: 14,
  },
  gameArea: {
    flex: 1,
  },
  gameContent: {
    padding: 16,
  },
  pairsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 8,
  },
  columnHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    padding: 8,
  },
  pairButton: {
    padding: 16,
    marginVertical: 4,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pairButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});