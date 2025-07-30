import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, PairExercise, RecentExercise } from '../../types';

const initialState: GameState = {
  selectedPairs: { column1: null, column2: null },
  correctPairs: [],
  score: { correct: 0, incorrect: 0 },
  isLoading: false,
  currentPairs: [],
  recentExercises: [],
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    selectPairColumn1: (state, action: PayloadAction<number | null>) => {
      state.selectedPairs.column1 = action.payload;
    },
    selectPairColumn2: (state, action: PayloadAction<number | null>) => {
      state.selectedPairs.column2 = action.payload;
    },
    clearSelections: state => {
      state.selectedPairs = { column1: null, column2: null };
    },
    addCorrectPair: (state, action: PayloadAction<number>) => {
      state.correctPairs.push(action.payload);
      state.score.correct += 1;
    },
    incrementIncorrect: state => {
      state.score.incorrect += 1;
    },
    resetGame: state => {
      state.selectedPairs = { column1: null, column2: null };
      state.correctPairs = [];
      state.score = { correct: 0, incorrect: 0 };
    },
    setCurrentPairs: (state, action: PayloadAction<PairExercise[]>) => {
      state.currentPairs = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    addRecentExercise: (state, action: PayloadAction<RecentExercise>) => {
      // Add to beginning of array
      state.recentExercises.unshift(action.payload);
      // Keep only the last 20 exercises to prevent unbounded growth
      if (state.recentExercises.length > 20) {
        state.recentExercises = state.recentExercises.slice(0, 20);
      }
    },
    setRecentExercises: (state, action: PayloadAction<RecentExercise[]>) => {
      state.recentExercises = action.payload;
    },
    clearRecentExercises: (state) => {
      state.recentExercises = [];
    },
    cleanupOldExercises: (state) => {
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
      state.recentExercises = state.recentExercises.filter(
        ex => (now - ex.timestamp) <= maxAge
      );
    },
  },
});

export const {
  selectPairColumn1,
  selectPairColumn2,
  clearSelections,
  addCorrectPair,
  incrementIncorrect,
  resetGame,
  setCurrentPairs,
  setLoading,
  addRecentExercise,
  setRecentExercises,
  clearRecentExercises,
  cleanupOldExercises,
} = gameSlice.actions;

export default gameSlice.reducer;
