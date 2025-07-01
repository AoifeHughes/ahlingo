import SQLite, {
  Database as SQLiteDatabase,
} from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
  Language,
  Topic,
  Difficulty,
  PairExercise,
  ExerciseInfo,
  ConversationExercise,
  TranslationExercise,
} from '../types';

// Enable debug mode to see SQL logs
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// Connection timeout wrapper
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
};

// Safe database cleanup helper
const safeCloseDatabase = async (db: SQLiteDatabase | null): Promise<void> => {
  if (!db) return;

  try {
    // First, check if database is still open
    // Some databases might already be closed due to errors

    // Try to rollback any pending transactions
    try {
      await withTimeout(db.executeSql('ROLLBACK'), 2000);
    } catch (rollbackError) {
      // Rollback might fail if:
      // 1. No transaction is active (normal)
      // 2. Database is already closed (normal)
      // 3. Database is corrupted (we'll still try to close)
      const errorMsg =
        rollbackError instanceof Error
          ? rollbackError.message
          : String(rollbackError);
      if (
        !errorMsg.includes('database is locked') &&
        !errorMsg.includes('not an error')
      ) {
        console.log(
          'Rollback not needed or failed (this is usually normal):',
          errorMsg
        );
      }
    }

    // Wait a brief moment for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));

    // Now try to close the database with timeout
    await withTimeout(db.close(), 3000);
    console.log('✅ Database closed safely');
  } catch (closeError) {
    const errorMsg =
      closeError instanceof Error ? closeError.message : String(closeError);
    // Only log errors that aren't "already closed" type errors
    if (
      !errorMsg.includes('database is closed') &&
      !errorMsg.includes('invalid connection')
    ) {
      console.error('Error during safe database close:', errorMsg);
    }
  }
};

// First, ensure the database is copied from bundle to Documents
async function ensureDatabaseCopied() {
  try {
    const databaseName = 'languageLearningDatabase.db'; // Note: capital L
    const bundlePath =
      Platform.OS === 'ios'
        ? `${RNFS.MainBundlePath}/${databaseName}`
        : `android_asset/${databaseName}`;

    const documentsPath =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

    const databasePath = `${documentsPath}/${databaseName}`;

    const exists = await RNFS.exists(databasePath);

    if (!exists) {
      console.log('Database not found in documents, copying from bundle...');

      if (Platform.OS === 'ios') {
        await RNFS.copyFile(bundlePath, databasePath);
      } else {
        await RNFS.copyFileAssets(databaseName, databasePath);
      }

      console.log('Database copied successfully to:', databasePath);
    } else {
      console.log('Database already exists at:', databasePath);
    }

    // Verify the file
    const stats = await RNFS.stat(databasePath);
    console.log('Database file size:', stats.size, 'bytes');
  } catch (error) {
    console.error('Failed to copy database:', error);
    throw error;
  }
}

export const logDatabaseTables = async (): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    // First ensure database is copied
    await ensureDatabaseCopied();

    console.log('🔄 Opening database...');

    // Open database from Documents directory (where we just copied it)
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db', // Note: capital L
      location: 'Documents', // This is the key difference!
    });

    console.log('✅ Database opened successfully');

    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test connection
    await db.executeSql('SELECT 1');
    console.log('✅ Database connection verified');

    // Query all table names
    const results = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
    );

    if (!results || !results[0]) {
      console.log('No results returned');
      return;
    }

    const tables = results[0].rows;
    console.log(`\n📊 Found ${tables.length} tables:\n`);

    // Log each table name
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables.item(i).name;
      console.log(`  📋 ${tableName}`);

      // Get row count for each table
      try {
        const countResult = await db.executeSql(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        const count = countResult[0].rows.item(0).count;
        console.log(`     Rows: ${count}`);
      } catch (error) {
        console.error(
          `     Error counting rows:`,
          error instanceof Error ? error.message : error
        );
      }

      // Get column info for each table
      try {
        const columnResults = await db.executeSql(
          `PRAGMA table_info("${tableName}");`
        );

        if (columnResults && columnResults[0]) {
          const columns = columnResults[0].rows;
          console.log(`     Columns:`);

          for (let j = 0; j < columns.length; j++) {
            const col = columns.item(j);
            console.log(`       - ${col.name} (${col.type})`);
          }
        }
      } catch (colError) {
        console.error(
          `     Error getting columns:`,
          colError instanceof Error ? colError.message : colError
        );
      }

      console.log(''); // Empty line for readability
    }
  } catch (error) {
    console.error('❌ Database Error:', error);
    console.error('Details:', error instanceof Error ? error.message : error);
  } finally {
    // Always close the database safely
    await safeCloseDatabase(db);
  }
};

// Database operations for app functionality
export const getLanguages = async (): Promise<Language[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT * FROM languages ORDER BY language'
    );

    const languages: Language[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        languages.push(results[0].rows.item(i));
      }
    }

    return languages;
  } catch (error) {
    console.error('Failed to get languages:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getDifficulties = async (): Promise<Difficulty[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT * FROM difficulties ORDER BY difficulty_level'
    );

    const difficulties: Difficulty[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        difficulties.push(results[0].rows.item(i));
      }
    }

    return difficulties;
  } catch (error) {
    console.error('Failed to get difficulties:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getTopics = async (): Promise<Topic[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql('SELECT * FROM topics ORDER BY topic');

    const topics: Topic[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        topics.push(results[0].rows.item(i));
      }
    }

    return topics;
  } catch (error) {
    console.error('Failed to get topics:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getMostRecentUser = async (): Promise<string> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    const results = await withTimeout(
      db.executeSql('SELECT name FROM users ORDER BY last_login DESC LIMIT 1'),
      5000
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0).name;
    } else {
      // Create default user if none exists
      await createDefaultUser();
      return 'default_user';
    }
  } catch (error) {
    console.error('Failed to get most recent user:', error);
    return 'default_user';
  } finally {
    await safeCloseDatabase(db);
  }
};

const createDefaultUser = async (): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    await db.executeSql(
      'INSERT OR IGNORE INTO users (name, last_login) VALUES (?, datetime("now"))',
      ['default_user']
    );
  } catch (error) {
    console.error('Failed to create default user:', error);
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getUserSettings = async (
  username: string
): Promise<{ [key: string]: string }> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    // First ensure user exists
    const userResults = await withTimeout(
      db.executeSql('SELECT id FROM users WHERE name = ?', [username]),
      5000
    );

    let userId: number;
    if (!userResults || !userResults[0] || userResults[0].rows.length === 0) {
      // Create user if doesn't exist
      await withTimeout(
        db.executeSql(
          'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
          [username]
        ),
        5000
      );
      const newUserResults = await withTimeout(
        db.executeSql('SELECT id FROM users WHERE name = ?', [username]),
        5000
      );
      userId = newUserResults[0].rows.item(0).id;
    } else {
      userId = userResults[0].rows.item(0).id;
    }

    // Get user settings
    const settingsResults = await withTimeout(
      db.executeSql(
        'SELECT setting_name, setting_value FROM user_settings WHERE user_id = ?',
        [userId]
      ),
      5000
    );

    const settings: { [key: string]: string } = {};
    if (settingsResults && settingsResults[0]) {
      for (let i = 0; i < settingsResults[0].rows.length; i++) {
        const row = settingsResults[0].rows.item(i);
        settings[row.setting_name] = row.setting_value;
      }
    }

    return settings;
  } catch (error) {
    console.error('Failed to get user settings:', error);
    return {};
  } finally {
    await safeCloseDatabase(db);
  }
};

export const setUserSetting = async (
  username: string,
  settingName: string,
  settingValue: string
): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    // Get or create user
    const userResults = await db.executeSql(
      'SELECT id FROM users WHERE name = ?',
      [username]
    );

    let userId: number;
    if (!userResults || !userResults[0] || userResults[0].rows.length === 0) {
      await db.executeSql(
        'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
        [username]
      );
      const newUserResults = await db.executeSql(
        'SELECT id FROM users WHERE name = ?',
        [username]
      );
      userId = newUserResults[0].rows.item(0).id;
    } else {
      userId = userResults[0].rows.item(0).id;
    }

    // Insert or update setting
    await db.executeSql(
      'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
      [userId, settingName, settingValue]
    );
  } catch (error) {
    console.error('Failed to set user setting:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const updateUserLogin = async (username: string): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    await db.executeSql(
      'UPDATE users SET last_login = datetime("now") WHERE name = ?',
      [username]
    );
  } catch (error) {
    console.error('Failed to update user login:', error);
  } finally {
    await safeCloseDatabase(db);
  }
};

// Pairs game specific database operations
export const getTopicsForPairs = async (
  language: string,
  difficulty: string
): Promise<Topic[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT DISTINCT t.id, t.topic
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'pairs'
      ORDER BY t.topic
    `;

    const results = await db.executeSql(query, [language, difficulty]);

    const topics: Topic[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        topics.push(results[0].rows.item(i));
      }
    }

    return topics;
  } catch (error) {
    console.error('Failed to get topics for pairs:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getRandomExerciseForTopic = async (
  topicId: number,
  language: string,
  difficulty: string
): Promise<ExerciseInfo | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT ei.* FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'pairs'
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const results = await db.executeSql(query, [topicId, language, difficulty]);

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return null;
  } catch (error) {
    console.error('Failed to get random exercise for topic:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getPairExercises = async (
  exerciseId: number
): Promise<PairExercise[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT * FROM pair_exercises WHERE exercise_id = ? ORDER BY id',
      [exerciseId]
    );

    const pairs: PairExercise[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        pairs.push(results[0].rows.item(i));
      }
    }

    return pairs;
  } catch (error) {
    console.error('Failed to get pair exercises:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getExercisesByLesson = async (
  lessonId: string
): Promise<ExerciseInfo[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT * FROM exercises_info WHERE lesson_id = ? AND exercise_type = "pairs" ORDER BY id',
      [lessonId]
    );

    const exercises: ExerciseInfo[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        exercises.push(results[0].rows.item(i));
      }
    }

    return exercises;
  } catch (error) {
    console.error('Failed to get exercises by lesson:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Conversation exercise specific database operations
export const getTopicsForConversation = async (
  language: string,
  difficulty: string
): Promise<Topic[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT DISTINCT t.id, t.topic
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'conversation'
      ORDER BY t.topic
    `;

    const results = await db.executeSql(query, [language, difficulty]);

    const topics: Topic[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        topics.push(results[0].rows.item(i));
      }
    }

    return topics;
  } catch (error) {
    console.error('Failed to get topics for conversation:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getRandomConversationExerciseForTopic = async (
  topicId: number,
  language: string,
  difficulty: string
): Promise<ExerciseInfo | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT ei.* FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'conversation'
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const results = await db.executeSql(query, [topicId, language, difficulty]);

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return null;
  } catch (error) {
    console.error(
      'Failed to get random conversation exercise for topic:',
      error
    );
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getConversationExerciseData = async (
  exerciseId: number
): Promise<any[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    // First, try to get from conversation_exercises table if it exists
    try {
      const results = await db.executeSql(
        'SELECT * FROM conversation_exercises WHERE exercise_id = ? ORDER BY id',
        [exerciseId]
      );

      const conversations: any[] = [];
      if (results && results[0]) {
        for (let i = 0; i < results[0].rows.length; i++) {
          conversations.push(results[0].rows.item(i));
        }
      }

      return conversations;
    } catch (tableError) {
      console.log(
        'conversation_exercises table not found, trying chat_details...'
      );

      // Fallback: try to get from chat_details if conversation_exercises doesn't exist
      const results = await db.executeSql(
        'SELECT * FROM chat_details WHERE id = ?',
        [exerciseId]
      );

      const chatDetails: any[] = [];
      if (results && results[0]) {
        for (let i = 0; i < results[0].rows.length; i++) {
          chatDetails.push(results[0].rows.item(i));
        }
      }

      return chatDetails;
    }
  } catch (error) {
    console.error('Failed to get conversation exercise data:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Translation exercise specific database operations
export const getTopicsForTranslation = async (
  language: string,
  difficulty: string
): Promise<Topic[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT DISTINCT t.id, t.topic
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'translation'
      ORDER BY t.topic
    `;

    const results = await db.executeSql(query, [language, difficulty]);

    const topics: Topic[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        topics.push(results[0].rows.item(i));
      }
    }

    return topics;
  } catch (error) {
    console.error('Failed to get topics for translation:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getRandomTranslationExerciseForTopic = async (
  topicId: number,
  language: string,
  difficulty: string
): Promise<ExerciseInfo | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const query = `
      SELECT ei.* FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type = 'translation'
      ORDER BY RANDOM()
      LIMIT 1
    `;

    const results = await db.executeSql(query, [topicId, language, difficulty]);

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return null;
  } catch (error) {
    console.error(
      'Failed to get random translation exercise for topic:',
      error
    );
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getTranslationExerciseData = async (
  exerciseId: number
): Promise<any[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    // First, try to get from translation_exercises table if it exists
    try {
      const results = await db.executeSql(
        'SELECT * FROM translation_exercises WHERE exercise_id = ? ORDER BY id',
        [exerciseId]
      );

      const translations: any[] = [];
      if (results && results[0]) {
        for (let i = 0; i < results[0].rows.length; i++) {
          translations.push(results[0].rows.item(i));
        }
      }

      return translations;
    } catch (tableError) {
      console.log(
        'translation_exercises table not found, trying pair_exercises as fallback...'
      );

      // Fallback: try to get from pair_exercises if translation_exercises doesn't exist
      const results = await db.executeSql(
        'SELECT * FROM pair_exercises WHERE exercise_id = ? ORDER BY id',
        [exerciseId]
      );

      const pairData: any[] = [];
      if (results && results[0]) {
        for (let i = 0; i < results[0].rows.length; i++) {
          pairData.push(results[0].rows.item(i));
        }
      }

      return pairData;
    }
  } catch (error) {
    console.error('Failed to get translation exercise data:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get conversation summary for a specific exercise
export const getConversationSummary = async (
  exerciseId: number
): Promise<string | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT summary FROM conversation_summaries WHERE exercise_id = ?',
      [exerciseId]
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0).summary;
    }

    return null;
  } catch (error) {
    console.error('Failed to get conversation summary:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get random conversation summaries for multiple choice options (excluding current exercise)
export const getRandomConversationSummaries = async (
  currentExerciseId: number,
  count: number = 2
): Promise<string[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT summary FROM conversation_summaries WHERE exercise_id != ? ORDER BY RANDOM() LIMIT ?',
      [currentExerciseId, count]
    );

    const summaries: string[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        summaries.push(results[0].rows.item(i).summary);
      }
    }

    return summaries;
  } catch (error) {
    console.error('Failed to get random conversation summaries:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get topic name for an exercise
export const getTopicNameForExercise = async (
  exerciseId: number
): Promise<string | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      'SELECT t.topic FROM exercises_info ei JOIN topics t ON ei.topic_id = t.id WHERE ei.id = ?',
      [exerciseId]
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0).topic;
    }

    return null;
  } catch (error) {
    console.error('Failed to get topic name for exercise:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

// Record exercise attempt
export const recordExerciseAttempt = async (
  userId: number,
  exerciseId: number,
  isCorrect: boolean
): Promise<void> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    await db.executeSql(
      'INSERT INTO user_exercise_attempts (user_id, exercise_id, is_correct, attempt_date) VALUES (?, ?, ?, datetime("now"))',
      [userId, exerciseId, isCorrect ? 1 : 0]
    );
  } catch (error) {
    console.error('Failed to record exercise attempt:', error);
    throw error;
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get user ID by username
export const getUserId = async (username: string): Promise<number | null> => {
  let db: SQLiteDatabase | null = null;

  try {
    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    const results = await withTimeout(
      db.executeSql('SELECT id FROM users WHERE name = ?', [username]),
      5000
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0).id;
    }

    // User doesn't exist, create them (fallback behavior)
    console.log('User not found, creating user:', username);
    await db.executeSql(
      'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
      [username]
    );

    // Get the newly created user's ID
    const newUserResults = await db.executeSql(
      'SELECT id FROM users WHERE name = ?',
      [username]
    );

    if (
      newUserResults &&
      newUserResults[0] &&
      newUserResults[0].rows.length > 0
    ) {
      return newUserResults[0].rows.item(0).id;
    }

    return null;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get user stats by topic
export const getUserStatsByTopic = async (userId: number): Promise<any[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error('Invalid userId provided to getUserStatsByTopic:', userId);
      return [];
    }

    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    const results = await withTimeout(
      db.executeSql(
        `
      SELECT
        t.topic,
        t.id as topic_id,
        COUNT(DISTINCT uea.exercise_id) as attempted_exercises,
        COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as correct_exercises,
        COUNT(DISTINCT ei.id) as total_exercises,
        ROUND(
          CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
          CAST(COUNT(DISTINCT ei.id) AS FLOAT) * 100, 1
        ) as completion_percentage
      FROM topics t
      LEFT JOIN exercises_info ei ON t.id = ei.topic_id
      LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
      GROUP BY t.id, t.topic
      ORDER BY t.topic
    `,
        [userId]
      ),
      7000
    );

    const stats: any[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        stats.push(results[0].rows.item(i));
      }
    }

    return stats;
  } catch (error) {
    console.error('Failed to get user stats by topic:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get user failed exercises
export const getUserFailedExercises = async (
  userId: number
): Promise<any[]> => {
  let db: SQLiteDatabase | null = null;

  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserFailedExercises:',
        userId
      );
      return [];
    }

    await ensureDatabaseCopied();

    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents',
    });

    const results = await db.executeSql(
      `
      SELECT DISTINCT
        ei.id as exercise_id,
        ei.exercise_name,
        ei.exercise_type,
        t.topic,
        t.id as topic_id,
        d.difficulty_level,
        l.language,
        MAX(uea.attempt_date) as last_failed_date
      FROM user_exercise_attempts uea
      JOIN exercises_info ei ON uea.exercise_id = ei.id
      JOIN topics t ON ei.topic_id = t.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      JOIN languages l ON ei.language_id = l.id
      WHERE uea.user_id = ?
        AND uea.is_correct = 0
        AND ei.id NOT IN (
          SELECT exercise_id
          FROM user_exercise_attempts
          WHERE user_id = ? AND is_correct = 1
        )
      GROUP BY ei.id, ei.exercise_name, ei.exercise_type, t.topic, t.id, d.difficulty_level, l.language
      ORDER BY last_failed_date DESC
    `,
      [userId, userId]
    );

    const failedExercises: any[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        failedExercises.push(results[0].rows.item(i));
      }
    }

    return failedExercises;
  } catch (error) {
    console.error('Failed to get user failed exercises:', error);
    return [];
  } finally {
    await safeCloseDatabase(db);
  }
};

// Get user progress summary
// Batched function to get both stats and summary in one connection
export const getUserStatsAndSummary = async (
  userId: number
): Promise<{
  stats: any[];
  summary: any;
}> => {
  let db: SQLiteDatabase | null = null;

  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserStatsAndSummary:',
        userId
      );
      return {
        stats: [],
        summary: {
          total_attempted: 0,
          total_correct: 0,
          total_available: 0,
          overall_completion_percentage: 0,
          success_rate: 0,
        },
      };
    }

    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    // Execute both queries in parallel using the same connection
    const [statsResults, summaryResults] = await Promise.all([
      withTimeout(
        db.executeSql(
          `
        SELECT
          t.topic,
          t.id as topic_id,
          COUNT(DISTINCT uea.exercise_id) as attempted_exercises,
          COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as correct_exercises,
          COUNT(DISTINCT ei.id) as total_exercises,
          ROUND(
            CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
            CAST(COUNT(DISTINCT ei.id) AS FLOAT) * 100, 1
          ) as completion_percentage
        FROM topics t
        LEFT JOIN exercises_info ei ON t.id = ei.topic_id
        LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
        GROUP BY t.id, t.topic
        ORDER BY t.topic
      `,
          [userId]
        ),
        7000
      ),

      withTimeout(
        db.executeSql(
          `
        SELECT
          COUNT(DISTINCT uea.exercise_id) as total_attempted,
          COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as total_correct,
          COUNT(DISTINCT ei.id) as total_available,
          ROUND(
            CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
            CAST(COUNT(DISTINCT ei.id) AS FLOAT) * 100, 1
          ) as overall_completion_percentage,
          ROUND(
            CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
            CAST(COUNT(DISTINCT uea.exercise_id) AS FLOAT) * 100, 1
          ) as success_rate
        FROM exercises_info ei
        LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
      `,
          [userId]
        ),
        7000
      ),
    ]);

    // Process stats results
    const stats: any[] = [];
    if (statsResults && statsResults[0]) {
      for (let i = 0; i < statsResults[0].rows.length; i++) {
        stats.push(statsResults[0].rows.item(i));
      }
    }

    // Process summary results
    let summary;
    if (
      summaryResults &&
      summaryResults[0] &&
      summaryResults[0].rows.length > 0
    ) {
      summary = summaryResults[0].rows.item(0);
    } else {
      summary = {
        total_attempted: 0,
        total_correct: 0,
        total_available: 0,
        overall_completion_percentage: 0,
        success_rate: 0,
      };
    }

    return { stats, summary };
  } catch (error) {
    console.error('Failed to get user stats and summary:', error);
    return {
      stats: [],
      summary: {
        total_attempted: 0,
        total_correct: 0,
        total_available: 0,
        overall_completion_percentage: 0,
        success_rate: 0,
      },
    };
  } finally {
    await safeCloseDatabase(db);
  }
};

export const getUserProgressSummary = async (userId: number): Promise<any> => {
  let db: SQLiteDatabase | null = null;

  try {
    // Validate input
    if (!userId || userId <= 0) {
      console.error(
        'Invalid userId provided to getUserProgressSummary:',
        userId
      );
      return {
        total_attempted: 0,
        total_correct: 0,
        total_available: 0,
        overall_completion_percentage: 0,
        success_rate: 0,
      };
    }

    await ensureDatabaseCopied();

    db = await withTimeout(
      SQLite.openDatabase({
        name: 'languageLearningDatabase.db',
        location: 'Documents',
      }),
      3000
    );

    const results = await withTimeout(
      db.executeSql(
        `
      SELECT
        COUNT(DISTINCT uea.exercise_id) as total_attempted,
        COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as total_correct,
        COUNT(DISTINCT ei.id) as total_available,
        ROUND(
          CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
          CAST(COUNT(DISTINCT ei.id) AS FLOAT) * 100, 1
        ) as overall_completion_percentage,
        ROUND(
          CAST(COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) AS FLOAT) /
          CAST(COUNT(DISTINCT uea.exercise_id) AS FLOAT) * 100, 1
        ) as success_rate
      FROM exercises_info ei
      LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
    `,
        [userId]
      ),
      7000
    );

    if (results && results[0] && results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }

    return {
      total_attempted: 0,
      total_correct: 0,
      total_available: 0,
      overall_completion_percentage: 0,
      success_rate: 0,
    };
  } catch (error) {
    console.error('Failed to get user progress summary:', error);
    return {
      total_attempted: 0,
      total_correct: 0,
      total_available: 0,
      overall_completion_percentage: 0,
      success_rate: 0,
    };
  } finally {
    await safeCloseDatabase(db);
  }
};
