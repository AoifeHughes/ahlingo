import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  gameSlice as coreGameSlice,
  CoreGameState,
  PairsGameLogic,
  PairGameState,
  GamePair
} from '@ahlingo/core';

interface MobileGameState extends CoreGameState {
  leftPairs: GamePair[];
  rightPairs: GamePair[];
  isMatchCheckInProgress: boolean;
  showCompletionModal: boolean;
}

const initialState: MobileGameState = {
  pairs: [],
  selectedLeft: undefined,
  selectedRight: undefined,
  matchedPairs: [],
  score: {
    correct: 0,
    incorrect: 0,
  },
  currentExercise: undefined,
  isLoading: false,
  error: undefined,
  leftPairs: [],
  rightPairs: [],
  isMatchCheckInProgress: false,
  showCompletionModal: false,
};

const mobileGameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Override initializeGame to include mobile-specific UI setup
    initializeGame: (state, action: PayloadAction<PairGameState>) => {
      const gameState = action.payload;
      Object.assign(state, gameState);
      
      // Create shuffled pairs for mobile UI
      const { leftPairs, rightPairs } = PairsGameLogic.createGamePairs(gameState.pairs);
      state.leftPairs = leftPairs;
      state.rightPairs = rightPairs;
      state.isMatchCheckInProgress = false;
      state.showCompletionModal = false;
    },
    
    // Override selectPair to include mobile-specific UI updates
    selectPair: (state, action: PayloadAction<{ pairId: number; isLeftSide: boolean }>) => {
      if (state.isMatchCheckInProgress) return;
      
      const { pairId, isLeftSide } = action.payload;
      
      // Don't allow selection of already matched pairs
      if (state.matchedPairs.includes(pairId)) return;
      
      const currentGameState: PairGameState = {
        pairs: state.pairs,
        selectedLeft: state.selectedLeft,
        selectedRight: state.selectedRight,
        matchedPairs: state.matchedPairs,
        score: state.score,
        currentExercise: state.currentExercise,
        isLoading: state.isLoading,
        error: state.error,
      };
      
      const { newState, isMatch, shouldDelay } = PairsGameLogic.handlePairSelection(
        currentGameState,
        pairId,
        isLeftSide
      );
      
      // Update the core game state
      state.selectedLeft = newState.selectedLeft;
      state.selectedRight = newState.selectedRight;
      state.matchedPairs = newState.matchedPairs;
      state.score = newState.score;
      
      // Update mobile UI pairs with selection states
      state.leftPairs = state.leftPairs.map(pair => ({
        ...pair,
        leftSelected: pair.id === state.selectedLeft,
        matched: state.matchedPairs.includes(pair.id),
      }));
      
      state.rightPairs = state.rightPairs.map(pair => ({
        ...pair,
        rightSelected: pair.id === state.selectedRight,
        matched: state.matchedPairs.includes(pair.id),
      }));
      
      if (shouldDelay) {
        state.isMatchCheckInProgress = true;
      }
      
      // Check for game completion
      if (PairsGameLogic.isGameComplete(newState)) {
        state.showCompletionModal = true;
      }
    },
    
    // Mobile-specific actions
    clearSelectionAfterDelay: (state) => {
      const currentGameState: PairGameState = {
        pairs: state.pairs,
        selectedLeft: state.selectedLeft,
        selectedRight: state.selectedRight,
        matchedPairs: state.matchedPairs,
        score: state.score,
        currentExercise: state.currentExercise,
        isLoading: state.isLoading,
        error: state.error,
      };
      
      const clearedState = PairsGameLogic.clearSelections(currentGameState);
      state.selectedLeft = clearedState.selectedLeft;
      state.selectedRight = clearedState.selectedRight;
      state.isMatchCheckInProgress = false;
      
      // Update mobile UI pairs
      state.leftPairs = state.leftPairs.map(pair => ({
        ...pair,
        leftSelected: false,
      }));
      
      state.rightPairs = state.rightPairs.map(pair => ({
        ...pair,
        rightSelected: false,
      }));
    },
    
    setShowCompletionModal: (state, action: PayloadAction<boolean>) => {
      state.showCompletionModal = action.payload;
    },
  },
});

export const {
  initializeGame,
  selectPair,
  clearSelections,
  resetGame,
  setLoading,
  setError,
  clearSelectionAfterDelay,
  setShowCompletionModal,
} = mobileGameSlice.actions;

export { mobileGameSlice };