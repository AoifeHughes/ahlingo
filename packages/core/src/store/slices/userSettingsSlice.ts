import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings, Language, Difficulty } from '../../../types';

export interface UserSettingsState {
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

export interface UserSettingsDataAdapter {
  loadUserSettings(): Promise<UserSettings>;
  saveUserSettings(settings: Partial<UserSettings>): Promise<Partial<UserSettings>>;
  loadReferenceData(): Promise<{ languages: Language[]; difficulties: Difficulty[] }>;
}

let dataAdapter: UserSettingsDataAdapter | null = null;

export const setUserSettingsDataAdapter = (adapter: UserSettingsDataAdapter) => {
  dataAdapter = adapter;
};

export const loadUserSettings = createAsyncThunk(
  'userSettings/load',
  async (_, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        // Fallback to mock data if no adapter is set
        const mockSettings: UserSettings = {
          language: { id: 1, language: 'French' },
          difficulty: { id: 1, difficulty_level: 'Beginner' },
          userId: 1,
        };
        return mockSettings;
      }
      return await dataAdapter.loadUserSettings();
    } catch (error) {
      return rejectWithValue('Failed to load user settings');
    }
  }
);

export const saveUserSettings = createAsyncThunk(
  'userSettings/save',
  async (settings: Partial<UserSettings>, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        console.log('Saving settings (mock):', settings);
        return settings;
      }
      return await dataAdapter.saveUserSettings(settings);
    } catch (error) {
      return rejectWithValue('Failed to save user settings');
    }
  }
);

export const loadReferenceData = createAsyncThunk(
  'userSettings/loadReferenceData',
  async (_, { rejectWithValue }) => {
    try {
      if (!dataAdapter) {
        // Fallback to mock data if no adapter is set
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
      }
      return await dataAdapter.loadReferenceData();
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
    setSettings: (state, action: PayloadAction<UserSettings>) => {
      state.settings = action.payload;
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

export const { updateSettings, clearError, setSettings } = userSettingsSlice.actions;
export { userSettingsSlice };