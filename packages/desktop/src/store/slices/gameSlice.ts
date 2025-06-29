// Desktop-adapted game slice using core game logic
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PairGameState, GamePair, PairsGameLogic } from '@ahlingo/core';

interface DesktopGameState extends PairGameState {
  leftPairs: GamePair[];
  rightPairs: GamePair[];
  isMatchCheckInProgress: boolean;
  showCompletionDialog: boolean;
}

const initialState: DesktopGameState = {
  pairs: [],
  selectedLeft: undefined,
  selectedRight: undefined,
  matchedPairs: [], // Array instead of Set for Redux
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
  showCompletionDialog: false,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    initializeGame: (state, action: PayloadAction<PairGameState>) => {
      const gameState = action.payload;
      Object.assign(state, gameState);
      
      // Create shuffled pairs for UI
      const { leftPairs, rightPairs } = PairsGameLogic.createGamePairs(gameState.pairs);
      state.leftPairs = leftPairs;
      state.rightPairs = rightPairs;
      state.isMatchCheckInProgress = false;
      state.showCompletionDialog = false;
    },
    
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
      
      // Update the game state
      state.selectedLeft = newState.selectedLeft;
      state.selectedRight = newState.selectedRight;
      state.matchedPairs = newState.matchedPairs;
      state.score = newState.score;
      
      // Update UI pairs with selection states
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
        state.showCompletionDialog = true;
      }
    },
    
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
      
      // Update UI pairs
      state.leftPairs = state.leftPairs.map(pair => ({
        ...pair,
        leftSelected: false,
      }));
      
      state.rightPairs = state.rightPairs.map(pair => ({
        ...pair,
        rightSelected: false,
      }));
    },
    
    resetGame: (state, action: PayloadAction<PairGameState | undefined>) => {
      const newGameState = action.payload;
      
      if (newGameState) {
        const resetState = PairsGameLogic.resetGame(
          {
            pairs: state.pairs,
            selectedLeft: state.selectedLeft,
            selectedRight: state.selectedRight,
            matchedPairs: state.matchedPairs,
            score: state.score,
            currentExercise: state.currentExercise,
            isLoading: state.isLoading,
            error: state.error,
          },
          newGameState.pairs,
          newGameState.currentExercise
        );
        
        Object.assign(state, resetState);
        
        // Create new shuffled pairs
        const { leftPairs, rightPairs } = PairsGameLogic.createGamePairs(resetState.pairs);
        state.leftPairs = leftPairs;
        state.rightPairs = rightPairs;
      } else {
        // Reset current game
        const resetState = PairsGameLogic.resetGame({
          pairs: state.pairs,
          selectedLeft: state.selectedLeft,
          selectedRight: state.selectedRight,
          matchedPairs: state.matchedPairs,
          score: state.score,
          currentExercise: state.currentExercise,
          isLoading: state.isLoading,
          error: state.error,
        });
        
        Object.assign(state, resetState);
        
        // Re-shuffle pairs
        const { leftPairs, rightPairs } = PairsGameLogic.createGamePairs(state.pairs);
        state.leftPairs = leftPairs;
        state.rightPairs = rightPairs;
      }
      
      state.isMatchCheckInProgress = false;
      state.showCompletionDialog = false;
    },
    
    setShowCompletionDialog: (state, action: PayloadAction<boolean>) => {
      state.showCompletionDialog = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
  },
});

export const {
  initializeGame,
  selectPair,
  clearSelectionAfterDelay,
  resetGame,
  setShowCompletionDialog,
  setLoading,
  setError,
} = gameSlice.actions;

export { gameSlice };