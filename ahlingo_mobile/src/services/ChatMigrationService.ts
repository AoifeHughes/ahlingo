/**
 * Chat Migration Service
 *
 * Handles database migrations specific to chat functionality
 */

import { executeQuery } from '../utils/databaseUtils';

/**
 * Migration function to add chat_name column if it doesn't exist
 */
export const migrateChatNameColumn = async (): Promise<void> => {
  return executeQuery(async (db) => {
    try {
      console.log('🔄 Checking chat_name column migration...');

      // Check if chat_name column exists in chat_details table
      const columnResults = await db.executeSql(
        'PRAGMA table_info("chat_details");'
      );

      let hasNameColumn = false;
      if (columnResults && columnResults[0]) {
        const columns = columnResults[0].rows;
        for (let i = 0; i < columns.length; i++) {
          const col = columns.item(i);
          if (col.name === 'chat_name') {
            hasNameColumn = true;
            break;
          }
        }
      }

      if (!hasNameColumn) {
        console.log('📝 Adding chat_name column to chat_details table...');

        // Add the chat_name column with default value
        await db.executeSql(
          'ALTER TABLE chat_details ADD COLUMN chat_name TEXT DEFAULT "Unnamed chat"'
        );

        // Update existing chats to have default names
        await db.executeSql(
          'UPDATE chat_details SET chat_name = "Unnamed chat" WHERE chat_name IS NULL OR chat_name = ""'
        );

        console.log('✅ Successfully added chat_name column and set default names');
      } else {
        console.log('✅ chat_name column already exists');
      }
    } catch (error) {
      console.error('❌ Failed to migrate chat_name column:', error);
      // Don't throw error - migration should be non-blocking
    }
  });
};
