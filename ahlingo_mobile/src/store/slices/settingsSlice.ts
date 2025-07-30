import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';

interface SettingsState {
  settings: AppSettings;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: {
    language: '', // Will be loaded from database
    difficulty: '', // Will be loaded from database
    userId: 1, // Default user
    enableLocalModels: false,
    preferLocalModels: false,
  },
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.settings.language = action.payload;
    },
    setDifficulty: (state, action: PayloadAction<string>) => {
      state.settings.difficulty = action.payload;
    },
    setUserId: (state, action: PayloadAction<number>) => {
      state.settings.userId = action.payload;
    },
    setEnableLocalModels: (state, action: PayloadAction<boolean>) => {
      state.settings.enableLocalModels = action.payload;
    },
    setPreferLocalModels: (state, action: PayloadAction<boolean>) => {
      state.settings.preferLocalModels = action.payload;
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
  setSettings,
  setLanguage,
  setDifficulty,
  setUserId,
  setEnableLocalModels,
  setPreferLocalModels,
  setLoading,
  setError,
} = settingsSlice.actions;

export default settingsSlice.reducer;
