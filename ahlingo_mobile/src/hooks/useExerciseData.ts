import { useState, useEffect, useCallback } from 'react';
import { getTopicsForExerciseType, getRandomExerciseForTopic, getExerciseData } from '../services/BaseExerciseService';
import { Topic, ExerciseInfo } from '../types';
import { ExerciseType } from '../utils/navigationUtils';

/**
 * Custom hook for loading exercise data (topics, exercises)
 */
export const useExerciseTopics = (
  exerciseType: ExerciseType,
  language: string,
  difficulty: string
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);

  const loadTopics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const availableTopics = await getTopicsForExerciseType(exerciseType, language, difficulty);
      setTopics(availableTopics);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load topics';
      setError(errorMessage);
      console.error('Failed to load topics:', err);
    } finally {
      setLoading(false);
    }
  }, [exerciseType, language, difficulty]);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  return {
    loading,
    error,
    topics,
    reload: loadTopics,
  };
};

/**
 * Custom hook for loading a specific exercise
 */
export const useExercise = (
  topicId: number | null,
  language: string,
  difficulty: string,
  exerciseType: ExerciseType
) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exercise, setExercise] = useState<ExerciseInfo | null>(null);
  const [exerciseData, setExerciseData] = useState<any[]>([]);

  const loadExercise = useCallback(async () => {
    if (!topicId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get random exercise for topic
      const exerciseInfo = await getRandomExerciseForTopic(topicId, language, difficulty, exerciseType);
      
      if (!exerciseInfo) {
        throw new Error(`No ${exerciseType} exercises found for this topic`);
      }
      
      setExercise(exerciseInfo);
      
      // Get exercise data
      const data = await getExerciseData(exerciseInfo.id, exerciseType);
      setExerciseData(data);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load exercise';
      setError(errorMessage);
      console.error('Failed to load exercise:', err);
    } finally {
      setLoading(false);
    }
  }, [topicId, language, difficulty, exerciseType]);

  useEffect(() => {
    loadExercise();
  }, [loadExercise]);

  return {
    loading,
    error,
    exercise,
    exerciseData,
    reload: loadExercise,
  };
};