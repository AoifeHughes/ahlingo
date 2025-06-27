"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseService = void 0;
class ExerciseService {
    constructor(database) {
        this.db = database;
    }
    /**
     * Get topics filtered by user's language and difficulty settings
     */
    getTopicsForUser(userSettings) {
        return this.db.getTopicsByLanguageAndDifficulty(userSettings.language.id, userSettings.difficulty.id);
    }
    /**
     * Get all available topics
     */
    getAllTopics() {
        return this.db.getTopics();
    }
    /**
     * Get exercises for a specific topic, difficulty, language, and type
     */
    getExercises(topicId, difficultyId, languageId, exerciseType) {
        return this.db.getExercisesWithDetails(topicId, difficultyId, languageId, exerciseType);
    }
    /**
     * Get exercises for user's current settings
     */
    getExercisesForUser(topicId, exerciseType, userSettings) {
        return this.getExercises(topicId, userSettings.difficulty.id, userSettings.language.id, exerciseType);
    }
    /**
     * Get random pair exercises for the pairs game
     */
    getRandomPairExercises(topicId, userSettings) {
        const exercises = this.db.getRandomPairExercise(topicId, userSettings.difficulty.id, userSettings.language.id);
        // Get the exercise info for the first exercise (for context)
        let exerciseInfo;
        if (exercises.length > 0) {
            const exerciseDetails = this.db.getExercisesWithDetails(topicId, userSettings.difficulty.id, userSettings.language.id, 'pairs');
            exerciseInfo = exerciseDetails.find(detail => exercises.some(ex => ex.exercise_id === detail.id));
        }
        return { exercises, exerciseInfo };
    }
    /**
     * Get conversation exercises for a specific exercise
     */
    getConversationExercises(exerciseId) {
        return this.db.getConversationExercises(exerciseId);
    }
    /**
     * Get translation exercises for a specific exercise
     */
    getTranslationExercises(exerciseId) {
        return this.db.getTranslationExercises(exerciseId);
    }
    /**
     * Get a random conversation exercise for a topic
     */
    getRandomConversationExercise(topicId, userSettings) {
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
    getRandomTranslationExercise(topicId, userSettings) {
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
    hasExercisesForTopic(topicId, exerciseType, userSettings) {
        const exercises = this.getExercisesForUser(topicId, exerciseType, userSettings);
        return exercises.length > 0;
    }
    /**
     * Get exercise statistics for a topic
     */
    getTopicStatistics(topicId, userSettings) {
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
    validateExerciseAvailability(topicId, exerciseType, userSettings) {
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
    recordAttempt(userId, exerciseId, isCorrect) {
        this.db.recordExerciseAttempt(userId, exerciseId, isCorrect);
    }
}
exports.ExerciseService = ExerciseService;
//# sourceMappingURL=exerciseService.js.map