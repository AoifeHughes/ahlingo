import { LanguageLearningDatabase } from './database';
import {
  Topic,
  ExerciseWithDetails,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  ExerciseType,
  UserSettings,
} from '../../types';

export class ExerciseService {
  private db: LanguageLearningDatabase;

  constructor(database: LanguageLearningDatabase) {
    this.db = database;
  }

  /**
   * Get topics filtered by user's language and difficulty settings
   */
  getTopicsForUser(userSettings: UserSettings): Topic[] {
    return this.db.getTopicsByLanguageAndDifficulty(
      userSettings.language.id,
      userSettings.difficulty.id
    );
  }

  /**
   * Get all available topics
   */
  getAllTopics(): Topic[] {
    return this.db.getTopics();
  }

  /**
   * Get exercises for a specific topic, difficulty, language, and type
   */
  getExercises(
    topicId: number,
    difficultyId: number,
    languageId: number,
    exerciseType: ExerciseType
  ): ExerciseWithDetails[] {
    return this.db.getExercisesWithDetails(topicId, difficultyId, languageId, exerciseType);
  }

  /**
   * Get exercises for user's current settings
   */
  getExercisesForUser(
    topicId: number,
    exerciseType: ExerciseType,
    userSettings: UserSettings
  ): ExerciseWithDetails[] {
    return this.getExercises(
      topicId,
      userSettings.difficulty.id,
      userSettings.language.id,
      exerciseType
    );
  }

  /**
   * Get random pair exercises for the pairs game
   */
  getRandomPairExercises(
    topicId: number,
    userSettings: UserSettings
  ): {
    exercises: PairExercise[];
    exerciseInfo?: ExerciseWithDetails;
  } {
    const exercises = this.db.getRandomPairExercise(
      topicId,
      userSettings.difficulty.id,
      userSettings.language.id
    );

    // Get the exercise info for the first exercise (for context)
    let exerciseInfo: ExerciseWithDetails | undefined;
    if (exercises.length > 0) {
      const exerciseDetails = this.db.getExercisesWithDetails(
        topicId,
        userSettings.difficulty.id,
        userSettings.language.id,
        'pairs'
      );
      
      exerciseInfo = exerciseDetails.find(detail => 
        exercises.some(ex => ex.exercise_id === detail.id)
      );
    }

    return { exercises, exerciseInfo };
  }

  /**
   * Get conversation exercises for a specific exercise
   */
  getConversationExercises(exerciseId: number): ConversationExercise[] {
    return this.db.getConversationExercises(exerciseId);
  }

  /**
   * Get translation exercises for a specific exercise
   */
  getTranslationExercises(exerciseId: number): TranslationExercise[] {
    return this.db.getTranslationExercises(exerciseId);
  }

  /**
   * Get a random conversation exercise for a topic
   */
  getRandomConversationExercise(
    topicId: number,
    userSettings: UserSettings
  ): {
    exercise: ExerciseWithDetails | null;
    conversation: ConversationExercise[];
  } {
    const exercises = this.getExercisesForUser(topicId, 'conversation', userSettings);
    
    if (exercises.length === 0) {
      return { exercise: null, conversation: [] };
    }

    // Pick a random exercise
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    const conversation = this.getConversationExercises(randomExercise.id);

    return { exercise: randomExercise, conversation };
  }

  /**
   * Get a random translation exercise for a topic
   */
  getRandomTranslationExercise(
    topicId: number,
    userSettings: UserSettings
  ): {
    exercise: ExerciseWithDetails | null;
    translations: TranslationExercise[];
  } {
    const exercises = this.getExercisesForUser(topicId, 'translation', userSettings);
    
    if (exercises.length === 0) {
      return { exercise: null, translations: [] };
    }

    // Pick a random exercise
    const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];
    const translations = this.getTranslationExercises(randomExercise.id);

    return { exercise: randomExercise, translations };
  }

  /**
   * Check if exercises are available for a topic and user settings
   */
  hasExercisesForTopic(
    topicId: number,
    exerciseType: ExerciseType,
    userSettings: UserSettings
  ): boolean {
    const exercises = this.getExercisesForUser(topicId, exerciseType, userSettings);
    return exercises.length > 0;
  }

  /**
   * Get exercise statistics for a topic
   */
  getTopicStatistics(
    topicId: number,
    userSettings: UserSettings
  ): {
    pairCount: number;
    conversationCount: number;
    translationCount: number;
    totalCount: number;
  } {
    const pairExercises = this.getExercisesForUser(topicId, 'pairs', userSettings);
    const conversationExercises = this.getExercisesForUser(topicId, 'conversation', userSettings);
    const translationExercises = this.getExercisesForUser(topicId, 'translation', userSettings);

    return {
      pairCount: pairExercises.length,
      conversationCount: conversationExercises.length,
      translationCount: translationExercises.length,
      totalCount: pairExercises.length + conversationExercises.length + translationExercises.length,
    };
  }

  /**
   * Validate that exercises exist for a given configuration
   */
  validateExerciseAvailability(
    topicId: number,
    exerciseType: ExerciseType,
    userSettings: UserSettings
  ): {
    isAvailable: boolean;
    message: string;
  } {
    const exercises = this.getExercisesForUser(topicId, exerciseType, userSettings);
    
    if (exercises.length === 0) {
      return {
        isAvailable: false,
        message: `No ${exerciseType} exercises available for this topic in ${userSettings.language.language} at ${userSettings.difficulty.difficulty_level} level.`,
      };
    }

    return {
      isAvailable: true,
      message: `${exercises.length} ${exerciseType} exercise(s) available.`,
    };
  }

  /**
   * Record user's exercise attempt
   */
  recordAttempt(userId: number, exerciseId: number, isCorrect: boolean): void {
    this.db.recordExerciseAttempt(userId, exerciseId, isCorrect);
  }
}