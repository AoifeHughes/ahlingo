import { executeSqlSingle, rowsToArray } from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';

/**
 * User statistics and progress tracking service
 */

export interface TopicStats {
  topic: string;
  topic_id: number;
  attempted_exercises: number;
  correct_exercises: number;
  total_exercises: number;
  completion_percentage: number;
}

export interface ProgressSummary {
  total_attempted: number;
  total_correct: number;
  total_available: number;
  overall_completion_percentage: number;
  success_rate: number;
}

export interface FailedExercise {
  exercise_id: number;
  exercise_name: string;
  exercise_type: string;
  topic: string;
  topic_id: number;
  difficulty_level: string;
  language: string;
  last_failed_date: string;
}

/**
 * Get user stats by topic
 */
export const getUserStatsByTopic = async (
  userId: number,
  language: string,
  difficulty: string
): Promise<TopicStats[]> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserStatsByTopic:', userId);
      return [];
    }

    const results = await executeSqlSingle(
      SQL_QUERIES.GET_USER_STATS_BY_TOPIC,
      [language, difficulty, language, difficulty, userId, language, difficulty, language, difficulty, language, difficulty],
      TIMEOUTS.QUERY_LONG
    );

    if (!results || !results.rows) {
      return [];
    }

    const stats = rowsToArray<any>(results.rows);
    return stats.map(stat => ({
      ...stat,
      completion_percentage: stat.total_exercises > 0
        ? Math.round((stat.correct_exercises * 100) / stat.total_exercises)
        : 0
    }));
  } catch (error) {
    console.error('Failed to get user stats by topic:', error);
    return [];
  }
};

/**
 * Get user progress summary
 */
export const getUserProgressSummary = async (
  userId: number,
  language: string,
  difficulty: string
): Promise<ProgressSummary> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserProgressSummary:',
        userId
      );
      return getDefaultProgressSummary();
    }

    const results = await executeSqlSingle(
      SQL_QUERIES.GET_USER_PROGRESS_SUMMARY,
      [language, difficulty, language, difficulty, userId, language, difficulty],
      TIMEOUTS.QUERY_LONG
    );

    if (results && results.rows && results.rows.length > 0) {
      const row = results.rows.item(0);
      return {
        total_attempted: row.total_attempted,
        total_correct: row.total_correct,
        total_available: row.total_available,
        overall_completion_percentage: row.total_available > 0
          ? Math.round((row.total_correct * 100) / row.total_available)
          : 0,
        success_rate: row.total_attempted > 0
          ? Math.round((row.total_correct * 100) / row.total_attempted)
          : 0
      };
    }

    return getDefaultProgressSummary();
  } catch (error) {
    console.error('Failed to get user progress summary:', error);
    return getDefaultProgressSummary();
  }
};

/**
 * Get both user stats and summary in one efficient operation
 */
export const getUserStatsAndSummary = async (
  userId: number,
  language: string,
  difficulty: string
): Promise<{
  stats: TopicStats[];
  summary: ProgressSummary;
}> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserStatsAndSummary:',
        userId
      );
      return {
        stats: [],
        summary: getDefaultProgressSummary(),
      };
    }

    // Execute both queries in parallel
    const [statsResults, summaryResults] = await Promise.all([
      executeSqlSingle(
        SQL_QUERIES.GET_USER_STATS_BY_TOPIC,
        [language, difficulty, language, difficulty, userId, language, difficulty, language, difficulty, language, difficulty],
        TIMEOUTS.QUERY_LONG
      ),
      executeSqlSingle(
        SQL_QUERIES.GET_USER_PROGRESS_SUMMARY,
        [language, difficulty, language, difficulty, userId, language, difficulty],
        TIMEOUTS.QUERY_LONG
      ),
    ]);

    // Process stats results
    const stats = statsResults
      ? rowsToArray<any>(statsResults.rows).map(stat => ({
          ...stat,
          completion_percentage: stat.total_exercises > 0
            ? Math.round((stat.correct_exercises * 100) / stat.total_exercises)
            : 0
        }))
      : [];

    // Process summary results
    let summary: ProgressSummary;
    if (
      summaryResults &&
      summaryResults.rows &&
      summaryResults.rows.length > 0
    ) {
      const row = summaryResults.rows.item(0);
      summary = {
        total_attempted: row.total_attempted,
        total_correct: row.total_correct,
        total_available: row.total_available,
        overall_completion_percentage: row.total_available > 0
          ? Math.round((row.total_correct * 100) / row.total_available)
          : 0,
        success_rate: row.total_attempted > 0
          ? Math.round((row.total_correct * 100) / row.total_attempted)
          : 0
      };
    } else {
      summary = getDefaultProgressSummary();
    }

    return { stats, summary };
  } catch (error) {
    console.error('Failed to get user stats and summary:', error);
    return {
      stats: [],
      summary: getDefaultProgressSummary(),
    };
  }
};

/**
 * Get user failed exercises
 */
export const getUserFailedExercises = async (
  userId: number
): Promise<FailedExercise[]> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserFailedExercises:',
        userId
      );
      return [];
    }

    const results = await executeSqlSingle(
      SQL_QUERIES.GET_FAILED_EXERCISES,
      [userId, userId],
      TIMEOUTS.QUERY_LONG
    );

    return results ? rowsToArray<FailedExercise>(results.rows) : [];
  } catch (error) {
    console.error('Failed to get user failed exercises:', error);
    return [];
  }
};

/**
 * Get default progress summary
 */
const getDefaultProgressSummary = (): ProgressSummary => ({
  total_attempted: 0,
  total_correct: 0,
  total_available: 0,
  overall_completion_percentage: 0,
  success_rate: 0,
});
