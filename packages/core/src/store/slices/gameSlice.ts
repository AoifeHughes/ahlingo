import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PairsGameLogic } from '../../services/gameLogic';
import { PairGameState, GamePair } from '../../../types';

export interface CoreGameState extends PairGameState {
  // Core game state without platform-specific UI extensions
}

const initialState: CoreGameState = {
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
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    initializeGame: (state, action: PayloadAction<PairGameState>) => {
      const gameState = action.payload;
      Object.assign(state, gameState);
    },
    
    selectPair: (state, action: PayloadAction<{ pairId: number; isLeftSide: boolean }>) => {
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
      
      const { newState } = PairsGameLogic.handlePairSelection(
        currentGameState,
        pairId,
        isLeftSide
      );
      
      // Update the game state
      state.selectedLeft = newState.selectedLeft;
      state.selectedRight = newState.selectedRight;
      state.matchedPairs = newState.matchedPairs;
      state.score = newState.score;
    },
    
    clearSelections: (state) => {
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
      }
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
  clearSelections,
  resetGame,
  setLoading,
  setError,
} = gameSlice.actions;

export { gameSlice };