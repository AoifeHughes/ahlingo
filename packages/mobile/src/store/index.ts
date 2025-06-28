import { configureStore } from '@reduxjs/toolkit';
import { 
  exerciseSlice,
  userSettingsSlice,
  setExerciseDataAdapter,
  setUserSettingsDataAdapter
} from '@ahlingo/core';
import { navigationSlice } from './slices/navigationSlice';
import { mobileGameSlice } from './slices/gameSlice';
import { 
  MobileExerciseDataAdapter,
  MobileUserSettingsDataAdapter
} from '../adapters/MobileDataAdapters';

// Lazy initialize data adapters (called when first needed)
let adaptersInitialized = false;

const initializeDataAdapters = () => {
  if (adaptersInitialized) {
    return;
  }
  
  try {
    console.log('Setting up mobile data adapters...');
    
    const exerciseAdapter = new MobileExerciseDataAdapter();
    const userSettingsAdapter = new MobileUserSettingsDataAdapter();
    
    // Set up data adapters for mobile
    setExerciseDataAdapter(exerciseAdapter);
    setUserSettingsDataAdapter(userSettingsAdapter);
    
    adaptersInitialized = true;
    console.log('Mobile data adapters configured successfully');
  } catch (error) {
    console.error('Failed to configure data adapters:', error);
    // Don't throw - let the app continue and handle errors when data is accessed
  }
};

// Export the initialization function for app to call when ready
export { initializeDataAdapters };

// Create mobile-specific store that extends core store
export const store = configureStore({
  reducer: {
    // Core slices
    exercise: exerciseSlice.reducer,
    userSettings: userSettingsSlice.reducer,
    // Mobile-specific slices
    game: mobileGameSlice.reducer, // Override core game slice with mobile version
    navigation: navigationSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export navigation actions for convenience
export * from './slices/navigationSlice';