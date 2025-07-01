import { executeSqlSingle, getSingleRow, rowsToArray } from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';

/**
 * User management service - handles all user-related database operations
 */

export interface UserSettings {
  [key: string]: string;
}

/**
 * Get the most recent user (by last login)
 */
export const getMostRecentUser = async (): Promise<string> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_RECENT_USER,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    if (results && results.rows.length > 0) {
      return results.rows.item(0).name;
    } else {
      // Create default user if none exists
      await createDefaultUser();
      return 'default_user';
    }
  } catch (error) {
    console.error('Failed to get most recent user:', error);
    return 'default_user';
  }
};

/**
 * Create a default user
 */
const createDefaultUser = async (): Promise<void> => {
  try {
    await executeSqlSingle(
      SQL_QUERIES.CREATE_USER,
      ['default_user'],
      TIMEOUTS.QUERY_MEDIUM
    );
  } catch (error) {
    console.error('Failed to create default user:', error);
  }
};

/**
 * Get user ID by username, create user if doesn't exist
 */
export const getUserId = async (username: string): Promise<number | null> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_USER_BY_NAME,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    if (results && results.rows.length > 0) {
      return results.rows.item(0).id;
    }
    
    // User doesn't exist, create them
    console.log('User not found, creating user:', username);
    await executeSqlSingle(
      SQL_QUERIES.CREATE_USER,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    // Get the newly created user's ID
    const newUserResults = await executeSqlSingle(
      SQL_QUERIES.GET_USER_BY_NAME,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );
    
    if (newUserResults && newUserResults.rows.length > 0) {
      return newUserResults.rows.item(0).id;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
};

/**
 * Get user settings by username
 */
export const getUserSettings = async (username: string): Promise<UserSettings> => {
  try {
    // First ensure user exists
    const userResults = await executeSqlSingle(
      SQL_QUERIES.GET_USER_BY_NAME,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );

    let userId: number;
    if (!userResults || !userResults.rows || userResults.rows.length === 0) {
      // Create user if doesn't exist
      await executeSqlSingle(
        SQL_QUERIES.CREATE_USER,
        [username],
        TIMEOUTS.QUERY_MEDIUM
      );
      const newUserResults = await executeSqlSingle(
        SQL_QUERIES.GET_USER_BY_NAME,
        [username],
        TIMEOUTS.QUERY_MEDIUM
      );
      userId = newUserResults.rows.item(0).id;
    } else {
      userId = userResults.rows.item(0).id;
    }

    // Get user settings
    const settingsResults = await executeSqlSingle(
      SQL_QUERIES.GET_USER_SETTINGS,
      [userId],
      TIMEOUTS.QUERY_MEDIUM
    );

    const settings: UserSettings = {};
    if (settingsResults && settingsResults.rows) {
      const settingsArray = rowsToArray<{setting_name: string; setting_value: string}>(settingsResults.rows);
      settingsArray.forEach(row => {
        settings[row.setting_name] = row.setting_value;
      });
    }

    return settings;
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return {};
  }
};

/**
 * Set a user setting
 */
export const setUserSetting = async (username: string, settingName: string, settingValue: string): Promise<void> => {
  try {
    // Get or create user
    const userResults = await executeSqlSingle(
      SQL_QUERIES.GET_USER_BY_NAME,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );

    let userId: number;
    if (!userResults || !userResults.rows || userResults.rows.length === 0) {
      await executeSqlSingle(
        SQL_QUERIES.CREATE_USER,
        [username],
        TIMEOUTS.QUERY_MEDIUM
      );
      const newUserResults = await executeSqlSingle(
        SQL_QUERIES.GET_USER_BY_NAME,
        [username],
        TIMEOUTS.QUERY_MEDIUM
      );
      userId = newUserResults.rows.item(0).id;
    } else {
      userId = userResults.rows.item(0).id;
    }

    // Insert or update setting
    await executeSqlSingle(
      SQL_QUERIES.UPSERT_USER_SETTING,
      [userId, settingName, settingValue],
      TIMEOUTS.QUERY_MEDIUM
    );
  } catch (error) {
    console.error('Failed to set user setting:', error);
    throw error;
  }
};

/**
 * Update user's last login timestamp
 */
export const updateUserLogin = async (username: string): Promise<void> => {
  try {
    await executeSqlSingle(
      SQL_QUERIES.UPDATE_USER_LOGIN,
      [username],
      TIMEOUTS.QUERY_MEDIUM
    );
  } catch (error) {
    console.error('Failed to update user login:', error);
  }
};

/**
 * Get user settings with validation, ensuring user exists
 */
export const getUserSettingsWithValidation = async (username: string): Promise<{
  settings: UserSettings;
  userId: number;
}> => {
  const settings = await getUserSettings(username);
  const userId = await getUserId(username);
  
  if (!userId) {
    throw new Error('Failed to create or retrieve user');
  }
  
  return { settings, userId };
};