// Re-export the exercise slice from mobile with desktop adaptations
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { Topic, PairExercise, ExerciseType } from '@ahlingo/core';

interface ExerciseState {
  topics: Topic[];
  currentTopic: Topic | null;
  pairExercises: PairExercise[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExerciseState = {
  topics: [],
  currentTopic: null,
  pairExercises: [],
  isLoading: false,
  error: null,
};

export const loadTopics = createAsyncThunk(
  'exercise/loadTopics',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Load from database via Electron IPC
      const mockTopics: Topic[] = [
        { id: 1, topic: 'Greetings' },
        { id: 2, topic: 'Numbers' },
        { id: 3, topic: 'Colors' },
        { id: 4, topic: 'Food & Dining' },
        { id: 5, topic: 'Travel' },
      ];
      return mockTopics;
    } catch (error) {
      return rejectWithValue('Failed to load topics');
    }
  }
);

export const loadPairExercises = createAsyncThunk(
  'exercise/loadPairExercises',
  async (topicId: number, { rejectWithValue }) => {
    try {
      // TODO: Load from database via Electron IPC
      const mockPairs: PairExercise[] = [
        {
          id: 1,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Hello',
          language_2_content: 'Bonjour',
        },
        {
          id: 2,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Goodbye',
          language_2_content: 'Au revoir',
        },
        {
          id: 3,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Thank you',
          language_2_content: 'Merci',
        },
        {
          id: 4,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Please',
          language_2_content: 'S\'il vous plaît',
        },
      ];
      return mockPairs;
    } catch (error) {
      return rejectWithValue('Failed to load pair exercises');
    }
  }
);

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    setCurrentTopic: (state, action) => {
      state.currentTopic = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTopics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadTopics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.topics = action.payload;
      })
      .addCase(loadTopics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loadPairExercises.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPairExercises.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pairExercises = action.payload;
      })
      .addCase(loadPairExercises.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTopic, clearError } = exerciseSlice.actions;
export { exerciseSlice };