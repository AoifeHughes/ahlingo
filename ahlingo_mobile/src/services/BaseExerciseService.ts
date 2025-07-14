import {
  executeSqlSingle,
  getSingleRow,
  rowsToArray,
} from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';
import { Topic, ExerciseInfo, RecentExercise } from '../types';
import { ExerciseType } from '../utils/navigationUtils';
import { SmartRandomizer, DEFAULT_RANDOMIZATION_CONFIG } from '../utils/smartRandomization';

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
 * Get a smart random exercise for a topic with anti-repetition logic
 */
export const getSmartRandomExerciseForTopic = async (
  topicId: number,
  language: string,
  difficulty: string,
  exerciseType: ExerciseType,
  recentExercises: RecentExercise[] = []
): Promise<ExerciseInfo | null> => {
  try {
    // Get all available exercises for this topic
    const exerciseTableJoins = {
      'pairs': 'JOIN pair_exercises pe ON ei.id = pe.exercise_id',
      'conversation': 'JOIN conversation_exercises ce ON ei.id = ce.exercise_id',
      'translation': 'JOIN translation_exercises te ON ei.id = te.exercise_id',
      'fill_in_blank': 'JOIN fill_in_blank_exercises fibe ON ei.id = fibe.exercise_id'
    };
    const dataJoin = exerciseTableJoins[exerciseType as keyof typeof exerciseTableJoins] || 'JOIN pair_exercises pe ON ei.id = pe.exercise_id';
    
    const query = `
      SELECT DISTINCT ei.* FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      ${dataJoin}
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = ?
    `;

    const results = await executeSqlSingle(
      query,
      [topicId, language, difficulty, exerciseType],
      TIMEOUTS.QUERY_MEDIUM
    );

    if (!results || results.rows.length === 0) {
      return null;
    }

    // Convert results to the format expected by smart randomizer
    const availableExercises = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      availableExercises.push({
        exerciseInfo: {
          id: row.id,
          exercise_name: row.exercise_name,
          topic_id: row.topic_id,
          difficulty_id: row.difficulty_id,
          language_id: row.language_id,
          exercise_type: row.exercise_type,
          lesson_id: row.lesson_id
        }
      });
    }

    // Use smart randomization
    const smartRandomizer = new SmartRandomizer(DEFAULT_RANDOMIZATION_CONFIG);
    smartRandomizer.loadRecentExercises(recentExercises);
    
    const selectedExercise = smartRandomizer.selectSingleExercise(availableExercises);
    
    return selectedExercise ? selectedExercise.exerciseInfo : null;
  } catch (error) {
    console.error(
      `Failed to get smart random ${exerciseType} exercise for topic:`,
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
      case 'fill_in_blank':
        query = SQL_QUERIES.GET_FILL_IN_BLANK_EXERCISES;
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
