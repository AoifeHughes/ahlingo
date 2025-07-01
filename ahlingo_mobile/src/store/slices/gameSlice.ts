import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, PairExercise } from '../../types';

const initialState: GameState = {
  selectedPairs: { column1: null, column2: null },
  correctPairs: [],
  score: { correct: 0, incorrect: 0 },
  isLoading: false,
  currentPairs: [],
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
} = gameSlice.actions;

export default gameSlice.reducer;
