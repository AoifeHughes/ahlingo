/**
 * Refactored Database Service
 *
 * This is a cleaned-up version of SimpleDatabaseService that uses the new
 * centralized utilities and services. This demonstrates the improvements
 * while maintaining backward compatibility.
 */

// Re-export everything from the new modular services
export {
  getMostRecentUser,
  getUserSettings,
  setUserSetting,
  updateUserLogin,
  getUserId,
  type UserSettings,
} from './UserService';

export {
  getLanguages,
  getDifficulties,
  getTopics,
  getExercisesByLesson,
  logDatabaseTables,
} from './DatabaseService';

export {
  getTopicsForExerciseType,
  getRandomExerciseForTopic as getRandomExerciseForTopicBase,
  getExerciseData,
  recordExerciseAttempt,
  getTopicNameForExercise,
} from './BaseExerciseService';

export {
  getConversationSummary,
  getRandomConversationSummaries,
} from './ConversationExerciseService';

export {
  getUserStatsByTopic,
  getUserProgressSummary,
  getUserStatsAndSummary,
  getUserFailedExercises,
  type TopicStats,
  type ProgressSummary,
  type FailedExercise,
} from './StatsService';

// Initialize database on app startup
export { initializeDatabase, closeDatabase } from '../utils/databaseUtils';

// Backward compatibility functions that map to the new services
import {
  getTopicsForExerciseType,
  getRandomExerciseForTopic as getRandomExerciseForTopicBase,
} from './BaseExerciseService';

export const getTopicsForPairs = (language: string, difficulty: string) =>
  getTopicsForExerciseType('pairs', language, difficulty);

export const getTopicsForConversation = (
  language: string,
  difficulty: string
) => getTopicsForExerciseType('conversation', language, difficulty);

export const getTopicsForTranslation = (language: string, difficulty: string) =>
  getTopicsForExerciseType('translation', language, difficulty);

export const getRandomExerciseForTopic = (
  topicId: number,
  language: string,
  difficulty: string
) => getRandomExerciseForTopicBase(topicId, language, difficulty, 'pairs');

export const getRandomConversationExerciseForTopic = (
  topicId: number,
  language: string,
  difficulty: string
) =>
  getRandomExerciseForTopicBase(topicId, language, difficulty, 'conversation');

export const getRandomTranslationExerciseForTopic = (
  topicId: number,
  language: string,
  difficulty: string
) =>
  getRandomExerciseForTopicBase(topicId, language, difficulty, 'translation');

// Exercise data functions with fallback logic
import { getExerciseData } from './BaseExerciseService';

export const getPairExercises = (exerciseId: number) =>
  getExerciseData(exerciseId, 'pairs');

export const getConversationExerciseData = (exerciseId: number) =>
  getExerciseData(exerciseId, 'conversation');

export const getTranslationExerciseData = (exerciseId: number) =>
  getExerciseData(exerciseId, 'translation');
