import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { Language, Topic, Difficulty, PairExercise, ExerciseInfo, ConversationExercise } from '../types';

// Enable debug mode to see SQL logs
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// First, ensure the database is copied from bundle to Documents
async function ensureDatabaseCopied() {
  try {
    const databaseName = 'languageLearningDatabase.db'; // Note: capital L
    const bundlePath = Platform.OS === 'ios' 
      ? `${RNFS.MainBundlePath}/${databaseName}`
      : `android_asset/${databaseName}`;
    
    const documentsPath = Platform.OS === 'ios'
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

export const logDatabaseTables = async () => {
  let db = null;
  
  try {
    // First ensure database is copied
    await ensureDatabaseCopied();
    
    console.log('🔄 Opening database...');
    
    // Open database from Documents directory (where we just copied it)
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db', // Note: capital L
      location: 'Documents' // This is the key difference!
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
        console.error(`     Error counting rows:`, error instanceof Error ? error.message : error);
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
        console.error(`     Error getting columns:`, colError instanceof Error ? colError.message : colError);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error);
    console.error('Details:', error instanceof Error ? error.message : error);
  } finally {
    // Always close the database
    if (db) {
      try {
        await db.close();
        console.log('✅ Database closed');
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

// Database operations for app functionality
export const getLanguages = async (): Promise<Language[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    const results = await db.executeSql('SELECT * FROM languages ORDER BY language');
    
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getDifficulties = async (): Promise<Difficulty[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    const results = await db.executeSql('SELECT * FROM difficulties ORDER BY difficulty_level');
    
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getTopics = async (): Promise<Topic[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getMostRecentUser = async (): Promise<string> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    const results = await db.executeSql(
      'SELECT name FROM users ORDER BY last_login DESC LIMIT 1'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

const createDefaultUser = async (): Promise<void> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    await db.executeSql(
      'INSERT OR IGNORE INTO users (name, last_login) VALUES (?, datetime("now"))',
      ['default_user']
    );
  } catch (error) {
    console.error('Failed to create default user:', error);
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getUserSettings = async (username: string): Promise<{ [key: string]: string }> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    // First ensure user exists
    const userResults = await db.executeSql(
      'SELECT id FROM users WHERE name = ?',
      [username]
    );

    let userId: number;
    if (!userResults || !userResults[0] || userResults[0].rows.length === 0) {
      // Create user if doesn't exist
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

    // Get user settings
    const settingsResults = await db.executeSql(
      'SELECT setting_name, setting_value FROM user_settings WHERE user_id = ?',
      [userId]
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const setUserSetting = async (username: string, settingName: string, settingValue: string): Promise<void> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const updateUserLogin = async (username: string): Promise<void> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    await db.executeSql(
      'UPDATE users SET last_login = datetime("now") WHERE name = ?',
      [username]
    );
  } catch (error) {
    console.error('Failed to update user login:', error);
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

// Pairs game specific database operations
export const getTopicsForPairs = async (language: string, difficulty: string): Promise<Topic[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getRandomExerciseForTopic = async (topicId: number, language: string, difficulty: string): Promise<ExerciseInfo | null> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getPairExercises = async (exerciseId: number): Promise<PairExercise[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getExercisesByLesson = async (lessonId: string): Promise<ExerciseInfo[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};


export const getRandomConversationExerciseForTopic = async (topicId: number, language: string, difficulty: string): Promise<ExerciseInfo | null> => {
  let db = null;
  
  try {
    console.log(`🔍 [DEBUG] Getting random conversation exercise - Topic: ${topicId}, Language: ${language}, Difficulty: ${difficulty}`);
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
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
    
    console.log("📋 [DEBUG] Executing query with params:", [topicId, language, difficulty]);
    const results = await db.executeSql(query, [topicId, language, difficulty]);
    
    if (results && results[0] && results[0].rows.length > 0) {
      const exercise = results[0].rows.item(0);
      console.log("✅ [DEBUG] Found exercise:", exercise);
      return exercise;
    }
    
    console.log("❌ [DEBUG] No exercise found");
    return null;
  } catch (error) {
    console.error('❌ [ERROR] Failed to get random conversation exercise for topic:', error);
    return null;
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export const getConversationExercises = async (exerciseId: number): Promise<ConversationExercise[]> => {
  let db = null;
  
  try {
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    const results = await db.executeSql(
      'SELECT * FROM conversation_exercises WHERE exercise_id = ? ORDER BY conversation_order, id',
      [exerciseId]
    );
    
    const conversations: ConversationExercise[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        conversations.push(results[0].rows.item(i));
      }
    }
    
    return conversations;
  } catch (error) {
    console.error('Failed to get conversation exercises:', error);
    return [];
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

export interface ConversationGroup {
  conversationOrder: number;
  messages: ConversationExercise[];
}

export const getGroupedConversationExercises = async (exerciseId: number): Promise<ConversationGroup[]> => {
  let db = null;
  
  try {
    console.log(`🔍 [DEBUG] Getting grouped conversations for exercise ${exerciseId}`);
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db',
      location: 'Documents'
    });
    
    const results = await db.executeSql(
      'SELECT * FROM conversation_exercises WHERE exercise_id = ? ORDER BY conversation_order, id',
      [exerciseId]
    );
    
    console.log("📋 [DEBUG] Query results:", results);
    
    const conversations: ConversationExercise[] = [];
    if (results && results[0]) {
      console.log(`📊 [DEBUG] Found ${results[0].rows.length} conversation messages`);
      for (let i = 0; i < results[0].rows.length; i++) {
        const conv = results[0].rows.item(i);
        console.log(`📝 [DEBUG] Message ${i}:`, conv);
        conversations.push(conv);
      }
    }
    
    // Group conversations by conversation_order
    const grouped: { [key: number]: ConversationExercise[] } = {};
    conversations.forEach(conv => {
      if (!grouped[conv.conversation_order]) {
        grouped[conv.conversation_order] = [];
      }
      grouped[conv.conversation_order].push(conv);
    });
    
    console.log("📦 [DEBUG] Grouped conversations:", grouped);
    
    // Convert to array of ConversationGroup objects
    const conversationGroups: ConversationGroup[] = Object.keys(grouped)
      .map(key => parseInt(key))
      .sort((a, b) => a - b)
      .map(order => ({
        conversationOrder: order,
        messages: grouped[order]
      }));
    
    console.log("✅ [DEBUG] Final conversation groups:", conversationGroups);
    return conversationGroups;
  } catch (error) {
    console.error('❌ [ERROR] Failed to get grouped conversation exercises:', error);
    return [];
  } finally {
    if (db) {
      try {
        await db.close();
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};

// Conversation exercises specific database operations with debugging
export const getTopicsForConversations = async (language: string, difficulty: string): Promise<Topic[]> => {
  let db = null;
  
  try {
    console.log(`🔍 [DEBUG] Getting topics for conversations - Language: ${language}, Difficulty: ${difficulty}`);
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: "languageLearningDatabase.db",
      location: "Documents"
    });
    
    console.log("📂 [DEBUG] Database opened for conversation topics query");
    
    const query = `
      SELECT DISTINCT t.id, t.topic 
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      WHERE l.language = ? 
        AND d.difficulty_level = ?
        AND ei.exercise_type = "conversation"
      ORDER BY t.topic
    `;
    
    console.log("📋 [DEBUG] Executing query:", query);
    console.log("📋 [DEBUG] Query parameters:", [language, difficulty]);
    
    const results = await db.executeSql(query, [language, difficulty]);
    
    console.log("📊 [DEBUG] Query results:", results);
    console.log("📊 [DEBUG] Results length:", results.length);
    if (results && results[0]) {
      console.log("📊 [DEBUG] First result rows length:", results[0].rows.length);
    }
    
    const topics: Topic[] = [];
    if (results && results[0]) {
      for (let i = 0; i < results[0].rows.length; i++) {
        const topic = results[0].rows.item(i);
        console.log(`📝 [DEBUG] Topic ${i}:`, topic);
        topics.push(topic);
      }
    }
    
    console.log("✅ [DEBUG] Final topics array:", topics);
    return topics;
  } catch (error) {
    console.error("❌ [ERROR] Failed to get topics for conversations:", error);
    return [];
  } finally {
    if (db) {
      try {
        await db.close();
        console.log("🔒 [DEBUG] Database closed for conversation topics");
      } catch (closeError) {
        console.error("❌ [ERROR] Error closing database:", closeError);
      }
    }
  }
};

export const debugConversationTables = async (): Promise<void> => {
  let db = null;
  
  try {
    console.log("🔍 [DEBUG] Starting conversation tables inspection...");
    await ensureDatabaseCopied();
    
    db = await SQLite.openDatabase({
      name: "languageLearningDatabase.db",
      location: "Documents"
    });
    
    // Check exercises_info for conversation type
    console.log("📋 [DEBUG] Checking exercises_info for conversation exercises...");
    const exercisesQuery = "SELECT * FROM exercises_info WHERE exercise_type = \"conversation\" LIMIT 5";
    const exercisesResults = await db.executeSql(exercisesQuery);
    
    if (exercisesResults && exercisesResults[0]) {
      console.log(`📊 [DEBUG] Found ${exercisesResults[0].rows.length} conversation exercises`);
      for (let i = 0; i < exercisesResults[0].rows.length; i++) {
        console.log(`📝 [DEBUG] Exercise ${i}:`, exercisesResults[0].rows.item(i));
      }
    }
    
    // Check conversation_exercises table
    console.log("📋 [DEBUG] Checking conversation_exercises table...");
    const conversationQuery = "SELECT * FROM conversation_exercises LIMIT 10";
    const conversationResults = await db.executeSql(conversationQuery);
    
    if (conversationResults && conversationResults[0]) {
      console.log(`📊 [DEBUG] Found ${conversationResults[0].rows.length} conversation messages`);
      for (let i = 0; i < conversationResults[0].rows.length; i++) {
        console.log(`📝 [DEBUG] Message ${i}:`, conversationResults[0].rows.item(i));
      }
    }
    
  } catch (error) {
    console.error("❌ [ERROR] Failed to debug conversation tables:", error);
  } finally {
    if (db) {
      try {
        await db.close();
        console.log("🔒 [DEBUG] Database closed after conversation debug");
      } catch (closeError) {
        console.error("❌ [ERROR] Error closing database:", closeError);
      }
    }
  }
};
