import AsyncStorage from '@react-native-async-storage/async-storage';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { getDatabase, executeQuery, rowsToArray } from '../utils/databaseUtils';

/**
 * Database Migration Service
 *
 * Handles database version migrations while preserving user data.
 * When a new database version is detected, this service:
 * 1. Backs up user data (users, settings, chats) to AsyncStorage
 * 2. Calculates and stores aggregate statistics
 * 3. Allows database replacement
 * 4. Restores user data to the new database
 */

const MIGRATION_STORAGE_KEY = '@database_migration_backup';
const MIGRATION_IN_PROGRESS_KEY = '@migration_in_progress';

export interface UserBackup {
  users: Array<any>;
  userSettings: Array<any>;
  chatDetails: Array<any>;
  chatHistories: Array<any>;
  aggregateStats: AggregateStats;
  metadata: {
    backupDate: string;
    oldVersion: number;
    newVersion: number;
  };
}

export interface AggregateStats {
  totalAttempts: number;
  totalCorrect: number;
  topicsAttempted: Array<{
    topicId: number;
    topicName: string;
    attemptedCount: number;
    correctCount: number;
  }>;
  languageStats: {
    [language: string]: {
      totalAttempts: number;
      totalCorrect: number;
    };
  };
}

/**
 * Calculate aggregate statistics from user_exercise_attempts before migration
 */
export const calculateAggregateStats = async (
  userId: number
): Promise<AggregateStats> => {
  try {
    console.log(`📊 Calculating aggregate stats for user ${userId}...`);

    // Get total attempts and correct count
    const totalStats = await executeQuery(async (db) => {
      const result = await db.executeSql(
        `SELECT
          COUNT(*) as totalAttempts,
          SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as totalCorrect
        FROM user_exercise_attempts
        WHERE user_id = ?`,
        [userId]
      );
      return result[0].rows.item(0);
    });

    // Get per-topic stats
    const topicStats = await executeQuery(async (db) => {
      const result = await db.executeSql(
        `SELECT
          t.id as topicId,
          t.topic as topicName,
          COUNT(DISTINCT uea.exercise_id) as attemptedCount,
          COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as correctCount
        FROM user_exercise_attempts uea
        JOIN exercises_info ei ON uea.exercise_id = ei.id
        JOIN topics t ON ei.topic_id = t.id
        WHERE uea.user_id = ?
        GROUP BY t.id, t.topic`,
        [userId]
      );
      return rowsToArray(result[0].rows);
    });

    // Get per-language stats
    const languageStatsArray = await executeQuery(async (db) => {
      const result = await db.executeSql(
        `SELECT
          l.language,
          COUNT(*) as totalAttempts,
          SUM(CASE WHEN uea.is_correct = 1 THEN 1 ELSE 0 END) as totalCorrect
        FROM user_exercise_attempts uea
        JOIN exercises_info ei ON uea.exercise_id = ei.id
        JOIN languages l ON ei.language_id = l.id
        WHERE uea.user_id = ?
        GROUP BY l.language`,
        [userId]
      );
      return rowsToArray(result[0].rows);
    });

    // Convert language stats array to object
    const languageStats: AggregateStats['languageStats'] = {};
    languageStatsArray.forEach((stat: any) => {
      languageStats[stat.language] = {
        totalAttempts: stat.totalAttempts || 0,
        totalCorrect: stat.totalCorrect || 0,
      };
    });

    const stats: AggregateStats = {
      totalAttempts: totalStats.totalAttempts || 0,
      totalCorrect: totalStats.totalCorrect || 0,
      topicsAttempted: topicStats,
      languageStats,
    };

    console.log(`✅ Aggregate stats calculated: ${stats.totalAttempts} total attempts, ${stats.totalCorrect} correct`);
    return stats;
  } catch (error) {
    console.error('❌ Failed to calculate aggregate stats:', error);
    // Return empty stats on error rather than failing migration
    return {
      totalAttempts: 0,
      totalCorrect: 0,
      topicsAttempted: [],
      languageStats: {},
    };
  }
};

/**
 * Backup all user data from the database to AsyncStorage
 */
export const backupUserData = async (
  oldVersion: number,
  newVersion: number
): Promise<UserBackup> => {
  try {
    console.log('💾 Starting user data backup...');

    const db = await getDatabase();

    // Backup users table
    const usersResult = await db.executeSql('SELECT * FROM users');
    const users = rowsToArray(usersResult[0].rows);
    console.log(`  - Backed up ${users.length} users`);

    // Backup user_settings table
    const settingsResult = await db.executeSql('SELECT * FROM user_settings');
    const userSettings = rowsToArray(settingsResult[0].rows);
    console.log(`  - Backed up ${userSettings.length} user settings`);

    // Backup chat_details table
    const chatDetailsResult = await db.executeSql('SELECT * FROM chat_details');
    const chatDetails = rowsToArray(chatDetailsResult[0].rows);
    console.log(`  - Backed up ${chatDetails.length} chat sessions`);

    // Backup chat_histories table
    const chatHistoriesResult = await db.executeSql('SELECT * FROM chat_histories');
    const chatHistories = rowsToArray(chatHistoriesResult[0].rows);
    console.log(`  - Backed up ${chatHistories.length} chat messages`);

    // Calculate aggregate stats for each user
    let aggregateStats: AggregateStats = {
      totalAttempts: 0,
      totalCorrect: 0,
      topicsAttempted: [],
      languageStats: {},
    };

    if (users.length > 0) {
      // For now, assuming single user (default_user)
      // In multi-user scenario, we'd need to store per-user stats
      const userId = users[0].id;
      aggregateStats = await calculateAggregateStats(userId);
    }

    const backup: UserBackup = {
      users,
      userSettings,
      chatDetails,
      chatHistories,
      aggregateStats,
      metadata: {
        backupDate: new Date().toISOString(),
        oldVersion,
        newVersion,
      },
    };

    // Store backup in AsyncStorage
    await AsyncStorage.setItem(MIGRATION_STORAGE_KEY, JSON.stringify(backup));
    console.log('✅ User data backup completed successfully');

    return backup;
  } catch (error) {
    console.error('❌ Failed to backup user data:', error);
    throw new Error(`Backup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Restore user data from backup into the new database
 */
export const restoreUserData = async (backup: UserBackup): Promise<void> => {
  try {
    console.log('📥 Starting user data restoration...');

    const db = await getDatabase();

    // Restore users
    console.log(`  - Restoring ${backup.users.length} users...`);
    for (const user of backup.users) {
      await db.executeSql(
        'INSERT OR REPLACE INTO users (id, name, last_login) VALUES (?, ?, ?)',
        [user.id, user.name, user.last_login]
      );
    }

    // Restore user_settings
    console.log(`  - Restoring ${backup.userSettings.length} user settings...`);
    for (const setting of backup.userSettings) {
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [setting.user_id, setting.setting_name, setting.setting_value]
      );
    }

    // Store aggregate stats as settings for the user
    if (backup.users.length > 0 && backup.aggregateStats) {
      const userId = backup.users[0].id;
      console.log('  - Storing aggregate statistics as settings...');

      // Store total stats
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, 'legacy_total_attempts', backup.aggregateStats.totalAttempts.toString()]
      );
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, 'legacy_total_correct', backup.aggregateStats.totalCorrect.toString()]
      );

      // Store per-language stats
      const languageStatsJson = JSON.stringify(backup.aggregateStats.languageStats);
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, 'legacy_language_stats', languageStatsJson]
      );

      // Store per-topic stats
      const topicStatsJson = JSON.stringify(backup.aggregateStats.topicsAttempted);
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, 'legacy_topic_stats', topicStatsJson]
      );

      // Store migration date
      await db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, 'last_migration_date', backup.metadata.backupDate]
      );

      console.log('  - Aggregate stats stored successfully');
    }

    // Restore chat_details
    console.log(`  - Restoring ${backup.chatDetails.length} chat sessions...`);
    for (const chat of backup.chatDetails) {
      // Check if chat_name column exists, handle gracefully if not
      const columns = Object.keys(chat);
      const hasChatName = columns.includes('chat_name');

      if (hasChatName) {
        await db.executeSql(
          'INSERT OR REPLACE INTO chat_details (id, user_id, language, difficulty, model, chat_name, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [chat.id, chat.user_id, chat.language, chat.difficulty, chat.model, chat.chat_name, chat.created_at, chat.last_updated]
        );
      } else {
        await db.executeSql(
          'INSERT OR REPLACE INTO chat_details (id, user_id, language, difficulty, model, created_at, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [chat.id, chat.user_id, chat.language, chat.difficulty, chat.model, chat.created_at, chat.last_updated]
        );
      }
    }

    // Restore chat_histories
    console.log(`  - Restoring ${backup.chatHistories.length} chat messages...`);
    for (const message of backup.chatHistories) {
      await db.executeSql(
        'INSERT OR REPLACE INTO chat_histories (id, chat_id, role, content, timestamp) VALUES (?, ?, ?, ?, ?)',
        [message.id, message.chat_id, message.role, message.content, message.timestamp]
      );
    }

    console.log('✅ User data restoration completed successfully');
  } catch (error) {
    console.error('❌ Failed to restore user data:', error);
    throw new Error(`Restore failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Check if a migration is currently in progress
 */
export const isMigrationInProgress = async (): Promise<boolean> => {
  const inProgress = await AsyncStorage.getItem(MIGRATION_IN_PROGRESS_KEY);
  return inProgress === 'true';
};

/**
 * Mark migration as in progress
 */
export const setMigrationInProgress = async (inProgress: boolean): Promise<void> => {
  await AsyncStorage.setItem(MIGRATION_IN_PROGRESS_KEY, inProgress ? 'true' : 'false');
};

/**
 * Get stored backup data (useful for debugging or recovery)
 */
export const getStoredBackup = async (): Promise<UserBackup | null> => {
  try {
    const backupJson = await AsyncStorage.getItem(MIGRATION_STORAGE_KEY);
    if (!backupJson) {
      return null;
    }
    return JSON.parse(backupJson);
  } catch (error) {
    console.error('Failed to retrieve stored backup:', error);
    return null;
  }
};

/**
 * Clear stored backup after successful migration
 */
export const clearStoredBackup = async (): Promise<void> => {
  await AsyncStorage.removeItem(MIGRATION_STORAGE_KEY);
};

/**
 * Main migration orchestration function
 * This is called from databaseUtils when a version mismatch is detected
 */
export const performDatabaseMigration = async (
  oldVersion: number,
  newVersion: number,
  replaceDatabase: () => Promise<void>
): Promise<void> => {
  try {
    console.log('🔄 ======================================');
    console.log(`🔄 Starting database migration: v${oldVersion} → v${newVersion}`);
    console.log('🔄 ======================================');

    // Check if migration is already in progress
    if (await isMigrationInProgress()) {
      throw new Error('Migration already in progress');
    }

    // Mark migration as in progress
    await setMigrationInProgress(true);

    // Step 1: Backup user data
    console.log('Step 1/4: Backing up user data...');
    const backup = await backupUserData(oldVersion, newVersion);

    // Step 2: Replace database (handled by caller)
    console.log('Step 2/4: Replacing database with new version...');
    await replaceDatabase();

    // Step 3: Restore user data
    console.log('Step 3/4: Restoring user data to new database...');
    await restoreUserData(backup);

    // Step 4: Cleanup
    console.log('Step 4/4: Cleaning up...');
    await clearStoredBackup();
    await setMigrationInProgress(false);

    console.log('🎉 ======================================');
    console.log('🎉 Migration completed successfully!');
    console.log('🎉 ======================================');
  } catch (error) {
    console.error('💥 ======================================');
    console.error('💥 Migration failed!');
    console.error('💥 ======================================');
    console.error(error);

    // Mark migration as not in progress so it can be retried
    await setMigrationInProgress(false);

    throw error;
  }
};

/**
 * Attempt to recover from a failed migration
 * This can be called if the app detects migration failure on startup
 */
export const attemptMigrationRecovery = async (): Promise<boolean> => {
  try {
    console.log('🔧 Attempting migration recovery...');

    const backup = await getStoredBackup();
    if (!backup) {
      console.log('No backup found, cannot recover');
      return false;
    }

    // Try to restore the backup
    await restoreUserData(backup);
    await clearStoredBackup();
    await setMigrationInProgress(false);

    console.log('✅ Migration recovery successful');
    return true;
  } catch (error) {
    console.error('❌ Migration recovery failed:', error);
    return false;
  }
};
