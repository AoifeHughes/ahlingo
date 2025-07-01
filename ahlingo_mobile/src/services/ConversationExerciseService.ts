import { executeSqlSingle, getSingleRow, rowsToArray } from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';

/**
 * Conversation exercise specific service
 */

/**
 * Get conversation summary for a specific exercise
 */
export const getConversationSummary = async (exerciseId: number): Promise<string | null> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_CONVERSATION_SUMMARY,
      [exerciseId],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    const row = getSingleRow<{summary: string}>(results);
    return row ? row.summary : null;
  } catch (error) {
    console.error('Failed to get conversation summary:', error);
    return null;
  }
};

/**
 * Get random conversation summaries for multiple choice options (excluding current exercise)
 */
export const getRandomConversationSummaries = async (
  currentExerciseId: number,
  count: number = 2
): Promise<string[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_RANDOM_SUMMARIES,
      [currentExerciseId, count],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    if (!results || !results.rows) return [];
    
    const summaries: string[] = [];
    const summaryArray = rowsToArray<{summary: string}>(results.rows);
    summaryArray.forEach(row => {
      summaries.push(row.summary);
    });
    
    return summaries;
  } catch (error) {
    console.error('Failed to get random conversation summaries:', error);
    return [];
  }
};