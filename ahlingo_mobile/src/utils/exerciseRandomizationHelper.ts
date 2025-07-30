/**
 * Exercise Randomization Helper
 * 
 * Utility functions to help integrate smart randomization with existing screens
 * and provide a consistent interface for exercise selection across the app.
 */

import { store } from '../store';
import { addRecentExercise, cleanupOldExercises } from '../store/slices/gameSlice';
import { ExerciseInfo, RecentExercise } from '../types';

/**
 * Record an exercise as recently completed
 */
export const recordExerciseAsRecent = (exerciseInfo: ExerciseInfo): void => {
  const recentExercise: RecentExercise = {
    exerciseId: exerciseInfo.id,
    topicId: exerciseInfo.topic_id,
    exerciseType: exerciseInfo.exercise_type,
    lessonId: exerciseInfo.lesson_id,
    timestamp: Date.now(),
  };

  store.dispatch(addRecentExercise(recentExercise));
};

/**
 * Get recent exercises from Redux store
 */
export const getRecentExercises = (): RecentExercise[] => {
  const state = store.getState();
  
  // Clean up old exercises first
  store.dispatch(cleanupOldExercises());
  
  return state.game.recentExercises;
};

/**
 * Clear recent exercises (useful for testing or manual reset)
 */
export const clearRecentExercises = (): void => {
  const { clearRecentExercises } = require('../store/slices/gameSlice');
  store.dispatch(clearRecentExercises());
};

/**
 * Check if an exercise should be avoided based on recent usage
 */
export const shouldAvoidExercise = (exerciseInfo: ExerciseInfo): boolean => {
  const recentExercises = getRecentExercises();
  const recentCount = Math.min(3, recentExercises.length); // Check last 3 exercises
  
  for (let i = 0; i < recentCount; i++) {
    const recent = recentExercises[i];
    
    // Avoid if same exercise
    if (recent.exerciseId === exerciseInfo.id) return true;
    
    // Avoid if same topic and lesson
    if (recent.topicId === exerciseInfo.topic_id && 
        recent.lessonId === exerciseInfo.lesson_id && 
        exerciseInfo.lesson_id !== null) return true;
  }
  
  return false;
};

/**
 * Get statistics about recent exercise usage
 */
export const getRecentExerciseStats = (): {
  totalRecent: number;
  uniqueTopics: number;
  uniqueLessons: number;
  oldestRecentAge: number;
} => {
  const recentExercises = getRecentExercises();
  const now = Date.now();
  
  const uniqueTopics = new Set(recentExercises.map(ex => ex.topicId));
  const uniqueLessons = new Set(recentExercises.map(ex => ex.lessonId).filter(Boolean));
  
  const oldestRecentAge = recentExercises.length > 0 
    ? Math.max(...recentExercises.map(ex => now - ex.timestamp))
    : 0;

  return {
    totalRecent: recentExercises.length,
    uniqueTopics: uniqueTopics.size,
    uniqueLessons: uniqueLessons.size,
    oldestRecentAge: Math.round(oldestRecentAge / (1000 * 60)), // in minutes
  };
};

/**
 * Debug utility to log current randomization state
 */
export const debugRandomizationState = (): void => {
  const stats = getRecentExerciseStats();
  const recentExercises = getRecentExercises();
  
  console.log('=== Smart Randomization Debug ===');
  console.log('Recent exercises:', recentExercises.length);
  console.log('Unique topics:', stats.uniqueTopics);
  console.log('Unique lessons:', stats.uniqueLessons);
  console.log('Oldest recent age:', stats.oldestRecentAge, 'minutes');
  
  console.log('\nRecent exercises details:');
  recentExercises.forEach((ex, index) => {
    const ageMinutes = Math.round((Date.now() - ex.timestamp) / (1000 * 60));
    console.log(`${index + 1}. Exercise ${ex.exerciseId} (Topic: ${ex.topicId}, Lesson: ${ex.lessonId || 'N/A'}) - ${ageMinutes}min ago`);
  });
  
  console.log('=== End Debug ===');
};

/**
 * Migration helper: Convert old randomization calls to use smart randomization
 */
export const migrateToSmartRandomization = {
  /**
   * Wrapper for MixedExerciseService functions
   */
  getRandomMixedExercises: async (
    userId: number | null,
    language: string,
    difficulty: string
  ) => {
    const { getRandomMixedExercises } = await import('../services/MixedExerciseService');
    const recentExercises = getRecentExercises();
    return getRandomMixedExercises(userId, language, difficulty, recentExercises);
  },

  getRandomMixedExercisesForTopic: async (
    topicId: number,
    userId: number | null,
    language: string,
    difficulty: string
  ) => {
    const { getRandomMixedExercisesForTopic } = await import('../services/MixedExerciseService');
    const recentExercises = getRecentExercises();
    return getRandomMixedExercisesForTopic(topicId, userId, language, difficulty, recentExercises);
  },

  /**
   * Wrapper for BaseExerciseService functions
   */
  getSmartRandomExerciseForTopic: async (
    topicId: number,
    language: string,
    difficulty: string,
    exerciseType: 'pairs' | 'conversation' | 'translation' | 'fill_in_blank'
  ) => {
    const { getSmartRandomExerciseForTopic } = await import('../services/BaseExerciseService');
    const recentExercises = getRecentExercises();
    return getSmartRandomExerciseForTopic(topicId, language, difficulty, exerciseType, recentExercises);
  },
};