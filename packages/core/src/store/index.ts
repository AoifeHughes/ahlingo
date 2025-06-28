import { configureStore } from '@reduxjs/toolkit';
import { exerciseSlice } from './slices/exerciseSlice';
import { gameSlice } from './slices/gameSlice';
import { userSettingsSlice } from './slices/userSettingsSlice';

export const createCoreStore = (additionalReducers = {}) => {
  return configureStore({
    reducer: {
      exercise: exerciseSlice.reducer,
      game: gameSlice.reducer,
      userSettings: userSettingsSlice.reducer,
      ...additionalReducers,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
          ignoredPaths: ['game.matchedPairs'], // Set is not serializable
        },
      }),
  });
};

// Export core types
export type CoreRootState = {
  exercise: ReturnType<typeof exerciseSlice.reducer>;
  game: ReturnType<typeof gameSlice.reducer>;
  userSettings: ReturnType<typeof userSettingsSlice.reducer>;
};

// Re-export slice types and actions (excluding conflicting names)
export type { ExerciseState, ExerciseDataAdapter } from './slices/exerciseSlice';
export { exerciseSlice, loadTopics, loadPairExercises, loadConversationExercises, loadTranslationExercises, setCurrentTopic, resetExercises, setExerciseDataAdapter } from './slices/exerciseSlice';

export type { CoreGameState } from './slices/gameSlice';
export { gameSlice, initializeGame, selectPair, clearSelections, resetGame, setLoading, setError } from './slices/gameSlice';

export type { UserSettingsState, UserSettingsDataAdapter } from './slices/userSettingsSlice';
export { userSettingsSlice, loadUserSettings, saveUserSettings, loadReferenceData, updateSettings, setSettings, setUserSettingsDataAdapter } from './slices/userSettingsSlice';

// Resolve naming conflicts by explicitly re-exporting with different names
export { clearError as clearExerciseError } from './slices/exerciseSlice';
export { clearError as clearUserSettingsError } from './slices/userSettingsSlice';