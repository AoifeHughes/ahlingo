import { jest } from '@jest/globals';
import { createMockDatabaseResult, createMockUser, mockUserContext, createExercise, createPairExercise } from './factories';

// Database service mocks
export const mockDatabaseService = {
  // User-related mocks
  getUserContext: jest.fn().mockResolvedValue(mockUserContext()),
  getMostRecentUser: jest.fn().mockResolvedValue('testuser'),
  getUserSettings: jest.fn().mockResolvedValue({
    language: 'French',
    difficulty: 'Beginner',
  }),
  getUserId: jest.fn().mockResolvedValue(1),
  recordExerciseAttemptForCurrentUser: jest.fn().mockResolvedValue(undefined),
  recordExerciseAttempt: jest.fn().mockResolvedValue(undefined),

  // Exercise-related mocks
  getRandomMixedExercises: jest.fn().mockResolvedValue([]),
  getRandomMixedExercisesForTopic: jest.fn().mockResolvedValue([]),
  getTopicsWithProgressForExerciseType: jest.fn().mockResolvedValue([]),
  getTopicsForStudy: jest.fn().mockResolvedValue([]),

  // Pairs exercise mocks
  getRandomExerciseForTopic: jest.fn().mockResolvedValue(createExercise()),
  getPairExercises: jest.fn().mockResolvedValue([createPairExercise()]),
  getPairsExerciseWithData: jest.fn().mockResolvedValue({
    exercise: createExercise(),
    pairData: [createPairExercise()],
  }),

  // Translation exercise mocks
  getRandomTranslationExerciseForTopic: jest.fn().mockResolvedValue(createExercise({ exercise_type: 'translation' })),
  getTranslationExerciseData: jest.fn().mockResolvedValue([]),
  getTranslationExerciseWithData: jest.fn().mockResolvedValue({
    exercise: createExercise({ exercise_type: 'translation' }),
    translationData: [],
  }),

  // Conversation exercise mocks
  getRandomConversationExerciseForTopic: jest.fn().mockResolvedValue(createExercise({ exercise_type: 'conversation' })),
  getConversationExerciseData: jest.fn().mockResolvedValue([]),
  getConversationSummary: jest.fn().mockResolvedValue('Test summary'),
  getRandomConversationSummaries: jest.fn().mockResolvedValue(['Wrong summary 1', 'Wrong summary 2']),
  getTopicNameForExercise: jest.fn().mockResolvedValue('Test Topic'),
  getConversationExerciseWithData: jest.fn().mockResolvedValue({
    exercise: createExercise({ exercise_type: 'conversation' }),
    conversationData: [],
    topicName: 'Test Topic',
    correctSummary: 'Test summary',
    wrongSummaries: ['Wrong 1', 'Wrong 2'],
  }),

  // Fill-in-blank exercise mocks
  getRandomFillInBlankExerciseForTopic: jest.fn().mockResolvedValue(createExercise({ exercise_type: 'fill_in_blank' })),
  getFillInBlankExerciseData: jest.fn().mockResolvedValue([]),
  getFillInBlankExerciseWithData: jest.fn().mockResolvedValue({
    exercise: createExercise({ exercise_type: 'fill_in_blank' }),
    fillInBlankData: [],
  }),

  // Stats and failed exercises
  getUserFailedExercises: jest.fn().mockResolvedValue([]),
  getUserStatsByTopic: jest.fn().mockResolvedValue([]),
};

// SQLite mock
export const mockSQLite = {
  openDatabase: jest.fn().mockReturnValue({
    executeSql: jest.fn().mockImplementation((query: string, params?: any[]) => {
      // Mock different responses based on query
      if (query.includes('SELECT name FROM users')) {
        return Promise.resolve(createMockDatabaseResult([{ name: 'testuser' }]));
      }
      if (query.includes('SELECT id FROM users')) {
        return Promise.resolve(createMockDatabaseResult([{ id: 1 }]));
      }
      if (query.includes('user_settings')) {
        return Promise.resolve(createMockDatabaseResult([
          { user_id: 1, setting_name: 'language', setting_value: 'French' },
          { user_id: 1, setting_name: 'difficulty', setting_value: 'Beginner' },
        ]));
      }
      // Default empty result
      return Promise.resolve(createMockDatabaseResult());
    }),
    close: jest.fn().mockResolvedValue(undefined),
  }),
};

// Navigation mocks
export const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  setParams: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => true),
  isFocused: jest.fn(() => true),
  dispatch: jest.fn(),
  getId: jest.fn(() => 'test-screen'),
  getParent: jest.fn(),
  getState: jest.fn(),
};

// Route mocks
export const mockRoute = {
  key: 'test-route',
  name: 'TestScreen' as any,
  params: {},
  path: undefined,
};

// Redux mocks
export const mockUseSelector = jest.fn().mockReturnValue({
  settings: {
    language: 'French',
    difficulty: 'Beginner',
    userId: 1,
  },
  isLoading: false,
  error: null,
});

export const mockUseDispatch = jest.fn().mockReturnValue(jest.fn());

// Theme context mock
export const mockTheme = {
  colors: {
    primary: '#1976D2',
    secondary: '#FFC107',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    textLight: '#BDBDBD',
    border: '#E0E0E0',
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
  },
  spacing: {
    xs: 4,
    sm: 8,
    base: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '4xl': 64,
  },
  typography: {
    fontSizes: {
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  borderRadius: {
    sm: 4,
    base: 8,
    lg: 12,
  },
  shadows: {
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

export const mockUseTheme = jest.fn().mockReturnValue({ theme: mockTheme });

// Shuffle context mock
export const mockShuffleContext = {
  isShuffleMode: false,
  currentChallenge: 1,
  totalChallenges: 5,
  onComplete: jest.fn(),
};

// Reset all mocks helper
export const resetAllMocks = () => {
  Object.values(mockDatabaseService).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  Object.values(mockNavigation).forEach(mock => {
    if (jest.isMockFunction(mock)) {
      mock.mockClear();
    }
  });

  mockUseSelector.mockClear();
  mockUseDispatch.mockClear();
  mockUseTheme.mockClear();
};
