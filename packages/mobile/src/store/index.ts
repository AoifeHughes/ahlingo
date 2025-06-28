import { configureStore } from '@reduxjs/toolkit';
import { 
  exerciseSlice,
  userSettingsSlice,
  setExerciseDataAdapter,
  setUserSettingsDataAdapter,
  ExerciseDataAdapter,
  UserSettingsDataAdapter
} from '@ahlingo/core';
import { navigationSlice } from './slices/navigationSlice';
import { mobileGameSlice } from './slices/gameSlice';

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
        ignoredPaths: ['game.matchedPairs'], // Set is not serializable
      },
    }),
  devTools: __DEV__,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Mobile data adapters - to be implemented
class MobileExerciseDataAdapter implements ExerciseDataAdapter {
  async loadTopics() {
    // TODO: Implement SQLite database access for mobile
    const mockTopics = [
      { id: 1, topic: 'Greetings' },
      { id: 2, topic: 'Numbers' },
      { id: 3, topic: 'Colors' },
      { id: 4, topic: 'Food & Dining' },
      { id: 5, topic: 'Travel' },
    ];
    return mockTopics;
  }

  async loadPairExercises(topicId: number) {
    // TODO: Implement SQLite database access for mobile
    const mockPairs = [
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

  async loadConversationExercises(topicId: number) {
    // TODO: Implement SQLite database access for mobile
    return [];
  }

  async loadTranslationExercises(topicId: number) {
    // TODO: Implement SQLite database access for mobile
    return [];
  }
}

class MobileUserSettingsDataAdapter implements UserSettingsDataAdapter {
  async loadUserSettings() {
    // TODO: Implement AsyncStorage or SQLite access for mobile
    return {
      language: { id: 1, language: 'French' },
      difficulty: { id: 1, difficulty_level: 'Beginner' },
      userId: 1,
    };
  }

  async saveUserSettings(settings: any) {
    // TODO: Implement AsyncStorage or SQLite access for mobile
    console.log('Saving settings (mobile):', settings);
    return settings;
  }

  async loadReferenceData() {
    // TODO: Implement SQLite database access for mobile
    return {
      languages: [
        { id: 1, language: 'French' },
        { id: 2, language: 'Spanish' },
        { id: 3, language: 'German' },
      ],
      difficulties: [
        { id: 1, difficulty_level: 'Beginner' },
        { id: 2, difficulty_level: 'Intermediate' },
        { id: 3, difficulty_level: 'Advanced' },
      ],
    };
  }
}

// Set up data adapters for mobile
setExerciseDataAdapter(new MobileExerciseDataAdapter());
setUserSettingsDataAdapter(new MobileUserSettingsDataAdapter());

// Export navigation actions for convenience
export * from './slices/navigationSlice';