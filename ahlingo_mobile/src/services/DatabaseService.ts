import SQLite from 'react-native-sqlite-storage';
import { 
  Language, 
  Topic, 
  Difficulty, 
  ExerciseInfo, 
  PairExercise, 
  ConversationExercise, 
  TranslationExercise, 
  User, 
  UserSetting 
} from '../types';

// Enable debugging for SQLite
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private static instance: DatabaseService;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initializeDatabase(): Promise<void> {
    try {
      // Open database from bundled file - this copies the prepopulated database from app bundle
      console.log('DatabaseService: Opening bundled database...');
      this.db = await SQLite.openDatabase({
        name: 'languagelearningdatabase.db',
        location: 'default',
        createFromLocation: '~languagelearningdatabase.db', // Load from app bundle
      });

      console.log('Database opened successfully');
      
      // Add delay to ensure database is fully ready for transactions
      console.log('Waiting for database to be ready...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log basic database info
      await this.logDatabaseInfo();
      
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }


  private async logDatabaseInfo(): Promise<void> {
    if (!this.db) return;

    try {
      console.log('=== Database Information ===');
      
      // List all tables in the database
      const [tablesResult] = await this.db.executeSql(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
      
      const tables: string[] = [];
      for (let i = 0; i < tablesResult.rows.length; i++) {
        tables.push(tablesResult.rows.item(i).name);
      }
      
      console.log('Tables found:', tables.join(', '));
      console.log(`Total tables: ${tables.length}`);
      
      // Check counts for main tables
      const tableChecks = ['languages', 'topics', 'difficulties', 'exercises_info', 'pair_exercises'];
      
      for (const tableName of tableChecks) {
        if (tables.includes(tableName)) {
          try {
            const [result] = await this.db.executeSql(`SELECT COUNT(*) as count FROM ${tableName}`);
            console.log(`- ${tableName}: ${result.rows.item(0).count} records`);
          } catch (error) {
            console.warn(`Could not count ${tableName}:`, error);
          }
        }
      }
      
      console.log('===========================');
      
    } catch (error) {
      console.error('Failed to log database info:', error);
    }
  }


  // Languages operations
  public async getLanguages(): Promise<Language[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql('SELECT * FROM languages ORDER BY language');
      const languages: Language[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        languages.push(results.rows.item(i));
      }
      
      return languages;
    } catch (error) {
      console.error('Failed to get languages:', error);
      throw error;
    }
  }

  // Topics operations
  public async getTopics(): Promise<Topic[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql('SELECT * FROM topics ORDER BY topic');
      const topics: Topic[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        topics.push(results.rows.item(i));
      }
      
      return topics;
    } catch (error) {
      console.error('Failed to get topics:', error);
      throw error;
    }
  }

  // Get topics filtered by language and difficulty
  public async getTopicsByLanguageAndDifficulty(language: string, difficulty: string): Promise<Topic[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT DISTINCT t.* FROM topics t
        JOIN exercises_info ei ON t.id = ei.topic_id
        JOIN languages l ON l.id = ei.language_id
        JOIN difficulties d ON d.id = ei.difficulty_id
        WHERE l.language = ? AND d.difficulty_level = ?
        ORDER BY t.topic
      `;
      
      const [results] = await this.db.executeSql(query, [language, difficulty]);
      const topics: Topic[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        topics.push(results.rows.item(i));
      }
      
      return topics;
    } catch (error) {
      console.error('Failed to get filtered topics:', error);
      throw error;
    }
  }

  // Difficulties operations
  public async getDifficulties(): Promise<Difficulty[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql('SELECT * FROM difficulties ORDER BY difficulty_level');
      const difficulties: Difficulty[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        difficulties.push(results.rows.item(i));
      }
      
      return difficulties;
    } catch (error) {
      console.error('Failed to get difficulties:', error);
      throw error;
    }
  }

  // User operations
  public async getMostRecentUser(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const [results] = await this.db.executeSql(
        'SELECT name FROM users ORDER BY last_login DESC LIMIT 1'
      );
      
      if (results.rows.length > 0) {
        return results.rows.item(0).name;
      } else {
        // Create default user if none exists
        await this.createDefaultUser();
        return 'default_user';
      }
    } catch (error) {
      console.error('Failed to get most recent user:', error);
      // Return default user on error
      return 'default_user';
    }
  }

  private async createDefaultUser(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'INSERT OR IGNORE INTO users (name, last_login) VALUES (?, datetime("now"))',
        ['default_user']
      );
    } catch (error) {
      console.error('Failed to create default user:', error);
    }
  }

  public async updateUserLogin(username: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.executeSql(
        'UPDATE users SET last_login = datetime("now") WHERE name = ?',
        [username]
      );
    } catch (error) {
      console.error('Failed to update user login:', error);
    }
  }

  // User settings operations
  public async getUserSettings(username: string): Promise<{ [key: string]: string }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // First ensure user exists
      const [userResults] = await this.db.executeSql(
        'SELECT id FROM users WHERE name = ?',
        [username]
      );

      let userId: number;
      if (userResults.rows.length === 0) {
        // Create user if doesn't exist
        await this.db.executeSql(
          'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
          [username]
        );
        const [newUserResults] = await this.db.executeSql(
          'SELECT id FROM users WHERE name = ?',
          [username]
        );
        userId = newUserResults.rows.item(0).id;
      } else {
        userId = userResults.rows.item(0).id;
      }

      // Get user settings
      const [settingsResults] = await this.db.executeSql(
        'SELECT setting_name, setting_value FROM user_settings WHERE user_id = ?',
        [userId]
      );

      const settings: { [key: string]: string } = {};
      for (let i = 0; i < settingsResults.rows.length; i++) {
        const row = settingsResults.rows.item(i);
        settings[row.setting_name] = row.setting_value;
      }

      return settings;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      return {};
    }
  }

  public async setUserSetting(username: string, settingName: string, settingValue: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get or create user
      const [userResults] = await this.db.executeSql(
        'SELECT id FROM users WHERE name = ?',
        [username]
      );

      let userId: number;
      if (userResults.rows.length === 0) {
        await this.db.executeSql(
          'INSERT INTO users (name, last_login) VALUES (?, datetime("now"))',
          [username]
        );
        const [newUserResults] = await this.db.executeSql(
          'SELECT id FROM users WHERE name = ?',
          [username]
        );
        userId = newUserResults.rows.item(0).id;
      } else {
        userId = userResults.rows.item(0).id;
      }

      // Insert or update setting
      await this.db.executeSql(
        'INSERT OR REPLACE INTO user_settings (user_id, setting_name, setting_value) VALUES (?, ?, ?)',
        [userId, settingName, settingValue]
      );
    } catch (error) {
      console.error('Failed to set user setting:', error);
      throw error;
    }
  }

  // Exercise operations
  public async getRandomPairExercise(topicId: number, language: string, difficulty: string): Promise<PairExercise[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const query = `
        SELECT pe.* FROM pair_exercises pe
        JOIN exercises_info ei ON pe.exercise_id = ei.id
        JOIN languages l ON l.id = ei.language_id
        JOIN difficulties d ON d.id = ei.difficulty_id
        WHERE ei.topic_id = ? AND l.language = ? AND d.difficulty_level = ?
        ORDER BY RANDOM()
        LIMIT 10
      `;
      
      const [results] = await this.db.executeSql(query, [topicId, language, difficulty]);
      const pairs: PairExercise[] = [];
      
      for (let i = 0; i < results.rows.length; i++) {
        pairs.push(results.rows.item(i));
      }
      
      return pairs;
    } catch (error) {
      console.error('Failed to get random pair exercises:', error);
      throw error;
    }
  }

  public async closeDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        console.log('Database closed successfully');
      } catch (error) {
        console.error('Failed to close database:', error);
      }
      this.db = null;
    }
  }
}

export default DatabaseService;