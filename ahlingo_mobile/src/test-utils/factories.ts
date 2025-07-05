import { ExerciseInfo, PairExercise, TranslationExercise, ConversationExercise, FillInBlankExercise, Topic, StudyTopicInfo, ShuffleExercise } from '../types';

// Factory for creating test exercises
export const createExercise = (overrides: Partial<ExerciseInfo> = {}): ExerciseInfo => ({
  id: 1,
  exercise_name: 'Test Exercise',
  topic_id: 1,
  difficulty_id: 1,
  language_id: 1,
  exercise_type: 'pairs',
  lesson_id: 'test-lesson',
  ...overrides,
});

// Factory for creating test topics
export const createTopic = (overrides: Partial<Topic> = {}): Topic => ({
  id: 1,
  topic: 'Test Topic',
  ...overrides,
});

// Factory for creating study topic info
export const createStudyTopicInfo = (overrides: Partial<StudyTopicInfo> = {}): StudyTopicInfo => ({
  id: 1,
  topic: 'Test Study Topic',
  availableExerciseTypes: ['pairs', 'conversation'],
  totalExercises: 10,
  completedExercises: 5,
  percentage: 50,
  ...overrides,
});

// Factory for creating pair exercises
export const createPairExercise = (overrides: Partial<PairExercise> = {}): PairExercise => ({
  id: 1,
  exercise_id: 1,
  language_1: 'English',
  language_2: 'French',
  language_1_content: 'Hello',
  language_2_content: 'Bonjour',
  ...overrides,
});

// Factory for creating translation exercises
export const createTranslationExercise = (overrides: Partial<TranslationExercise> = {}): TranslationExercise => ({
  id: 1,
  exercise_id: 1,
  language_1: 'English',
  language_2: 'French',
  language_1_content: 'Good morning',
  language_2_content: 'Bonjour',
  ...overrides,
});

// Factory for creating conversation exercises
export const createConversationExercise = (overrides: Partial<ConversationExercise> = {}): ConversationExercise => ({
  id: 1,
  exercise_id: 1,
  speaker: 'Alice',
  message: 'Hello, how are you?',
  order_index: 1,
  language: 'English',
  ...overrides,
});

// Factory for creating fill-in-blank exercises
export const createFillInBlankExercise = (overrides: Partial<FillInBlankExercise> = {}): FillInBlankExercise => ({
  id: 1,
  exercise_id: 1,
  sentence: 'Bonjour, je _ Jacques.',
  correct_answer: "m'appelle",
  incorrect_1: 'suis',
  incorrect_2: 'ai',
  blank_position: 2,
  ...overrides,
});

// Factory for creating shuffle exercises
export const createShuffleExercise = (overrides: Partial<ShuffleExercise> = {}): ShuffleExercise => ({
  exerciseInfo: createExercise(),
  exerciseType: 'pairs',
  topicName: 'Test Topic',
  ...overrides,
});

// Factory for creating multiple exercises
export const createExercises = (count: number, type: ExerciseInfo['exercise_type'] = 'pairs'): ExerciseInfo[] => {
  return Array.from({ length: count }, (_, index) => 
    createExercise({ 
      id: index + 1, 
      exercise_name: `Test Exercise ${index + 1}`,
      exercise_type: type,
    })
  );
};

// Factory for creating multiple shuffle exercises
export const createShuffleExercises = (count: number): ShuffleExercise[] => {
  const types: ExerciseInfo['exercise_type'][] = ['pairs', 'conversation', 'translation', 'fill_in_blank'];
  
  return Array.from({ length: count }, (_, index) => {
    const type = types[index % types.length];
    return createShuffleExercise({
      exerciseInfo: createExercise({ 
        id: index + 1, 
        exercise_name: `Test Exercise ${index + 1}`,
        exercise_type: type,
      }),
      exerciseType: type,
      topicName: `Topic ${Math.floor(index / 2) + 1}`,
    });
  });
};

// Mock database results
export const createMockDatabaseResult = (data: any[] = []) => ([
  {
    rows: {
      length: data.length,
      item: (index: number) => data[index],
    },
  },
]);

// Mock user data
export const createMockUser = () => ({
  id: 1,
  name: 'testuser',
  last_login: new Date().toISOString(),
});

// Mock exercise attempt data
export const createMockExerciseAttempt = (exerciseId: number, isCorrect: boolean = true) => ({
  id: 1,
  user_id: 1,
  exercise_id: exerciseId,
  is_correct: isCorrect,
  attempted_at: new Date().toISOString(),
});