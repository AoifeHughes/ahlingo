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
  getUserContext,
  resetUserData,
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

export {
  getTopicsWithProgressForExerciseType,
  getRandomMixedExercisesForTopic,
  getRandomMixedExercises,
  getTopicsForStudy,
  getTopicProgress,
} from './MixedExerciseService';

// Initialize database on app startup
export { initializeDatabase, closeDatabase } from '../utils/databaseUtils';

// Backward compatibility functions that map to the new services
import {
  getTopicsForExerciseType,
  getRandomExerciseForTopic as getRandomExerciseForTopicBase,
  recordExerciseAttempt,
} from './BaseExerciseService';

import { getUserContext } from './UserService';

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

export const getRandomFillInBlankExerciseForTopic = (
  topicId: number,
  language: string,
  difficulty: string
) =>
  getRandomExerciseForTopicBase(topicId, language, difficulty, 'fill_in_blank');

export const getTopicsForFillInBlank = (language: string, difficulty: string) =>
  getTopicsForExerciseType('fill_in_blank', language, difficulty);

// Exercise data functions with fallback logic
import { getExerciseData } from './BaseExerciseService';

export const getPairExercises = (exerciseId: number) =>
  getExerciseData(exerciseId, 'pairs');

export const getConversationExerciseData = (exerciseId: number) =>
  getExerciseData(exerciseId, 'conversation');

export const getTranslationExerciseData = (exerciseId: number) =>
  getExerciseData(exerciseId, 'translation');

export const getFillInBlankExerciseData = (exerciseId: number) =>
  getExerciseData(exerciseId, 'fill_in_blank');

// Convenience function to record exercise attempt for current user
export const recordExerciseAttemptForCurrentUser = async (
  exerciseId: number,
  isCorrect: boolean
): Promise<void> => {
  try {
    const userContext = await getUserContext();
    if (userContext && userContext.userId) {
      await recordExerciseAttempt(userContext.userId, exerciseId, isCorrect);
    }
  } catch (error) {
    console.error('Failed to record exercise attempt for current user:', error);
    throw error;
  }
};

// Combined exercise and data functions (used by tests)
export const getConversationExerciseWithData = async (
  topicId: number,
  language: string,
  difficulty: string,
  userId?: number | null
) => {
  const exercise = await getRandomConversationExerciseForTopic(topicId, language, difficulty);
  if (!exercise) return null;
  
  const conversationData = await getConversationExerciseData(exercise.id);
  const topicName = await getTopicNameForExercise(exercise.id);
  const correctSummary = await getConversationSummary(exercise.id);
  const wrongSummaries = await getRandomConversationSummaries(language, difficulty, exercise.id);
  
  return {
    exercise,
    conversationData,
    topicName,
    correctSummary,
    wrongSummaries,
  };
};

export const getTranslationExerciseWithData = async (
  topicId: number,
  language: string,
  difficulty: string,
  userId?: number | null
) => {
  const exercise = await getRandomTranslationExerciseForTopic(topicId, language, difficulty);
  if (!exercise) return null;
  
  const translationData = await getTranslationExerciseData(exercise.id);
  const topicName = await getTopicNameForExercise(exercise.id);
  
  return {
    exercise,
    translationData,
    topicName,
  };
};

export const getFillInBlankExerciseWithData = async (
  topicId: number,
  language: string,
  difficulty: string,
  userId?: number | null
) => {
  const exercise = await getRandomFillInBlankExerciseForTopic(topicId, language, difficulty);
  if (!exercise) return null;
  
  const fillInBlankData = await getFillInBlankExerciseData(exercise.id);
  const topicName = await getTopicNameForExercise(exercise.id);
  
  return {
    exercise,
    fillInBlankData,
    topicName,
  };
};

export const getPairsExerciseWithData = async (
  topicId: number,
  language: string,
  difficulty: string,
  userId?: number | null
) => {
  const exercise = await getRandomExerciseForTopic(topicId, language, difficulty);
  if (!exercise) return null;
  
  const pairsData = await getPairExercises(exercise.id);
  const topicName = await getTopicNameForExercise(exercise.id);
  
  return {
    exercise,
    pairsData,
    topicName,
  };
};
