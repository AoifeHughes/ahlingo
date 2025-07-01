import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language, Topic, Difficulty } from '../../types';

interface DataState {
  languages: Language[];
  topics: Topic[];
  difficulties: Difficulty[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DataState = {
  languages: [],
  topics: [],
  difficulties: [],
  isLoading: false,
  error: null,
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setLanguages: (state, action: PayloadAction<Language[]>) => {
      state.languages = action.payload;
    },
    setTopics: (state, action: PayloadAction<Topic[]>) => {
      state.topics = action.payload;
    },
    setDifficulties: (state, action: PayloadAction<Difficulty[]>) => {
      state.difficulties = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setLanguages,
  setTopics,
  setDifficulties,
  setLoading,
  setError,
} = dataSlice.actions;

export default dataSlice.reducer;
