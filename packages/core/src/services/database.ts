// Mock database implementation for hello world setup
// TODO: Replace with actual better-sqlite3 implementation
import {
  Language,
  Topic,
  Difficulty,
  User,
  UserSetting,
  ExerciseInfo,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  UserExerciseAttempt,
  ChatDetail,
  ChatHistory,
  PronunciationAudio,
  ExerciseWithDetails,
  DatabaseConnectionConfig,
  ExerciseType,
} from '../../types';

export class LanguageLearningDatabase {
  private mockData: any; // Mock database for hello world setup

  constructor(config: DatabaseConnectionConfig) {
    console.log('Initializing mock database with config:', config);
    this.mockData = {
      languages: [
        { id: 1, language: 'French' },
        { id: 2, language: 'Spanish' },
        { id: 3, language: 'German' },
      ],
      topics: [
        { id: 1, topic: 'Greetings' },
        { id: 2, topic: 'Numbers' },
        { id: 3, topic: 'Colors' },
        { id: 4, topic: 'Food & Dining' },
        { id: 5, topic: 'Travel' },
      ],
      difficulties: [
        { id: 1, difficulty_level: 'Beginner' },
        { id: 2, difficulty_level: 'Intermediate' },
        { id: 3, difficulty_level: 'Advanced' },
      ],
      users: [
        { id: 1, name: 'default_user', last_login: new Date() },
      ],
      userSettings: [
        { id: 1, user_id: 1, setting_name: 'language_id', setting_value: '1' },
        { id: 2, user_id: 1, setting_name: 'difficulty_id', setting_value: '1' },
      ],
      pairExercises: [
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
      ],
    };
    
    this.initialize();
    this.logDatabaseStats();
  }

  private initialize(): void {
    console.log('Mock database initialized with sample data');
  }

  private logDatabaseStats(): void {
    console.log(`Database initialized - Topics: ${this.mockData.topics.length}, Exercises: ${this.mockData.pairExercises.length}`);
  }

  // Language operations
  getLanguages(): Language[] {
    return this.mockData.languages;
  }

  getLanguageById(id: number): Language | undefined {
    return this.mockData.languages.find((lang: Language) => lang.id === id);
  }

  // Topic operations
  getTopics(): Topic[] {
    return this.mockData.topics;
  }

  getTopicsByLanguageAndDifficulty(languageId: number, difficultyId: number): Topic[] {
    // For mock implementation, just return all topics
    return this.mockData.topics;
  }

  // Difficulty operations
  getDifficulties(): Difficulty[] {
    return this.mockData.difficulties;
  }

  getDifficultyById(id: number): Difficulty | undefined {
    return this.mockData.difficulties.find((diff: Difficulty) => diff.id === id);
  }

  // User operations
  getMostRecentUser(): string {
    const user = this.mockData.users[0];
    return user ? user.name : 'default_user';
  }

  createUser(name: string): void {
    const newUser = {
      id: this.mockData.users.length + 1,
      name,
      last_login: new Date(),
    };
    this.mockData.users.push(newUser);
  }

  updateUserLogin(username: string): void {
    const user = this.mockData.users.find((u: User) => u.name === username);
    if (user) {
      user.last_login = new Date();
    }
  }

  getUserByName(name: string): User | undefined {
    return this.mockData.users.find((user: User) => user.name === name);
  }

  // User settings operations
  getUserSetting(userId: number, settingName: string): string | undefined {
    const setting = this.mockData.userSettings.find(
      (s: UserSetting) => s.user_id === userId && s.setting_name === settingName
    );
    return setting?.setting_value;
  }

  setUserSetting(userId: number, settingName: string, settingValue: string): void {
    const existingIndex = this.mockData.userSettings.findIndex(
      (s: UserSetting) => s.user_id === userId && s.setting_name === settingName
    );
    
    if (existingIndex >= 0) {
      this.mockData.userSettings[existingIndex].setting_value = settingValue;
    } else {
      this.mockData.userSettings.push({
        id: this.mockData.userSettings.length + 1,
        user_id: userId,
        setting_name: settingName,
        setting_value: settingValue,
      });
    }
  }

  getUserSettings(userId: number): Record<string, string> {
    const settings = this.mockData.userSettings.filter(
      (s: UserSetting) => s.user_id === userId
    );
    
    return settings.reduce((acc: Record<string, string>, setting: UserSetting) => {
      acc[setting.setting_name] = setting.setting_value;
      return acc;
    }, {});
  }

  // Exercise operations
  getExercisesByType(exerciseType: ExerciseType): ExerciseInfo[] {
    // Mock implementation - return empty array for now
    return [];
  }

  getExercisesWithDetails(topicId: number, difficultyId: number, languageId: number, exerciseType: ExerciseType): ExerciseWithDetails[] {
    // Mock implementation - return empty array for now
    return [];
  }

  // Pair exercise operations
  getRandomPairExercise(topicId: number, difficultyId: number, languageId: number): PairExercise[] {
    // For mock implementation, return all pair exercises
    return this.mockData.pairExercises;
  }

  getPairExercisesByTopic(topicId: number): PairExercise[] {
    // For mock implementation, return all pair exercises
    // In a real implementation, this would filter by topicId
    return this.mockData.pairExercises;
  }

  // Conversation exercise operations
  getConversationExercises(exerciseId: number): ConversationExercise[] {
    return [];
  }

  getConversationExercisesByTopic(topicId: number): ConversationExercise[] {
    // For mock implementation, return empty array
    // In a real implementation, this would filter by topicId
    return [];
  }

  // Translation exercise operations
  getTranslationExercises(exerciseId: number): TranslationExercise[] {
    return [];
  }

  getTranslationExercisesByTopic(topicId: number): TranslationExercise[] {
    // For mock implementation, return empty array
    // In a real implementation, this would filter by topicId
    return [];
  }

  // User progress tracking
  recordExerciseAttempt(userId: number, exerciseId: number, isCorrect: boolean): void {
    console.log(`Recording exercise attempt: user ${userId}, exercise ${exerciseId}, correct: ${isCorrect}`);
  }

  // Database management
  close(): void {
    console.log('Mock database closed');
  }

  backup(backupPath: string): void {
    console.log(`Mock database backup to: ${backupPath}`);
  }
}