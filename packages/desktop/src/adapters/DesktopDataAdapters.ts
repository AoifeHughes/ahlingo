import { 
  ExerciseDataAdapter, 
  UserSettingsDataAdapter,
  DatabaseManager,
  Topic,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  UserSettings,
  Language,
  Difficulty
} from '@ahlingo/core';
import { getDatabasePath } from '../utils/databasePath';

export class DesktopExerciseDataAdapter implements ExerciseDataAdapter {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  private getDatabase() {
    return this.dbManager.getDatabase({
      path: getDatabasePath(),
      isReadOnly: false
    });
  }

  async loadTopics(): Promise<Topic[]> {
    try {
      const db = this.getDatabase();
      return await db.getTopics();
    } catch (error) {
      console.error('Failed to load topics:', error);
      // Fallback to mock data if database fails
      return [
        { id: 1, topic: 'Greetings' },
        { id: 2, topic: 'Numbers' },
        { id: 3, topic: 'Colors' },
        { id: 4, topic: 'Food & Dining' },
        { id: 5, topic: 'Travel' },
      ];
    }
  }

  async loadPairExercises(topicId: number): Promise<PairExercise[]> {
    try {
      const db = this.getDatabase();
      return await db.getPairExercisesByTopic(topicId);
    } catch (error) {
      console.error('Failed to load pair exercises:', error);
      // Fallback to mock data
      return [
        {
          id: 1,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Hello',
          language_2_content: 'Bonjour',
        },
        {
          id: 2,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Goodbye',
          language_2_content: 'Au revoir',
        },
        {
          id: 3,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Thank you',
          language_2_content: 'Merci',
        },
        {
          id: 4,
          exercise_id: 1,
          language_1: 'English',
          language_2: 'French',
          language_1_content: 'Please',
          language_2_content: 'S\'il vous plaît',
        },
      ];
    }
  }

  async loadConversationExercises(topicId: number): Promise<ConversationExercise[]> {
    try {
      const db = this.getDatabase();
      return await db.getConversationExercisesByTopic(topicId);
    } catch (error) {
      console.error('Failed to load conversation exercises:', error);
      return [];
    }
  }

  async loadTranslationExercises(topicId: number): Promise<TranslationExercise[]> {
    try {
      const db = this.getDatabase();
      return await db.getTranslationExercisesByTopic(topicId);
    } catch (error) {
      console.error('Failed to load translation exercises:', error);
      return [];
    }
  }
}

export class DesktopUserSettingsDataAdapter implements UserSettingsDataAdapter {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  private getDatabase() {
    return this.dbManager.getDatabase({
      path: getDatabasePath(),
      isReadOnly: false
    });
  }

  async loadUserSettings(): Promise<UserSettings> {
    try {
      const db = this.getDatabase();
      // For now, return default settings - can be extended to load from database
      const languages = await db.getLanguages();
      const difficulties = await db.getDifficulties();
      
      return {
        language: languages[0] || { id: 1, language: 'French' },
        difficulty: difficulties[0] || { id: 1, difficulty_level: 'Beginner' },
        userId: 1,
      };
    } catch (error) {
      console.error('Failed to load user settings:', error);
      return {
        language: { id: 1, language: 'French' },
        difficulty: { id: 1, difficulty_level: 'Beginner' },
        userId: 1,
      };
    }
  }

  async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    try {
      console.log('Saving user settings (desktop):', settings);
      // TODO: Implement actual saving to database
      return settings;
    } catch (error) {
      console.error('Failed to save user settings:', error);
      return settings;
    }
  }

  async loadReferenceData(): Promise<{ languages: Language[]; difficulties: Difficulty[] }> {
    try {
      const db = this.getDatabase();
      const [languages, difficulties] = await Promise.all([
        db.getLanguages(),
        db.getDifficulties()
      ]);
      
      return { languages, difficulties };
    } catch (error) {
      console.error('Failed to load reference data:', error);
      return {
        languages: [
          { id: 1, language: 'French' },
          { id: 2, language: 'Spanish' },
          { id: 3, language: 'German' },
        ],
        difficulties: [
          { id: 1, difficulty_level: 'Beginner' },
          { id: 2, difficulty_level: 'Intermediate' },
          { id: 3, difficulty_level: 'Advanced' },
        ],
      };
    }
  }
}