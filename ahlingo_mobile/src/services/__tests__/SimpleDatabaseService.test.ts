import { jest } from '@jest/globals';
import { 
  getUserContext, 
  recordExerciseAttemptForCurrentUser,
  getTopicsWithProgressForExerciseType,
  getRandomMixedExercisesForTopic,
  getConversationExerciseWithData,
  getTranslationExerciseWithData,
  getFillInBlankExerciseWithData,
  getPairsExerciseWithData,
} from '../RefactoredDatabaseService';
import { createMockDatabaseResult, createExercise, mockUserContext } from '../../test-utils/factories';

// Mock SQLite
const mockExecuteSql = jest.fn();
const mockClose = jest.fn();
const mockOpenDatabase = jest.fn().mockReturnValue({
  executeSql: mockExecuteSql,
  close: mockClose,
});

jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: mockOpenDatabase,
}));

// Mock database utils
jest.mock('../../utils/databaseUtils', () => ({
  getDatabaseConfig: jest.fn().mockReturnValue({ name: 'test.db' }),
  ensureDatabaseCopied: jest.fn().mockResolvedValue(undefined),
}));

describe('SimpleDatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecuteSql.mockResolvedValue(createMockDatabaseResult());
  });

  describe('getUserContext', () => {
    it('should return complete user context in single call', async () => {
      // Mock the sequence of database calls
      mockExecuteSql
        .mockResolvedValueOnce(createMockDatabaseResult([{ name: 'testuser' }])) // getMostRecentUser
        .mockResolvedValueOnce(createMockDatabaseResult([{ 
          user_id: 1, 
          language: 'French', 
          difficulty: 'Beginner' 
        }])); // user context query

      const result = await getUserContext();

      expect(result).toEqual({
        username: 'testuser',
        userId: 1,
        settings: {
          language: 'French',
          difficulty: 'Beginner',
        },
      });

      // Verify only 2 database calls were made (optimization working)
      expect(mockExecuteSql).toHaveBeenCalledTimes(2);
      expect(mockOpenDatabase).toHaveBeenCalledTimes(1);
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should create default settings if none exist', async () => {
      mockExecuteSql
        .mockResolvedValueOnce(createMockDatabaseResult([{ name: 'testuser' }]))
        .mockResolvedValueOnce(createMockDatabaseResult([{ 
          user_id: 1, 
          language: null, 
          difficulty: null 
        }]))
        .mockResolvedValueOnce(createMockDatabaseResult()) // INSERT language
        .mockResolvedValueOnce(createMockDatabaseResult()); // INSERT difficulty

      const result = await getUserContext();

      expect(result?.settings).toEqual({
        language: 'French',
        difficulty: 'Beginner',
      });

      // Should have created default settings
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO user_settings'),
        [1, 'language', 'French']
      );
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE INTO user_settings'),
        [1, 'difficulty', 'Beginner']
      );
    });

    it('should return null if no users exist', async () => {
      mockExecuteSql.mockResolvedValueOnce(createMockDatabaseResult([]));

      const result = await getUserContext();

      expect(result).toBeNull();
    });
  });

  describe('recordExerciseAttemptForCurrentUser', () => {
    it('should record exercise attempt for current user', async () => {
      // Mock getUserContext
      mockExecuteSql
        .mockResolvedValueOnce(createMockDatabaseResult([{ name: 'testuser' }]))
        .mockResolvedValueOnce(createMockDatabaseResult([{ 
          user_id: 1, 
          language: 'French', 
          difficulty: 'Beginner' 
        }]))
        .mockResolvedValueOnce(createMockDatabaseResult()); // recordExerciseAttempt

      await recordExerciseAttemptForCurrentUser(123, true);

      // Should call recordExerciseAttempt with userId and exerciseId
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO user_exercise_attempts'),
        expect.arrayContaining([1, 123, true])
      );
    });

    it('should handle missing user gracefully', async () => {
      mockExecuteSql.mockResolvedValueOnce(createMockDatabaseResult([]));

      // Should not throw
      await expect(recordExerciseAttemptForCurrentUser(123, true)).resolves.toBeUndefined();
    });
  });

  describe('getTopicsWithProgressForExerciseType', () => {
    it('should return topics with progress in single optimized query', async () => {
      const mockTopics = [
        {
          id: 1,
          topic: 'Greetings',
          total_exercises: 10,
          completed_exercises: 7,
          percentage: 70,
        },
        {
          id: 2,
          topic: 'Food',
          total_exercises: 8,
          completed_exercises: 4,
          percentage: 50,
        },
      ];

      mockExecuteSql.mockResolvedValueOnce(createMockDatabaseResult(mockTopics));

      const result = await getTopicsWithProgressForExerciseType(1, 'pairs', 'French', 'Beginner');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        topic: 'Greetings',
        progress: {
          totalExercises: 10,
          completedExercises: 7,
          percentage: 70,
        },
      });

      // Verify the optimized query includes JOINs and GROUP BY
      expect(mockExecuteSql).toHaveBeenCalledWith(
        expect.stringContaining('JOIN'),
        [1, 'French', 'Beginner', 'pairs']
      );
    });

    it('should handle different exercise types', async () => {
      mockExecuteSql.mockResolvedValue(createMockDatabaseResult([]));

      await getTopicsWithProgressForExerciseType(1, 'conversation', 'French', 'Beginner');

      const query = mockExecuteSql.mock.calls[0][0];
      expect(query).toContain('JOIN conversation_exercises');
    });
  });

  describe('getRandomMixedExercisesForTopic', () => {
    it('should return verified exercises with data existence check', async () => {
      const mockExercises = [
        {
          id: 1,
          exercise_name: 'Test Exercise 1',
          topic_id: 1,
          exercise_type: 'pairs',
          verified_exercise_type: 'pairs',
        },
        {
          id: 2,
          exercise_name: 'Test Exercise 2',
          topic_id: 1,
          exercise_type: 'conversation',
          verified_exercise_type: 'conversation',
        },
      ];

      mockExecuteSql
        .mockResolvedValueOnce(createMockDatabaseResult([{ topic: 'Test Topic' }])) // topic name
        .mockResolvedValueOnce(createMockDatabaseResult(mockExercises)) // exercises with verification
        .mockResolvedValueOnce(createMockDatabaseResult([])); // user attempts

      const result = await getRandomMixedExercisesForTopic(1, 1, 'French', 'Beginner');

      expect(result).toHaveLength(2);
      expect(result[0].exerciseType).toBe('pairs');
      expect(result[1].exerciseType).toBe('conversation');
      expect(result[0].topicName).toBe('Test Topic');

      // Verify the query includes existence verification JOINs
      const exerciseQuery = mockExecuteSql.mock.calls[1][0];
      expect(exerciseQuery).toContain('LEFT JOIN pair_exercises');
      expect(exerciseQuery).toContain('LEFT JOIN conversation_exercises');
      expect(exerciseQuery).toContain('pe.exercise_id IS NOT NULL OR ce.exercise_id IS NOT NULL');
    });

    it('should prioritize untried exercises when userId provided', async () => {
      const mockExercises = [{ id: 1, verified_exercise_type: 'pairs' }];
      const mockAttempts = [{ exercise_id: 2 }]; // User has attempted exercise 2

      mockExecuteSql
        .mockResolvedValueOnce(createMockDatabaseResult([{ topic: 'Test Topic' }]))
        .mockResolvedValueOnce(createMockDatabaseResult(mockExercises))
        .mockResolvedValueOnce(createMockDatabaseResult(mockAttempts));

      const result = await getRandomMixedExercisesForTopic(1, 1, 'French', 'Beginner');

      // Should have filtered out attempted exercises and prioritized untried ones
      expect(result).toHaveLength(1);
      expect(result[0].exerciseInfo.id).toBe(1); // Exercise 1 should be prioritized (not attempted)
    });
  });

  describe('Combined Exercise Functions', () => {
    describe('getConversationExerciseWithData', () => {
      it('should return exercise with all related data in single call', async () => {
        const mockExercise = createExercise({ exercise_type: 'conversation' });
        const mockConversationData = [{ id: 1, speaker: 'Alice', message: 'Hello' }];
        const mockTopicName = [{ topic: 'Greetings' }];
        const mockCorrectSummary = [{ summary: 'A greeting conversation' }];
        const mockWrongSummaries = [{ summary: 'Wrong summary 1' }, { summary: 'Wrong summary 2' }];

        mockExecuteSql
          .mockResolvedValueOnce(createMockDatabaseResult([mockExercise])) // exercise
          .mockResolvedValueOnce(createMockDatabaseResult(mockConversationData)) // conversation data
          .mockResolvedValueOnce(createMockDatabaseResult(mockTopicName)) // topic name
          .mockResolvedValueOnce(createMockDatabaseResult(mockCorrectSummary)) // correct summary
          .mockResolvedValueOnce(createMockDatabaseResult(mockWrongSummaries)); // wrong summaries

        const result = await getConversationExerciseWithData(1, 'French', 'Beginner', 1);

        expect(result).toEqual({
          exercise: mockExercise,
          conversationData: mockConversationData,
          topicName: 'Greetings',
          correctSummary: 'A greeting conversation',
          wrongSummaries: ['Wrong summary 1', 'Wrong summary 2'],
        });

        // Verify parallel data fetching was used
        expect(mockExecuteSql).toHaveBeenCalledTimes(5);
      });
    });

    describe('getPairsExerciseWithData', () => {
      it('should return exercise with pair data', async () => {
        const mockExercise = createExercise({ exercise_type: 'pairs' });
        const mockPairData = [{ 
          id: 1, 
          language_1_content: 'Hello', 
          language_2_content: 'Bonjour' 
        }];

        mockExecuteSql
          .mockResolvedValueOnce(createMockDatabaseResult([mockExercise]))
          .mockResolvedValueOnce(createMockDatabaseResult(mockPairData));

        const result = await getPairsExerciseWithData(1, 'French', 'Beginner');

        expect(result).toEqual({
          exercise: mockExercise,
          pairData: mockPairData,
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockExecuteSql.mockRejectedValue(new Error('Database error'));

      const result = await getUserContext();

      expect(result).toBeNull();
      expect(mockClose).toHaveBeenCalled(); // Ensure cleanup happens
    });

    it('should handle connection timeouts', async () => {
      mockOpenDatabase.mockImplementation(() => {
        throw new Error('Connection timeout');
      });

      const result = await getUserContext();

      expect(result).toBeNull();
    });
  });

  describe('Database Connection Management', () => {
    it('should always close database connections', async () => {
      mockExecuteSql.mockResolvedValue(createMockDatabaseResult([]));

      await getUserContext();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should close connections even when errors occur', async () => {
      mockExecuteSql.mockRejectedValue(new Error('Test error'));

      await getUserContext();

      expect(mockClose).toHaveBeenCalledTimes(1);
    });
  });
});