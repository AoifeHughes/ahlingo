import { configureStore } from '@reduxjs/toolkit';
import { 
  exerciseSlice,
  userSettingsSlice,
  gameSlice,
  setExerciseDataAdapter,
  setUserSettingsDataAdapter
} from '@ahlingo/core';
import { uiSlice } from './slices/uiSlice';
import { DesktopExerciseDataAdapter, DesktopUserSettingsDataAdapter } from '../adapters/DesktopDataAdapters';

// Set up desktop-specific data adapters
setExerciseDataAdapter(new DesktopExerciseDataAdapter());
setUserSettingsDataAdapter(new DesktopUserSettingsDataAdapter());

export const store = configureStore({
  reducer: {
    // Use core slices with database adapters
    exercise: exerciseSlice.reducer,
    userSettings: userSettingsSlice.reducer,
    game: gameSlice.reducer,
    // Desktop-specific UI slice
    ui: uiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export actions for convenience
export * from '@ahlingo/core';