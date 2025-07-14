/**
 * Smart Randomization Utility
 * 
 * Implements priority-based randomization with anti-repetition logic
 * to prevent consecutive lessons and ensure balanced exercise distribution.
 */

import { ExerciseInfo } from '../types';

export interface RecentExercise {
  exerciseId: number;
  topicId: number;
  exerciseType: string;
  lessonId?: number;
  timestamp: number;
}

export interface SmartRandomizationConfig {
  // Number of recent exercises to completely exclude
  immediateExclusionCount: number;
  // Number of additional exercises to reduce probability for
  reducedProbabilityCount: number;
  // Probability multiplier for reduced probability exercises (0.0 - 1.0)
  reducedProbabilityMultiplier: number;
  // Maximum age of recent exercises to consider (in minutes)
  maxRecentAgeMinutes: number;
}

export const DEFAULT_RANDOMIZATION_CONFIG: SmartRandomizationConfig = {
  immediateExclusionCount: 3,
  reducedProbabilityCount: 7,
  reducedProbabilityMultiplier: 0.2,
  maxRecentAgeMinutes: 60,
};

export class SmartRandomizer {
  private config: SmartRandomizationConfig;
  private recentExercises: RecentExercise[];

  constructor(config: SmartRandomizationConfig = DEFAULT_RANDOMIZATION_CONFIG) {
    this.config = config;
    this.recentExercises = [];
  }

  /**
   * Add an exercise to the recent exercises tracking
   */
  addRecentExercise(exercise: RecentExercise): void {
    this.recentExercises.unshift(exercise);
    this.cleanupOldExercises();
  }

  /**
   * Get recent exercises (for debugging or state management)
   */
  getRecentExercises(): RecentExercise[] {
    return [...this.recentExercises];
  }

  /**
   * Clear all recent exercises
   */
  clearRecentExercises(): void {
    this.recentExercises = [];
  }

  /**
   * Load recent exercises from external source (e.g., Redux state)
   */
  loadRecentExercises(exercises: RecentExercise[]): void {
    this.recentExercises = exercises.filter(ex => this.isRecentExerciseValid(ex));
    this.cleanupOldExercises();
  }

  /**
   * Smart selection of exercises with anti-repetition logic
   */
  selectExercises<T extends { exerciseInfo: ExerciseInfo }>(
    availableExercises: T[],
    count: number
  ): T[] {
    if (availableExercises.length === 0) return [];
    
    // Clean up old exercises first
    this.cleanupOldExercises();
    
    // If we need more exercises than available, return all
    if (count >= availableExercises.length) {
      return this.shuffleArray([...availableExercises]);
    }

    // Create weighted selection pool
    const weightedPool = this.createWeightedPool(availableExercises);
    
    // Select exercises with anti-repetition logic
    const selectedExercises: T[] = [];
    const remainingPool = [...weightedPool];
    
    for (let i = 0; i < count && remainingPool.length > 0; i++) {
      const selected = this.selectFromWeightedPool(remainingPool);
      if (selected) {
        selectedExercises.push(selected.exercise);
        
        // Remove selected and similar exercises from remaining pool
        this.removeFromPool(remainingPool, selected.exercise);
      }
    }

    return selectedExercises;
  }

  /**
   * Select a single exercise with smart randomization
   */
  selectSingleExercise<T extends { exerciseInfo: ExerciseInfo }>(
    availableExercises: T[]
  ): T | null {
    const selected = this.selectExercises(availableExercises, 1);
    return selected.length > 0 ? selected[0] : null;
  }

  /**
   * Check if an exercise should be excluded based on recent usage
   */
  private shouldExcludeExercise(exercise: ExerciseInfo): boolean {
    const recentCount = Math.min(this.config.immediateExclusionCount, this.recentExercises.length);
    
    for (let i = 0; i < recentCount; i++) {
      const recent = this.recentExercises[i];
      
      // Exclude if same exercise
      if (recent.exerciseId === exercise.id) return true;
      
      // Exclude if same topic and lesson (if lesson exists)
      if (recent.topicId === exercise.topic_id && 
          recent.lessonId === exercise.lesson_id && 
          exercise.lesson_id !== null) return true;
    }
    
    return false;
  }

  /**
   * Calculate probability weight for an exercise
   */
  private calculateExerciseWeight(exercise: ExerciseInfo): number {
    // Base weight
    let weight = 1.0;
    
    // Check if exercise is in reduced probability range
    const reducedProbabilityEnd = this.config.immediateExclusionCount + this.config.reducedProbabilityCount;
    const relevantRecent = this.recentExercises.slice(this.config.immediateExclusionCount, reducedProbabilityEnd);
    
    for (const recent of relevantRecent) {
      if (recent.exerciseId === exercise.id ||
          (recent.topicId === exercise.topic_id && recent.lessonId === exercise.lesson_id)) {
        weight *= this.config.reducedProbabilityMultiplier;
        break;
      }
    }
    
    return weight;
  }

  /**
   * Create weighted pool of exercises
   */
  private createWeightedPool<T extends { exerciseInfo: ExerciseInfo }>(
    exercises: T[]
  ): Array<{ exercise: T; weight: number }> {
    return exercises
      .filter(ex => !this.shouldExcludeExercise(ex.exerciseInfo))
      .map(exercise => ({
        exercise,
        weight: this.calculateExerciseWeight(exercise.exerciseInfo)
      }));
  }

  /**
   * Select from weighted pool using weighted random selection
   */
  private selectFromWeightedPool<T>(
    pool: Array<{ exercise: T; weight: number }>
  ): { exercise: T; weight: number } | null {
    if (pool.length === 0) return null;
    
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight === 0) return null;
    
    let random = Math.random() * totalWeight;
    
    for (const item of pool) {
      random -= item.weight;
      if (random <= 0) {
        return item;
      }
    }
    
    // Fallback to last item
    return pool[pool.length - 1];
  }

  /**
   * Remove selected exercise and similar ones from pool
   */
  private removeFromPool<T extends { exerciseInfo: ExerciseInfo }>(
    pool: Array<{ exercise: T; weight: number }>,
    selectedExercise: T
  ): void {
    const selectedInfo = selectedExercise.exerciseInfo;
    
    // Remove all exercises from same topic/lesson to avoid immediate repetition
    for (let i = pool.length - 1; i >= 0; i--) {
      const poolExercise = pool[i].exercise.exerciseInfo;
      
      if (poolExercise.id === selectedInfo.id ||
          (poolExercise.topic_id === selectedInfo.topic_id && 
           poolExercise.lesson_id === selectedInfo.lesson_id &&
           selectedInfo.lesson_id !== null)) {
        pool.splice(i, 1);
      }
    }
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if recent exercise is still valid (not too old)
   */
  private isRecentExerciseValid(exercise: RecentExercise): boolean {
    const now = Date.now();
    const exerciseAge = (now - exercise.timestamp) / (1000 * 60); // minutes
    return exerciseAge <= this.config.maxRecentAgeMinutes;
  }

  /**
   * Remove old exercises from recent list
   */
  private cleanupOldExercises(): void {
    this.recentExercises = this.recentExercises.filter(ex => this.isRecentExerciseValid(ex));
  }
}

// Export a default instance for convenience
export const defaultSmartRandomizer = new SmartRandomizer();