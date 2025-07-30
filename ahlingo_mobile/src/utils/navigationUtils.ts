import { RootStackParamList } from '../types';

export type ExerciseType = 'pairs' | 'conversation' | 'translation';

/**
 * Navigation utilities for exercise types
 */

/**
 * Get the appropriate screen name for an exercise type
 */
export const getExerciseScreenName = (
  exerciseType: ExerciseType
): keyof RootStackParamList => {
  switch (exerciseType) {
    case 'pairs':
      return 'PairsGame';
    case 'conversation':
      return 'ConversationExercises';
    case 'translation':
      return 'TranslationExercises';
    default:
      return 'PairsGame';
  }
};

/**
 * Get the display name for an exercise type
 */
export const getExerciseTypeName = (exerciseType: ExerciseType): string => {
  switch (exerciseType) {
    case 'pairs':
      return 'Match Words';
    case 'conversation':
      return 'Conversation';
    case 'translation':
      return 'Translation';
    default:
      return 'Unknown';
  }
};

/**
 * Get the icon for an exercise type
 */
export const getExerciseIcon = (exerciseType: ExerciseType): string => {
  switch (exerciseType) {
    case 'pairs':
      return '🎯';
    case 'conversation':
      return '💬';
    case 'translation':
      return '📝';
    default:
      return '❓';
  }
};

/**
 * Get the exercise type title for screen headers
 */
export const getExerciseTypeTitle = (exerciseType: ExerciseType): string => {
  switch (exerciseType) {
    case 'pairs':
      return 'Pairs Exercises';
    case 'conversation':
      return 'Conversation Exercises';
    case 'translation':
      return 'Translation Exercises';
    default:
      return 'Choose a Topic';
  }
};

/**
 * Navigate to the appropriate exercise screen
 */
export const navigateToExercise = (
  navigation: any,
  exerciseType: ExerciseType,
  topicId: number
): void => {
  const screenName = getExerciseScreenName(exerciseType);
  navigation.navigate(screenName, { topicId });
};
