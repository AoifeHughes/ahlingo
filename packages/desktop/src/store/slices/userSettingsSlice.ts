import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings, Language, Difficulty } from '@ahlingo/core';

interface UserSettingsState {
  settings: UserSettings | null;
  availableLanguages: Language[];
  availableDifficulties: Difficulty[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UserSettingsState = {
  settings: null,
  availableLanguages: [],
  availableDifficulties: [],
  isLoading: false,
  error: null,
};

// Async thunks for desktop-specific operations
export const loadUserSettings = createAsyncThunk(
  'userSettings/load',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Implement Electron IPC database loading
      // For now, return mock data
      const mockSettings: UserSettings = {
        language: { id: 1, language: 'French' },
        difficulty: { id: 1, difficulty_level: 'Beginner' },
        userId: 1,
      };
      return mockSettings;
    } catch (error) {
      return rejectWithValue('Failed to load user settings');
    }
  }
);

export const saveUserSettings = createAsyncThunk(
  'userSettings/save',
  async (settings: Partial<UserSettings>, { rejectWithValue }) => {
    try {
      // TODO: Implement Electron IPC database saving
      console.log('Saving settings via Electron IPC:', settings);
      return settings;
    } catch (error) {
      return rejectWithValue('Failed to save user settings');
    }
  }
);

export const loadReferenceData = createAsyncThunk(
  'userSettings/loadReferenceData',
  async (_, { rejectWithValue }) => {
    try {
      // TODO: Load from database via Electron IPC
      const languages: Language[] = [
        { id: 1, language: 'French' },
        { id: 2, language: 'Spanish' },
        { id: 3, language: 'German' },
      ];
      
      const difficulties: Difficulty[] = [
        { id: 1, difficulty_level: 'Beginner' },
        { id: 2, difficulty_level: 'Intermediate' },
        { id: 3, difficulty_level: 'Advanced' },
      ];

      return { languages, difficulties };
    } catch (error) {
      return rejectWithValue('Failed to load reference data');
    }
  }
);

const userSettingsSlice = createSlice({
  name: 'userSettings',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<UserSettings>>) => {
      if (state.settings) {
        state.settings = { ...state.settings, ...action.payload };
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user settings
      .addCase(loadUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(loadUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Save user settings
      .addCase(saveUserSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.settings) {
          state.settings = { ...state.settings, ...action.payload };
        }
      })
      .addCase(saveUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load reference data
      .addCase(loadReferenceData.fulfilled, (state, action) => {
        state.availableLanguages = action.payload.languages;
        state.availableDifficulties = action.payload.difficulties;
      });
  },
});

export const { updateSettings, clearError } = userSettingsSlice.actions;
export { userSettingsSlice };