/**
 * Smart Randomization Tests
 *
 * Tests for the enhanced randomization system with anti-repetition logic
 */

import { SmartRandomizer, DEFAULT_RANDOMIZATION_CONFIG, RecentExercise } from '../smartRandomization';
import { ExerciseInfo } from '../../types';

// Mock exercise data
const createMockExercise = (id: number, topicId: number, lessonId?: string): { exerciseInfo: ExerciseInfo } => ({
  exerciseInfo: {
    id,
    exercise_name: `Exercise ${id}`,
    topic_id: topicId,
    difficulty_id: 1,
    language_id: 1,
    exercise_type: 'pairs',
    lesson_id: lessonId,
  }
});

const createMockRecentExercise = (exerciseId: number, topicId: number, lessonId?: string): RecentExercise => ({
  exerciseId,
  topicId,
  exerciseType: 'pairs',
  lessonId,
  timestamp: Date.now() - 5000, // 5 seconds ago
});

describe('SmartRandomizer', () => {
  let randomizer: SmartRandomizer;

  beforeEach(() => {
    randomizer = new SmartRandomizer(DEFAULT_RANDOMIZATION_CONFIG);
  });

  describe('Basic functionality', () => {
    it('should select exercises when no recent exercises exist', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson2'),
        createMockExercise(3, 2, 'lesson3'),
      ];

      const selected = randomizer.selectExercises(exercises, 2);
      expect(selected).toHaveLength(2);
      expect(selected[0]).toBeDefined();
      expect(selected[1]).toBeDefined();
    });

    it('should return empty array when no exercises available', () => {
      const selected = randomizer.selectExercises([], 5);
      expect(selected).toHaveLength(0);
    });

    it('should return all exercises when requested count exceeds available', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson2'),
      ];

      const selected = randomizer.selectExercises(exercises, 5);
      expect(selected).toHaveLength(2);
    });
  });

  describe('Anti-repetition logic', () => {
    it('should exclude recently used exercises', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson2'),
        createMockExercise(3, 2, 'lesson3'),
        createMockExercise(4, 2, 'lesson4'),
      ];

      const recentExercises = [
        createMockRecentExercise(1, 1, 'lesson1'),
        createMockRecentExercise(2, 1, 'lesson2'),
      ];

      randomizer.loadRecentExercises(recentExercises);
      const selected = randomizer.selectExercises(exercises, 2);

      // Should select from exercises 3 and 4 only
      expect(selected).toHaveLength(2);
      expect(selected.some(ex => ex.exerciseInfo.id === 1)).toBe(false);
      expect(selected.some(ex => ex.exerciseInfo.id === 2)).toBe(false);
    });

    it('should exclude exercises from same topic/lesson', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson1'), // Same topic and lesson
        createMockExercise(3, 1, 'lesson2'),
        createMockExercise(4, 2, 'lesson3'),
      ];

      const recentExercises = [
        createMockRecentExercise(1, 1, 'lesson1'),
      ];

      randomizer.loadRecentExercises(recentExercises);
      const selected = randomizer.selectExercises(exercises, 3);

      // Should exclude both exercises from topic 1, lesson 1
      expect(selected).toHaveLength(2);
      expect(selected.some(ex => ex.exerciseInfo.id === 1)).toBe(false);
      expect(selected.some(ex => ex.exerciseInfo.id === 2)).toBe(false);
    });

    it('should handle recent exercise cleanup', () => {
      const oldExercise = {
        exerciseId: 1,
        topicId: 1,
        exerciseType: 'pairs',
        lessonId: 'lesson1',
        timestamp: Date.now() - (61 * 60 * 1000), // 61 minutes ago
      };

      randomizer.loadRecentExercises([oldExercise]);

      // Should have been cleaned up
      expect(randomizer.getRecentExercises()).toHaveLength(0);
    });
  });

  describe('Single exercise selection', () => {
    it('should select single exercise', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson2'),
        createMockExercise(3, 2, 'lesson3'),
      ];

      const selected = randomizer.selectSingleExercise(exercises);
      expect(selected).toBeDefined();
      expect(selected?.exerciseInfo.id).toBeGreaterThan(0);
    });

    it('should return null when no exercises available', () => {
      const selected = randomizer.selectSingleExercise([]);
      expect(selected).toBeNull();
    });

    it('should avoid recent exercises in single selection', () => {
      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 2, 'lesson2'),
      ];

      const recentExercises = [
        createMockRecentExercise(1, 1, 'lesson1'),
      ];

      randomizer.loadRecentExercises(recentExercises);
      const selected = randomizer.selectSingleExercise(exercises);

      // Should select exercise 2 only
      expect(selected).toBeDefined();
      expect(selected?.exerciseInfo.id).toBe(2);
    });
  });

  describe('Recent exercise management', () => {
    it('should add recent exercises', () => {
      const recentExercise = createMockRecentExercise(1, 1, 'lesson1');
      randomizer.addRecentExercise(recentExercise);

      expect(randomizer.getRecentExercises()).toHaveLength(1);
      expect(randomizer.getRecentExercises()[0]).toEqual(recentExercise);
    });

    it('should clear recent exercises', () => {
      const recentExercise = createMockRecentExercise(1, 1, 'lesson1');
      randomizer.addRecentExercise(recentExercise);
      randomizer.clearRecentExercises();

      expect(randomizer.getRecentExercises()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customConfig = {
        immediateExclusionCount: 1,
        reducedProbabilityCount: 2,
        reducedProbabilityMultiplier: 0.5,
        maxRecentAgeMinutes: 30,
      };

      const customRandomizer = new SmartRandomizer(customConfig);

      const exercises = [
        createMockExercise(1, 1, 'lesson1'),
        createMockExercise(2, 1, 'lesson2'),
        createMockExercise(3, 2, 'lesson3'),
      ];

      const recentExercises = [
        createMockRecentExercise(1, 1, 'lesson1'),
      ];

      customRandomizer.loadRecentExercises(recentExercises);
      const selected = customRandomizer.selectExercises(exercises, 2);

      // With immediateExclusionCount: 1, should exclude exercise 1 only
      expect(selected).toHaveLength(2);
      expect(selected.some(ex => ex.exerciseInfo.id === 1)).toBe(false);
    });
  });
});

describe('Integration scenarios', () => {
  it('should handle lesson progression scenario', () => {
    const randomizer = new SmartRandomizer(DEFAULT_RANDOMIZATION_CONFIG);

    // Simulate a series of exercises from different lessons
    const exercises = [
      createMockExercise(1, 1, 'lesson1'),
      createMockExercise(2, 1, 'lesson1'),
      createMockExercise(3, 1, 'lesson2'),
      createMockExercise(4, 1, 'lesson2'),
      createMockExercise(5, 2, 'lesson3'),
      createMockExercise(6, 2, 'lesson3'),
    ];

    // User has recently done exercises from lesson1
    const recentExercises = [
      createMockRecentExercise(1, 1, 'lesson1'),
      createMockRecentExercise(2, 1, 'lesson1'),
    ];

    randomizer.loadRecentExercises(recentExercises);
    const selected = randomizer.selectExercises(exercises, 3);

    // Should prioritize exercises from lesson2 and lesson3
    // Note: Due to anti-repetition logic, only 2 exercises can be selected
    // (one from topic1/lesson2, one from topic2/lesson3)
    expect(selected).toHaveLength(2);
    expect(selected.every(ex => ex.exerciseInfo.lesson_id !== 'lesson1')).toBe(true);
  });

  it('should handle topic diversity scenario', () => {
    const randomizer = new SmartRandomizer({
      ...DEFAULT_RANDOMIZATION_CONFIG,
      immediateExclusionCount: 1, // Exclude the most recent exercise
    });

    // Exercises from different topics
    const exercises = [
      createMockExercise(1, 1, 'lesson1'),
      createMockExercise(2, 1, 'lesson2'),
      createMockExercise(3, 2, 'lesson3'),
      createMockExercise(4, 3, 'lesson4'),
    ];

    // User has recently done exercise from topic 1, lesson1
    const recentExercises = [
      createMockRecentExercise(1, 1, 'lesson1'),
    ];

    randomizer.loadRecentExercises(recentExercises);
    const selected = randomizer.selectExercises(exercises, 2);

    // Should get 2 exercises
    expect(selected).toHaveLength(2);
    // Exercise 1 (topic 1, lesson1) should be excluded due to immediate exclusion
    // So we can select from exercises 2, 3, and 4
    const selectedIds = selected.map(ex => ex.exerciseInfo.id);
    expect(selectedIds).not.toContain(1);
  });
});
