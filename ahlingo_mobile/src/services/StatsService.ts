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
export const getUserStatsByTopic = async (userId: number): Promise<TopicStats[]> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserStatsByTopic:', userId);
      return [];
    }
    
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_USER_STATS_BY_TOPIC,
      [userId],
      TIMEOUTS.QUERY_LONG
    );
    
    return results ? rowsToArray<TopicStats>(results.rows) : [];
  } catch (error) {
    console.error('Failed to get user stats by topic:', error);
    return [];
  }
};

/**
 * Get user progress summary
 */
export const getUserProgressSummary = async (userId: number): Promise<ProgressSummary> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserProgressSummary:', userId);
      return getDefaultProgressSummary();
    }
    
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_USER_PROGRESS_SUMMARY,
      [userId],
      TIMEOUTS.QUERY_LONG
    );
    
    if (results && results.rows && results.rows.length > 0) {
      return results.rows.item(0);
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
export const getUserStatsAndSummary = async (userId: number): Promise<{
  stats: TopicStats[];
  summary: ProgressSummary;
}> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserStatsAndSummary:', userId);
      return {
        stats: [],
        summary: getDefaultProgressSummary()
      };
    }
    
    // Execute both queries in parallel
    const [statsResults, summaryResults] = await Promise.all([
      executeSqlSingle(
        SQL_QUERIES.GET_USER_STATS_BY_TOPIC,
        [userId],
        TIMEOUTS.QUERY_LONG
      ),
      executeSqlSingle(
        SQL_QUERIES.GET_USER_PROGRESS_SUMMARY,
        [userId],
        TIMEOUTS.QUERY_LONG
      )
    ]);
    
    // Process stats results
    const stats = statsResults ? rowsToArray<TopicStats>(statsResults.rows) : [];
    
    // Process summary results
    let summary: ProgressSummary;
    if (summaryResults && summaryResults.rows && summaryResults.rows.length > 0) {
      summary = summaryResults.rows.item(0);
    } else {
      summary = getDefaultProgressSummary();
    }
    
    return { stats, summary };
    
  } catch (error) {
    console.error('Failed to get user stats and summary:', error);
    return {
      stats: [],
      summary: getDefaultProgressSummary()
    };
  }
};

/**
 * Get user failed exercises
 */
export const getUserFailedExercises = async (userId: number): Promise<FailedExercise[]> => {
  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserFailedExercises:', userId);
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
  success_rate: 0
});