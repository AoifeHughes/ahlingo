import { executeSqlSingle, getSingleRow, rowsToArray } from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';
import { Language, Topic, Difficulty } from '../types';

/**
 * Main database service - provides access to basic data
 */

/**
 * Log all database tables (for debugging)
 */
export const logDatabaseTables = async (): Promise<void> => {
  try {
    console.log('🔄 Querying database tables...');
    
    // Query all table names
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_TABLES,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    if (!results || !results.rows) {
      console.log('No results returned');
      return;
    }
    
    const tables = results.rows;
    console.log(`\n📊 Found ${tables.length} tables:\n`);
    
    // Log each table name
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables.item(i).name;
      console.log(`  📋 ${tableName}`);
      
      // Get row count for each table
      try {
        const countResult = await executeSqlSingle(
          SQL_QUERIES.COUNT_ROWS(tableName),
          [],
          TIMEOUTS.QUERY_SHORT
        );
        const count = countResult.rows.item(0).count;
        console.log(`     Rows: ${count}`);
      } catch (error) {
        console.error(`     Error counting rows:`, error instanceof Error ? error.message : error);
      }
      
      // Get column info for each table
      try {
        const columnResults = await executeSqlSingle(
          SQL_QUERIES.GET_TABLE_INFO(tableName),
          [],
          TIMEOUTS.QUERY_SHORT
        );
        
        if (columnResults && columnResults.rows) {
          const columns = columnResults.rows;
          console.log(`     Columns:`);
          
          for (let j = 0; j < columns.length; j++) {
            const col = columns.item(j);
            console.log(`       - ${col.name} (${col.type})`);
          }
        }
      } catch (colError) {
        console.error(`     Error getting columns:`, colError instanceof Error ? colError.message : colError);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error);
    console.error('Details:', error instanceof Error ? error.message : error);
  }
};

/**
 * Get all languages
 */
export const getLanguages = async (): Promise<Language[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_LANGUAGES,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    return results ? rowsToArray<Language>(results.rows) : [];
  } catch (error) {
    console.error('Failed to get languages:', error);
    return [];
  }
};

/**
 * Get all difficulties
 */
export const getDifficulties = async (): Promise<Difficulty[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_DIFFICULTIES,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    return results ? rowsToArray<Difficulty>(results.rows) : [];
  } catch (error) {
    console.error('Failed to get difficulties:', error);
    return [];
  }
};

/**
 * Get all topics
 */
export const getTopics = async (): Promise<Topic[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_TOPICS,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    return results ? rowsToArray<Topic>(results.rows) : [];
  } catch (error) {
    console.error('Failed to get topics:', error);
    return [];
  }
};

/**
 * Get exercises by lesson ID
 */
export const getExercisesByLesson = async (lessonId: string): Promise<any[]> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_EXERCISES_BY_LESSON,
      [lessonId],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    return results ? rowsToArray(results.rows) : [];
  } catch (error) {
    console.error('Failed to get exercises by lesson:', error);
    return [];
  }
};