import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useEffect } from 'react';
import { 
  selectPair, 
  clearSelections, 
  resetGame, 
  initializeGame,
  loadPairExercises,
  setCurrentTopic 
} from '../store';
import { PairsGameLogic } from '../services/gameLogic';
import { Topic, GamePair } from '../../types';

interface UsePairsGameReturn {
  // Game state
  leftPairs: GamePair[];
  rightPairs: GamePair[];
  selectedLeft?: number;
  selectedRight?: number;
  matchedPairs: number[];
  score: { correct: number; incorrect: number };
  isLoading: boolean;
  error?: string;
  isGameComplete: boolean;
  
  // Actions
  selectLeftPair: (id: number) => void;
  selectRightPair: (id: number) => void;
  startNewGame: (topicId: number) => void;
  resetCurrentGame: () => void;
}

export function usePairsGame(): UsePairsGameReturn {
  const dispatch = useDispatch();
  
  // Select state from both core exercise slice and platform-specific game slice
  const exerciseState = useSelector((state: any) => state.exercise);
  const gameState = useSelector((state: any) => state.game);
  
  // Get game pairs from exercise data
  const gamePairs = gameState.pairs || [];
  
  // Use pre-shuffled pairs if available (mobile), otherwise create them (desktop)
  let leftPairs, rightPairs;
  if (gameState.leftPairs && gameState.rightPairs) {
    // Mobile: use pre-shuffled pairs from game state
    leftPairs = gameState.leftPairs;
    rightPairs = gameState.rightPairs;
  } else {
    // Desktop: create pairs on demand (for platforms without pre-shuffled state)
    const shuffledPairs = PairsGameLogic.createGamePairs(gamePairs);
    leftPairs = shuffledPairs.leftPairs;
    rightPairs = shuffledPairs.rightPairs;
  }
  
  // Check if game is complete
  const isGameComplete = gamePairs.length > 0 && gameState.matchedPairs.length === gamePairs.length;
  
  // Actions
  const selectLeftPair = useCallback((id: number) => {
    if (gameState.selectedLeft === id) {
      dispatch(clearSelections());
    } else {
      dispatch(selectPair({ pairId: id, isLeftSide: true }));
    }
  }, [dispatch, gameState.selectedLeft]);
  
  const selectRightPair = useCallback((id: number) => {
    if (gameState.selectedRight === id) {
      dispatch(clearSelections());
    } else {
      dispatch(selectPair({ pairId: id, isLeftSide: false }));
    }
  }, [dispatch, gameState.selectedRight]);
  
  const startNewGame = useCallback(async (topicId: number) => {
    try {
      // Load exercises for the topic
      const result = await dispatch(loadPairExercises(topicId) as any);
      
      if (result.payload && Array.isArray(result.payload)) {
        // Create initial game state from loaded exercises
        const gameState = PairsGameLogic.initializeGameState(result.payload);
        dispatch(initializeGame(gameState));
      }
    } catch (error) {
      console.error('Failed to start new game:', error);
    }
  }, [dispatch]);
  
  const resetCurrentGame = useCallback(() => {
    dispatch(resetGame());
  }, [dispatch]);
  
  // Auto-check for matches when both sides are selected
  useEffect(() => {
    if (gameState.selectedLeft !== undefined && gameState.selectedRight !== undefined) {
      const isMatch = PairsGameLogic.checkMatch(
        gameState.selectedLeft,
        gameState.selectedRight,
        gamePairs
      );
      
      if (isMatch) {
        // Match found - this will be handled by the game slice reducer
        setTimeout(() => {
          dispatch(clearSelections());
        }, 1000); // Show match for 1 second
      } else {
        // No match - clear selections after a delay
        setTimeout(() => {
          dispatch(clearSelections());
        }, 1500);
      }
    }
  }, [gameState.selectedLeft, gameState.selectedRight, dispatch, gamePairs]);
  
  return {
    // State - use pre-processed pairs if available, otherwise apply state updates
    leftPairs: gameState.leftPairs && gameState.rightPairs ? 
      leftPairs : // Mobile: use pre-processed pairs with states already applied
      leftPairs.map((pair: any) => ({ // Desktop: apply states manually
        ...pair,
        leftSelected: pair.id === gameState.selectedLeft,
        rightSelected: false,
        matched: gameState.matchedPairs.includes(pair.id)
      })),
    rightPairs: gameState.leftPairs && gameState.rightPairs ?
      rightPairs : // Mobile: use pre-processed pairs with states already applied  
      rightPairs.map((pair: any) => ({ // Desktop: apply states manually
        ...pair,
        leftSelected: false,
        rightSelected: pair.id === gameState.selectedRight,
        matched: gameState.matchedPairs.includes(pair.id)
      })),
    selectedLeft: gameState.selectedLeft,
    selectedRight: gameState.selectedRight,
    matchedPairs: gameState.matchedPairs,
    score: gameState.score,
    isLoading: exerciseState.isLoading || gameState.isLoading,
    error: exerciseState.error || gameState.error,
    isGameComplete,
    
    // Actions
    selectLeftPair,
    selectRightPair,
    startNewGame,
    resetCurrentGame,
  };
}