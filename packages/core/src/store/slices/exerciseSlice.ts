import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Topic, PairExercise, ConversationExercise, TranslationExercise } from '../../../types';

export interface ExerciseState {
  topics: Topic[];
  currentTopic: Topic | null;
  pairExercises: PairExercise[];
  conversationExercises: ConversationExercise[];
  translationExercises: TranslationExercise[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ExerciseState = {
  topics: [],
  currentTopic: null,
  pairExercises: [],
  conversationExercises: [],
  translationExercises: [],
  isLoading: false,
  error: null,
};

export interface ExerciseDataAdapter {
  loadTopics(): Promise<Topic[]>;
  loadPairExercises(topicId: number): Promise<PairExercise[]>;
  loadConversationExercises(topicId: number): Promise<ConversationExercise[]>;
  loadTranslationExercises(topicId: number): Promise<TranslationExercise[]>;
}

let dataAdapter: ExerciseDataAdapter | null = null;

export const setExerciseDataAdapter = (adapter: ExerciseDataAdapter) => {
  dataAdapter = adapter;
};

export const loadTopics = createAsyncThunk(
  'exercise/loadTopics',
  async (_, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        // Fallback to mock data if no adapter is set
        const mockTopics: Topic[] = [
          { id: 1, topic: 'Greetings' },
          { id: 2, topic: 'Numbers' },
          { id: 3, topic: 'Colors' },
          { id: 4, topic: 'Food & Dining' },
          { id: 5, topic: 'Travel' },
        ];
        return mockTopics;
      }
      return await dataAdapter.loadTopics();
    } catch (error) {
      return rejectWithValue('Failed to load topics');
    }
  }
);

export const loadPairExercises = createAsyncThunk(
  'exercise/loadPairExercises',
  async (topicId: number, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        // Fallback to mock data if no adapter is set
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
      }
      return await dataAdapter.loadPairExercises(topicId);
    } catch (error) {
      return rejectWithValue('Failed to load pair exercises');
    }
  }
);

export const loadConversationExercises = createAsyncThunk(
  'exercise/loadConversationExercises',
  async (topicId: number, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        return [];
      }
      return await dataAdapter.loadConversationExercises(topicId);
    } catch (error) {
      return rejectWithValue('Failed to load conversation exercises');
    }
  }
);

export const loadTranslationExercises = createAsyncThunk(
  'exercise/loadTranslationExercises',
  async (topicId: number, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        return [];
      }
      return await dataAdapter.loadTranslationExercises(topicId);
    } catch (error) {
      return rejectWithValue('Failed to load translation exercises');
    }
  }
);

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    setCurrentTopic: (state, action: PayloadAction<Topic | null>) => {
      state.currentTopic = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetExercises: (state) => {
      state.pairExercises = [];
      state.conversationExercises = [];
      state.translationExercises = [];
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
      })
      // Load conversation exercises
      .addCase(loadConversationExercises.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadConversationExercises.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversationExercises = action.payload;
      })
      .addCase(loadConversationExercises.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load translation exercises
      .addCase(loadTranslationExercises.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadTranslationExercises.fulfilled, (state, action) => {
        state.isLoading = false;
        state.translationExercises = action.payload;
      })
      .addCase(loadTranslationExercises.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentTopic, clearError, resetExercises } = exerciseSlice.actions;
export { exerciseSlice };