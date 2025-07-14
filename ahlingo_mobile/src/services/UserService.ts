import {
  executeSqlSingle,
  getSingleRow,
  rowsToArray,
} from '../utils/databaseUtils';
import { SQL_QUERIES, TIMEOUTS } from '../utils/constants';

/**
 * User management service - handles all user-related database operations
 */

export interface UserSettings {
  [key: string]: string;
}

/**
 * Check if any users exist in the database
 */
export const checkUsersExist = async (): Promise<boolean> => {
  try {
    const results = await executeSqlSingle(
      SQL_QUERIES.GET_RECENT_USER,
      [],
      TIMEOUTS.QUERY_MEDIUM
    );

    return results && results.rows.length > 0;
  } catch (error) {
    console.error('Failed to check if users exist:', error);
    return false;
  }
};

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
export const getUserSettings = async (
  username: string
): Promise<UserSettings> => {
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
      const settingsArray = rowsToArray<{
        setting_name: string;
        setting_value: string;
      }>(settingsResults.rows);
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
export const setUserSetting = async (
  username: string,
  settingName: string,
  settingValue: string
): Promise<void> => {
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
export const getUserSettingsWithValidation = async (
  username: string
): Promise<{
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

/**
 * Get current user context (user info and settings)
 */
export const getUserContext = async (): Promise<{
  username: string;
  userId: number | null;
  settings: {
    language: string;
    difficulty: string;
  };
}> => {
  try {
    const username = await getMostRecentUser();
    const userId = await getUserId(username);
    const settings = await getUserSettings(username);

    // If no settings exist, get defaults from database
    let language = settings.language;
    let difficulty = settings.difficulty;

    if (!language || !difficulty) {
      // Get defaults directly from database to avoid circular dependencies
      if (!language) {
        try {
          const languageResult = await executeSqlSingle(
            SQL_QUERIES.GET_LANGUAGES,
            [],
            TIMEOUTS.QUERY_MEDIUM
          );
          language = languageResult && languageResult.rows && languageResult.rows.length > 0 
            ? languageResult.rows.item(0).language 
            : 'English';
        } catch (error) {
          console.error('Failed to get default language:', error);
          language = 'English';
        }
      }
      
      if (!difficulty) {
        try {
          const difficultyResult = await executeSqlSingle(
            SQL_QUERIES.GET_DIFFICULTIES,
            [],
            TIMEOUTS.QUERY_MEDIUM
          );
          difficulty = difficultyResult && difficultyResult.rows && difficultyResult.rows.length > 0
            ? difficultyResult.rows.item(0).difficulty_level
            : 'Beginner';
        } catch (error) {
          console.error('Failed to get default difficulty:', error);
          difficulty = 'Beginner';
        }
      }
    }

    return {
      username,
      userId,
      settings: {
        language,
        difficulty,
      },
    };
  } catch (error) {
    console.error('Failed to get user context:', error);
    // Even on error, try to get database defaults
    try {
      let language = 'English';
      let difficulty = 'Beginner';
      
      try {
        const languageResult = await executeSqlSingle(SQL_QUERIES.GET_LANGUAGES, [], TIMEOUTS.QUERY_MEDIUM);
        if (languageResult && languageResult.rows && languageResult.rows.length > 0) {
          language = languageResult.rows.item(0).language;
        }
      } catch (langError) {
        console.error('Failed to get fallback language:', langError);
      }
      
      try {
        const difficultyResult = await executeSqlSingle(SQL_QUERIES.GET_DIFFICULTIES, [], TIMEOUTS.QUERY_MEDIUM);
        if (difficultyResult && difficultyResult.rows && difficultyResult.rows.length > 0) {
          difficulty = difficultyResult.rows.item(0).difficulty_level;
        }
      } catch (diffError) {
        console.error('Failed to get fallback difficulty:', diffError);
      }
      
      return {
        username: 'default_user',
        userId: null,
        settings: {
          language,
          difficulty,
        },
      };
    } catch (dbError) {
      console.error('Failed to get database defaults:', dbError);
      // Last resort fallback
      return {
        username: 'default_user',
        userId: null,
        settings: {
          language: 'English',
          difficulty: 'Beginner',
        },
      };
    }
  }
};

/**
 * Reset user data (delete all user attempts and settings)
 */
export const resetUserData = async (username: string): Promise<void> => {
  try {
    const userId = await getUserId(username);
    if (!userId) {
      throw new Error('User not found');
    }

    // Delete user exercise attempts
    await executeSqlSingle(
      'DELETE FROM user_exercise_attempts WHERE user_id = ?',
      [userId],
      TIMEOUTS.QUERY_MEDIUM
    );

    // Delete user settings 
    await executeSqlSingle(
      'DELETE FROM user_settings WHERE user_id = ?',
      [userId],
      TIMEOUTS.QUERY_MEDIUM
    );

    console.log('✅ User data reset successfully for:', username);
  } catch (error) {
    console.error('Failed to reset user data:', error);
    throw error;
  }
};

/**
 * Complete app reset - delete all users and data (returns to welcome screen)
 */
export const resetAppCompletely = async (): Promise<void> => {
  try {
    // Delete all user exercise attempts
    await executeSqlSingle(
      'DELETE FROM user_exercise_attempts',
      [],
      TIMEOUTS.QUERY_MEDIUM
    );

    // Delete all user settings
    await executeSqlSingle(
      'DELETE FROM user_settings',
      [],
      TIMEOUTS.QUERY_MEDIUM
    );

    // Delete all users
    await executeSqlSingle(
      'DELETE FROM users',
      [],
      TIMEOUTS.QUERY_MEDIUM
    );

    console.log('✅ App reset completely - all user data deleted');
  } catch (error) {
    console.error('Failed to reset app completely:', error);
    throw error;
  }
};
