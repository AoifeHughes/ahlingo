/**
 * Mixed Exercise Service
 * 
 * Handles mixed exercise functionality including topic progress tracking
 * and random mixed exercise generation for shuffle and study modes.
 * Now includes smart randomization with anti-repetition logic.
 */

import { executeQuery, executeSqlSingle, rowsToArray, getSingleRow } from '../utils/databaseUtils';
import { TopicWithProgress, ShuffleExercise, ExerciseInfo, Topic, StudyTopicInfo, RecentExercise } from '../types';
import { SmartRandomizer, DEFAULT_RANDOMIZATION_CONFIG } from '../utils/smartRandomization';

export interface TopicProgress {
  totalExercises: number;
  completedExercises: number;
  percentage: number;
}

/**
 * Get topics with progress for a specific exercise type
 */
export const getTopicsWithProgressForExerciseType = async (
  userId: number | null,
  exerciseType: 'pairs' | 'conversation' | 'translation' | 'fill_in_blank',
  language: string,
  difficulty: string
): Promise<TopicWithProgress[]> => {
  return executeQuery(async (db) => {
    // Single optimized query that gets topics and calculates progress
    const query = `
      SELECT 
        t.id,
        t.topic,
        COUNT(DISTINCT ei.id) as total_exercises,
        COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as completed_exercises,
        CASE 
          WHEN COUNT(DISTINCT ei.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) * 100.0) / COUNT(DISTINCT ei.id), 1)
        END as percentage
      FROM topics t
      LEFT JOIN exercises_info ei ON t.id = ei.topic_id
      LEFT JOIN languages l ON ei.language_id = l.id
      LEFT JOIN difficulties d ON ei.difficulty_id = d.id
      LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
      WHERE ei.exercise_type = ?
        AND l.language = ?
        AND d.difficulty_level = ?
      GROUP BY t.id, t.topic
      HAVING COUNT(DISTINCT ei.id) > 0
      ORDER BY t.topic;
    `;

    const result = await db.executeSql(query, [userId, exerciseType, language, difficulty]);
    const topics = rowsToArray<any>(result[0].rows);

    return topics.map(topic => ({
      id: topic.id,
      topic: topic.topic,
      progress: {
        totalExercises: topic.total_exercises,
        completedExercises: topic.completed_exercises,
        percentage: topic.percentage
      }
    }));
  });
};

/**
 * Get random mixed exercises for a specific topic with smart randomization
 */
export const getRandomMixedExercisesForTopic = async (
  topicId: number,
  userId: number | null,
  language: string,
  difficulty: string,
  recentExercises: RecentExercise[] = []
): Promise<ShuffleExercise[]> => {
  return executeQuery(async (db) => {
    // Get topic name first
    const topicQuery = 'SELECT topic FROM topics WHERE id = ?';
    const topicResult = await db.executeSql(topicQuery, [topicId]);
    const topicName = topicResult[0].rows.length > 0 ? topicResult[0].rows.item(0).topic : 'Unknown Topic';

    // Get all available exercises for this topic that have actual data in their respective tables
    const exercisesQuery = `
      SELECT 
        ei.*,
        CASE 
          WHEN pe.exercise_id IS NOT NULL THEN 'pairs'
          WHEN ce.exercise_id IS NOT NULL THEN 'conversation'
          WHEN te.exercise_id IS NOT NULL THEN 'translation'
          WHEN fibe.exercise_id IS NOT NULL THEN 'fill_in_blank'
        END as verified_exercise_type
      FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      LEFT JOIN pair_exercises pe ON ei.id = pe.exercise_id AND ei.exercise_type = 'pairs'
      LEFT JOIN conversation_exercises ce ON ei.id = ce.exercise_id AND ei.exercise_type = 'conversation'
      LEFT JOIN translation_exercises te ON ei.id = te.exercise_id AND ei.exercise_type = 'translation'
      LEFT JOIN fill_in_blank_exercises fibe ON ei.id = fibe.exercise_id AND ei.exercise_type = 'fill_in_blank'
      WHERE ei.topic_id = ?
        AND l.language = ?
        AND d.difficulty_level = ?
        AND ei.exercise_type IN ('pairs', 'conversation', 'translation', 'fill_in_blank')
        AND (pe.exercise_id IS NOT NULL OR ce.exercise_id IS NOT NULL OR te.exercise_id IS NOT NULL OR fibe.exercise_id IS NOT NULL)
    `;

    const exercisesResult = await db.executeSql(exercisesQuery, [topicId, language, difficulty]);
    
    if (!exercisesResult || !exercisesResult[0] || exercisesResult[0].rows.length === 0) {
      return [];
    }

    // Collect all verified exercises
    const allExercises: ShuffleExercise[] = [];
    for (let i = 0; i < exercisesResult[0].rows.length; i++) {
      const exerciseRow = exercisesResult[0].rows.item(i);
      allExercises.push({
        exerciseInfo: {
          id: exerciseRow.id,
          exercise_name: exerciseRow.exercise_name,
          topic_id: exerciseRow.topic_id,
          difficulty_id: exerciseRow.difficulty_id,
          language_id: exerciseRow.language_id,
          exercise_type: exerciseRow.exercise_type,
          lesson_id: exerciseRow.lesson_id
        },
        exerciseType: exerciseRow.verified_exercise_type as 'pairs' | 'conversation' | 'translation' | 'fill_in_blank',
        topicName: topicName
      });
    }

    // Use smart randomization with anti-repetition logic
    const smartRandomizer = new SmartRandomizer(DEFAULT_RANDOMIZATION_CONFIG);
    smartRandomizer.loadRecentExercises(recentExercises);
    
    // Return up to 10 exercises using smart selection
    const selectedExercises = smartRandomizer.selectExercises(allExercises, Math.min(10, allExercises.length));

    return selectedExercises;
  });
};

/**
 * Get random mixed exercises across all topics with smart randomization
 */
export const getRandomMixedExercises = async (
  userId: number | null,
  language: string,
  difficulty: string,
  recentExercises: RecentExercise[] = []
): Promise<ShuffleExercise[]> => {
  return executeQuery(async (db) => {
    // Get all available exercises across all topics and types
    let query: string;
    let params: any[];

    if (userId) {
      // Prioritize untried exercises for logged-in users
      query = `
        SELECT ei.*, t.topic as topic_name
        FROM exercises_info ei
        JOIN languages l ON ei.language_id = l.id
        JOIN difficulties d ON ei.difficulty_id = d.id
        JOIN topics t ON ei.topic_id = t.id
        LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
        WHERE l.language = ?
          AND d.difficulty_level = ?
          AND ei.exercise_type IN ('pairs', 'conversation', 'translation', 'fill_in_blank')
        ORDER BY 
          CASE WHEN uea.exercise_id IS NULL THEN 0 ELSE 1 END,
          RANDOM()
      `;
      params = [userId, language, difficulty];
    } else {
      query = `
        SELECT ei.*, t.topic as topic_name
        FROM exercises_info ei
        JOIN languages l ON ei.language_id = l.id
        JOIN difficulties d ON ei.difficulty_id = d.id
        JOIN topics t ON ei.topic_id = t.id
        WHERE l.language = ?
          AND d.difficulty_level = ?
          AND ei.exercise_type IN ('pairs', 'conversation', 'translation', 'fill_in_blank')
        ORDER BY RANDOM()
      `;
      params = [language, difficulty];
    }

    const result = await db.executeSql(query, params);
    
    if (!result || !result[0] || result[0].rows.length === 0) {
      return [];
    }

    // Collect all available exercises
    const allExercises: ShuffleExercise[] = [];
    for (let i = 0; i < result[0].rows.length; i++) {
      const exerciseRow = result[0].rows.item(i);
      allExercises.push({
        exerciseInfo: {
          id: exerciseRow.id,
          exercise_name: exerciseRow.exercise_name,
          topic_id: exerciseRow.topic_id,
          difficulty_id: exerciseRow.difficulty_id,
          language_id: exerciseRow.language_id,
          exercise_type: exerciseRow.exercise_type,
          lesson_id: exerciseRow.lesson_id
        },
        exerciseType: exerciseRow.exercise_type as 'pairs' | 'conversation' | 'translation' | 'fill_in_blank',
        topicName: exerciseRow.topic_name
      });
    }

    // Use smart randomization with enhanced diversity logic
    const smartRandomizer = new SmartRandomizer({
      ...DEFAULT_RANDOMIZATION_CONFIG,
      // More aggressive anti-repetition for shuffle mode
      immediateExclusionCount: 5,
      reducedProbabilityCount: 10,
      reducedProbabilityMultiplier: 0.1,
    });
    
    smartRandomizer.loadRecentExercises(recentExercises);
    
    // Select 5 exercises with enhanced diversity
    const selectedExercises = smartRandomizer.selectExercises(allExercises, 5);

    return selectedExercises;
  });
};

/**
 * Get topics available for study with progress and exercise type information
 */
export const getTopicsForStudy = async (
  userId: number | null,
  language: string,
  difficulty: string
): Promise<StudyTopicInfo[]> => {
  return executeQuery(async (db) => {
    const query = `
      SELECT 
        t.id,
        t.topic,
        COUNT(DISTINCT ei.id) as total_exercises,
        COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as completed_exercises,
        CASE 
          WHEN COUNT(DISTINCT ei.id) = 0 THEN 0
          ELSE ROUND((COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) * 100.0) / COUNT(DISTINCT ei.id), 1)
        END as percentage,
        GROUP_CONCAT(DISTINCT ei.exercise_type) as exercise_types
      FROM topics t
      JOIN exercises_info ei ON t.id = ei.topic_id
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
      WHERE l.language = ?
        AND d.difficulty_level = ?
      GROUP BY t.id, t.topic
      HAVING COUNT(DISTINCT ei.id) > 0
      ORDER BY t.topic
    `;

    const result = await db.executeSql(query, [userId, language, difficulty]);
    const rows = rowsToArray<any>(result[0].rows);

    return rows.map(row => ({
      id: row.id,
      topic: row.topic,
      totalExercises: row.total_exercises,
      completedExercises: row.completed_exercises,
      percentage: row.percentage,
      availableExerciseTypes: row.exercise_types ? row.exercise_types.split(',') as ('pairs' | 'conversation' | 'translation' | 'fill_in_blank')[] : []
    }));
  });
};

/**
 * Get progress for a specific topic
 */
export const getTopicProgress = async (
  userId: number,
  topicId: number,
  exerciseType: string,
  language: string,
  difficulty: string
): Promise<{ totalExercises: number; completedExercises: number; percentage: number }> => {
  return executeQuery(async (db) => {
    const query = `
      SELECT 
        COUNT(DISTINCT ei.id) as total_exercises,
        COUNT(DISTINCT CASE WHEN uea.is_correct = 1 THEN uea.exercise_id END) as completed_exercises
      FROM exercises_info ei
      JOIN languages l ON ei.language_id = l.id
      JOIN difficulties d ON ei.difficulty_id = d.id
      LEFT JOIN user_exercise_attempts uea ON ei.id = uea.exercise_id AND uea.user_id = ?
      WHERE ei.topic_id = ?
        AND ei.exercise_type = ?
        AND l.language = ?
        AND d.difficulty_level = ?
    `;

    const result = await db.executeSql(query, [userId, topicId, exerciseType, language, difficulty]);
    const row = result[0].rows.item(0);
    
    const totalExercises = row.total_exercises;
    const completedExercises = row.completed_exercises;
    const percentage = totalExercises > 0 ? Math.round((completedExercises * 100) / totalExercises) : 0;

    return {
      totalExercises,
      completedExercises,
      percentage,
    };
  });
};