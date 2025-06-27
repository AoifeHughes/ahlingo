import { LanguageLearningDatabase } from './database';
import { Topic, ExerciseWithDetails, PairExercise, ConversationExercise, TranslationExercise, ExerciseType, UserSettings } from '../../types';
export declare class ExerciseService {
    private db;
    constructor(database: LanguageLearningDatabase);
    /**
     * Get topics filtered by user's language and difficulty settings
     */
    getTopicsForUser(userSettings: UserSettings): Topic[];
    /**
     * Get all available topics
     */
    getAllTopics(): Topic[];
    /**
     * Get exercises for a specific topic, difficulty, language, and type
     */
    getExercises(topicId: number, difficultyId: number, languageId: number, exerciseType: ExerciseType): ExerciseWithDetails[];
    /**
     * Get exercises for user's current settings
     */
    getExercisesForUser(topicId: number, exerciseType: ExerciseType, userSettings: UserSettings): ExerciseWithDetails[];
    /**
     * Get random pair exercises for the pairs game
     */
    getRandomPairExercises(topicId: number, userSettings: UserSettings): {
        exercises: PairExercise[];
        exerciseInfo?: ExerciseWithDetails;
    };
    /**
     * Get conversation exercises for a specific exercise
     */
    getConversationExercises(exerciseId: number): ConversationExercise[];
    /**
     * Get translation exercises for a specific exercise
     */
    getTranslationExercises(exerciseId: number): TranslationExercise[];
    /**
     * Get a random conversation exercise for a topic
     */
    getRandomConversationExercise(topicId: number, userSettings: UserSettings): {
        exercise: ExerciseWithDetails | null;
        conversation: ConversationExercise[];
    };
    /**
     * Get a random translation exercise for a topic
     */
    getRandomTranslationExercise(topicId: number, userSettings: UserSettings): {
        exercise: ExerciseWithDetails | null;
        translations: TranslationExercise[];
    };
    /**
     * Check if exercises are available for a topic and user settings
     */
    hasExercisesForTopic(topicId: number, exerciseType: ExerciseType, userSettings: UserSettings): boolean;
    /**
     * Get exercise statistics for a topic
     */
    getTopicStatistics(topicId: number, userSettings: UserSettings): {
        pairCount: number;
        conversationCount: number;
        translationCount: number;
        totalCount: number;
    };
    /**
     * Validate that exercises exist for a given configuration
     */
    validateExerciseAvailability(topicId: number, exerciseType: ExerciseType, userSettings: UserSettings): {
        isAvailable: boolean;
        message: string;
    };
    /**
     * Record user's exercise attempt
     */
    recordAttempt(userId: number, exerciseId: number, isCorrect: boolean): void;
}
//# sourceMappingURL=exerciseService.d.ts.map