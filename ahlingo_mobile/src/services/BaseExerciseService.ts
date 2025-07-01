import {
  executeSqlSingle,
  getSingleRow,
  rowsToArray,
} from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';
import { Topic, ExerciseInfo } from '../types';
import { ExerciseType } from '../utils/navigationUtils';

/**
 * Base exercise service - provides common functionality for all exercise types
 */

/**
 * Get topics available for a specific exercise type, language, and difficulty
 */
export const getTopicsForExerciseType = async (
  exerciseType: ExerciseType,
  language: string,
  difficulty: string
): Promise<Topic[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_TOPICS_BY_TYPE(exerciseType),
      [language, difficulty],
      TIMEOUTS.QUERY_MEDIUM
    );

    return results ? rowsToArray<Topic>(results.rows) : [];
  } catch (error) {
    console.error(`Failed to get topics for ${exerciseType}:`, error);
    return [];
  }
};

/**
 * Get a random exercise for a topic, language, difficulty, and exercise type
 */
export const getRandomExerciseForTopic = async (
  topicId: number,
  language: string,
  difficulty: string,
  exerciseType: ExerciseType
): Promise<ExerciseInfo | null> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_RANDOM_EXERCISE(exerciseType),
      [topicId, language, difficulty],
      TIMEOUTS.QUERY_MEDIUM
    );

    return getSingleRow<ExerciseInfo>(results);
  } catch (error) {
    console.error(
      `Failed to get random ${exerciseType} exercise for topic:`,
      error
    );
    return null;
  }
};

/**
 * Get exercise data based on exercise type
 */
export const getExerciseData = async (
  exerciseId: number,
  exerciseType: ExerciseType
): Promise<any[]> => {
  try {
    let query: string;

    switch (exerciseType) {
      case 'pairs':
        query = SQL_QUERIES.GET_PAIR_EXERCISES;
        break;
      case 'conversation':
        query = SQL_QUERIES.GET_CONVERSATION_EXERCISES;
        break;
      case 'translation':
        query = SQL_QUERIES.GET_TRANSLATION_EXERCISES;
        break;
      default:
        throw new Error(`Unknown exercise type: ${exerciseType}`);
    }

    const results = await executeSqlSingle(
      query,
      [exerciseId],
      TIMEOUTS.QUERY_MEDIUM
    );

    return results ? rowsToArray(results.rows) : [];
  } catch (error) {
    console.error(`Failed to get ${exerciseType} exercise data:`, error);

    // Fallback logic for missing tables (as in original code)
    if (exerciseType === 'conversation') {
      try {
        console.log(
          'conversation_exercises table not found, trying chat_details...'
        );
        const fallbackResults = await executeSqlSingle(
          'SELECT * FROM chat_details WHERE id = ?',
          [exerciseId],
          TIMEOUTS.QUERY_MEDIUM
        );
        return fallbackResults ? rowsToArray(fallbackResults.rows) : [];
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    }

    if (exerciseType === 'translation') {
      try {
        console.log(
          'translation_exercises table not found, trying pair_exercises as fallback...'
        );
        const fallbackResults = await executeSqlSingle(
          SQL_QUERIES.GET_PAIR_EXERCISES,
          [exerciseId],
          TIMEOUTS.QUERY_MEDIUM
        );
        return fallbackResults ? rowsToArray(fallbackResults.rows) : [];
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    }

    return [];
  }
};

/**
 * Record an exercise attempt
 */
export const recordExerciseAttempt = async (
  userId: number,
  exerciseId: number,
  isCorrect: boolean
): Promise<void> => {
  try {
    await executeSqlSingle(
      SQL_QUERIES.RECORD_EXERCISE_ATTEMPT,
      [userId, exerciseId, isCorrect ? 1 : 0],
      TIMEOUTS.QUERY_MEDIUM
    );
  } catch (error) {
    console.error('Failed to record exercise attempt:', error);
    throw error;
  }
};

/**
 * Get topic name for an exercise
 */
export const getTopicNameForExercise = async (
  exerciseId: number
): Promise<string | null> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_TOPIC_FOR_EXERCISE,
      [exerciseId],
      TIMEOUTS.QUERY_MEDIUM
    );

    const row = getSingleRow<{ topic: string }>(results);
    return row ? row.topic : null;
  } catch (error) {
    console.error('Failed to get topic name for exercise:', error);
    return null;
  }
};
