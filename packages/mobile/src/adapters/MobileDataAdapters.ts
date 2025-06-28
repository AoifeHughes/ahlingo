import { 
  ExerciseDataAdapter, 
  UserSettingsDataAdapter,
  Topic,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  UserSettings,
  Language,
  Difficulty
} from '@ahlingo/core';
import { SQLiteManager } from '../utils/SQLiteManager';

export class MobileExerciseDataAdapter implements ExerciseDataAdapter {
  private sqliteManager: SQLiteManager;

  constructor() {
    this.sqliteManager = SQLiteManager.getInstance();
  }

  async loadTopics(): Promise<Topic[]> {
    try {
      if (__DEV__) {
        console.log('Loading topics from SQLite database...');
      }
      
      const result = await this.sqliteManager.executeQuery('SELECT * FROM topics ORDER BY id');
      
      if (!result.success) {
        console.error('Failed to load topics:', result.error);
        
        // Check if database needs initialization
        if (result.error?.includes('not initialized')) {
          throw new Error('Database not properly initialized. Please restart the app.');
        }
        
        if (result.isNativeModuleError) {
          throw new Error(`Database connection failed: ${result.error}. This appears to be a native module issue. Please reinstall the app or contact support.`);
        }
        
        throw new Error(`Database unavailable: Unable to load topics. ${result.error}`);
      }

      const topics = (result.data || []).map(row => ({
        id: row.id,
        topic: row.topic
      }));

      if (__DEV__) {
        console.log('Loaded', topics.length, 'topics from database');
      }
      return topics;
      
    } catch (error: any) {
      console.error('Failed to load topics from mobile database:', error);
      throw new Error('Database unavailable: Unable to load topics. Please ensure the app is properly installed.');
    }
  }

  async loadPairExercises(topicId: number): Promise<PairExercise[]> {
    try {
      if (__DEV__) {
        console.log('Loading pair exercises for topic', topicId);
      }

      // Progressive testing: First check what tables exist
      if (__DEV__) {
        console.log('Debug: Checking database tables...');
        const tablesResult = await this.sqliteManager.getAllTables();
        if (tablesResult.success) {
          console.log('Available tables:', tablesResult.data?.map(t => t.name));
        } else {
          console.error('Could not get tables:', tablesResult.error);
        }
      }

      // Test if pair_exercises table exists
      const pairExercisesCount = await this.sqliteManager.getTableRowCount('pair_exercises');
      if (!pairExercisesCount.success) {
        console.error('pair_exercises table issue:', pairExercisesCount.error);
        // Try alternative table names
        const altResult = await this.sqliteManager.testQuery("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%pair%'");
        console.log('Tables containing "pair":', altResult.data);
        throw new Error(`pair_exercises table not found or inaccessible: ${pairExercisesCount.error}`);
      }

      if (__DEV__) {
        console.log('pair_exercises table has', pairExercisesCount.data?.[0]?.count, 'rows');
      }

      // Test if exercises_info table exists (corrected table name)
      const exercisesCount = await this.sqliteManager.getTableRowCount('exercises_info');
      if (!exercisesCount.success) {
        console.error('exercises_info table issue:', exercisesCount.error);
        throw new Error(`exercises_info table not found or inaccessible: ${exercisesCount.error}`);
      }

      if (__DEV__) {
        console.log('exercises_info table has', exercisesCount.data?.[0]?.count, 'rows');
      }

      // Test simple query first
      const simpleTest = await this.sqliteManager.testQuery('SELECT * FROM pair_exercises LIMIT 1');
      if (!simpleTest.success) {
        throw new Error(`Cannot query pair_exercises table: ${simpleTest.error}`);
      }

      // Test exercises_info table for the specific topic
      const topicExercises = await this.sqliteManager.testQuery('SELECT * FROM exercises_info WHERE topic_id = ?', [topicId]);
      if (!topicExercises.success) {
        throw new Error(`Cannot query exercises_info for topic ${topicId}: ${topicExercises.error}`);
      }

      if (__DEV__) {
        console.log(`Found ${topicExercises.data?.length} exercises_info records for topic ${topicId}`);
      }

      // Now try the full JOIN query with correct table name
      const query = `
        SELECT pe.* FROM pair_exercises pe
        JOIN exercises_info e ON pe.exercise_id = e.id
        WHERE e.topic_id = ?
        ORDER BY pe.id
      `;
      const result = await this.sqliteManager.executeQuery(query, [topicId]);
      
      if (!result.success) {
        console.error('Failed to load pair exercises:', result.error);
        
        // Check if database needs initialization
        if (result.error?.includes('not initialized')) {
          throw new Error('Database not properly initialized. Please restart the app.');
        }
        
        if (result.isNativeModuleError) {
          throw new Error(`Database connection failed: ${result.error}. This appears to be a native module issue.`);
        }
        
        throw new Error(`Database unavailable: Unable to load exercises. ${result.error}`);
      }

      const exercises = (result.data || []).map(row => ({
        id: row.id,
        exercise_id: row.exercise_id,
        language_1: row.language_1,
        language_2: row.language_2,
        language_1_content: row.language_1_content,
        language_2_content: row.language_2_content,
      }));

      if (__DEV__) {
        console.log('Loaded', exercises.length, 'pair exercises for topic', topicId);
      }
      return exercises;
      
    } catch (error: any) {
      console.error('Failed to load pair exercises from mobile database:', error);
      throw new Error('Database unavailable: Unable to load exercises. Please ensure the app is properly installed.');
    }
  }

  async loadConversationExercises(topicId: number): Promise<ConversationExercise[]> {
    try {
      if (__DEV__) {
        console.log('Loading conversation exercises for topic', topicId);
      }
      
      const query = `
        SELECT ce.* FROM conversation_exercises ce
        JOIN exercises_info e ON ce.exercise_id = e.id
        WHERE e.topic_id = ?
        ORDER BY ce.conversation_order
      `;
      const result = await this.sqliteManager.executeQuery(query, [topicId]);
      
      if (!result.success) {
        console.error('Failed to load conversation exercises:', result.error);
        
        // Check if database needs initialization
        if (result.error?.includes('not initialized')) {
          throw new Error('Database not properly initialized. Please restart the app.');
        }
        
        throw new Error(`Database unavailable: Unable to load conversation exercises. ${result.error}`);
      }

      const exercises = (result.data || []).map(row => ({
        id: row.id,
        exercise_id: row.exercise_id,
        conversation_order: row.conversation_order,
        speaker: row.speaker,
        message: row.message,
      }));

      if (__DEV__) {
        console.log('Loaded', exercises.length, 'conversation exercises for topic', topicId);
      }
      return exercises;
      
    } catch (error: any) {
      console.error('Failed to load conversation exercises from mobile database:', error);
      throw new Error('Database unavailable: Unable to load conversation exercises.');
    }
  }

  async loadTranslationExercises(topicId: number): Promise<TranslationExercise[]> {
    try {
      if (__DEV__) {
        console.log('Loading translation exercises for topic', topicId);
      }
      
      const query = `
        SELECT te.* FROM translation_exercises te
        JOIN exercises_info e ON te.exercise_id = e.id
        WHERE e.topic_id = ?
        ORDER BY te.id
      `;
      const result = await this.sqliteManager.executeQuery(query, [topicId]);
      
      if (!result.success) {
        console.error('Failed to load translation exercises:', result.error);
        
        // Check if database needs initialization
        if (result.error?.includes('not initialized')) {
          throw new Error('Database not properly initialized. Please restart the app.');
        }
        
        throw new Error(`Database unavailable: Unable to load translation exercises. ${result.error}`);
      }

      const exercises = (result.data || []).map(row => ({
        id: row.id,
        exercise_id: row.exercise_id,
        language_1: row.language_1,
        language_2: row.language_2,
        language_1_content: row.language_1_content,
        language_2_content: row.language_2_content,
      }));

      if (__DEV__) {
        console.log('Loaded', exercises.length, 'translation exercises for topic', topicId);
      }
      return exercises;
      
    } catch (error: any) {
      console.error('Failed to load translation exercises from mobile database:', error);
      throw new Error('Database unavailable: Unable to load translation exercises.');
    }
  }
}

export class MobileUserSettingsDataAdapter implements UserSettingsDataAdapter {
  private sqliteManager: SQLiteManager;

  constructor() {
    this.sqliteManager = SQLiteManager.getInstance();
  }

  async loadUserSettings(): Promise<UserSettings> {
    try {
      if (__DEV__) {
        console.log('Loading user settings...');
      }
      
      const referenceData = await this.loadReferenceData();
      
      // For now, return default settings since we don't have user settings storage yet
      const settings = {
        language: referenceData.languages[0] || { id: 1, language: 'French' },
        difficulty: referenceData.difficulties[0] || { id: 1, difficulty_level: 'Beginner' },
        userId: 1,
      };

      if (__DEV__) {
        console.log('Loaded user settings:', settings);
      }
      return settings;
      
    } catch (error: any) {
      console.error('Failed to load user settings from mobile database:', error);
      throw new Error('Database unavailable: Unable to load user settings.');
    }
  }

  async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    try {
      if (__DEV__) {
        console.log('Saving user settings (mobile):', settings);
      }
      // TODO: Implement actual saving to database when user settings table is available
      return settings;
    } catch (error: any) {
      console.error('Failed to save user settings:', error);
      throw new Error('Database unavailable: Unable to save user settings.');
    }
  }

  async loadReferenceData(): Promise<{ languages: Language[]; difficulties: Difficulty[] }> {
    try {
      if (__DEV__) {
        console.log('Loading reference data...');
      }
      
      const [languageResult, difficultyResult] = await Promise.all([
        this.sqliteManager.executeQuery('SELECT * FROM languages ORDER BY id'),
        this.sqliteManager.executeQuery('SELECT * FROM difficulties ORDER BY id')
      ]);
      
      if (!languageResult.success) {
        throw new Error(`Failed to load languages: ${languageResult.error}`);
      }
      
      if (!difficultyResult.success) {
        throw new Error(`Failed to load difficulties: ${difficultyResult.error}`);
      }
      
      const languages = (languageResult.data || []).map(row => ({
        id: row.id,
        language: row.language
      }));
      
      const difficulties = (difficultyResult.data || []).map(row => ({
        id: row.id,
        difficulty_level: row.difficulty_level
      }));
      
      if (__DEV__) {
        console.log('Loaded reference data:', { 
          languages: languages.length, 
          difficulties: difficulties.length 
        });
      }
      
      return { languages, difficulties };
      
    } catch (error: any) {
      console.error('Failed to load reference data from mobile database:', error);
      throw new Error('Database unavailable: Unable to load reference data.');
    }
  }
}