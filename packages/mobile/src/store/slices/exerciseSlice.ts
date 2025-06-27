import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {
  Topic,
  ExerciseWithDetails,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  ExerciseType,
} from '@ahlingo/core';

interface ExerciseState {
  topics: Topic[];
  currentTopic: Topic | null;
  exercises: ExerciseWithDetails[];
  pairExercises: PairExercise[];
  conversationExercises: ConversationExercise[];
  translationExercises: TranslationExercise[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExerciseState = {
  topics: [],
  currentTopic: null,
  exercises: [],
  pairExercises: [],
  conversationExercises: [],
  translationExercises: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const loadTopics = createAsyncThunk(
  'exercise/loadTopics',
  async (_, {rejectWithValue}) => {
    try {
      // TODO: Load from database using UserSettingsService
      const mockTopics: Topic[] = [
        {id: 1, topic: 'Greetings'},
        {id: 2, topic: 'Numbers'},
        {id: 3, topic: 'Colors'},
        {id: 4, topic: 'Food & Dining'},
        {id: 5, topic: 'Travel'},
      ];
      return mockTopics;
    } catch (error) {
      return rejectWithValue('Failed to load topics');
    }
  }
);

export const loadExercises = createAsyncThunk(
  'exercise/loadExercises',
  async (
    params: {topicId: number; exerciseType: ExerciseType},
    {rejectWithValue}
  ) => {
    try {
      // TODO: Load from database using ExerciseService
      console.log('Loading exercises for:', params);
      return [];
    } catch (error) {
      return rejectWithValue('Failed to load exercises');
    }
  }
);

export const loadPairExercises = createAsyncThunk(
  'exercise/loadPairExercises',
  async (topicId: number, {rejectWithValue}) => {
    try {
      // TODO: Load from database using ExerciseService
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
    setCurrentTopic: (state, action: PayloadAction<Topic>) => {
      state.currentTopic = action.payload;
    },
    clearExercises: (state) => {
      state.exercises = [];
      state.pairExercises = [];
      state.conversationExercises = [];
      state.translationExercises = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load topics
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
      // Load exercises
      .addCase(loadExercises.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadExercises.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exercises = action.payload;
      })
      .addCase(loadExercises.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load pair exercises
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

export const {setCurrentTopic, clearExercises, clearError} = exerciseSlice.actions;
export {exerciseSlice};