import { Difficulty, Language, TopicWithProgress } from '../types';

/**
 * A small curated subset of the production database used purely in tests.
 * This was hand-crafted after inspecting `assets/databases/languageLearningDatabase.db`
 * to keep schemas and values aligned with what the real app expects.
 */
export const sampleLanguages: Language[] = [
  { id: 1, language: 'French' },
  { id: 2, language: 'Spanish' },
];

export const sampleDifficulties: Difficulty[] = [
  { id: 1, difficulty_level: 'Beginner' },
  { id: 2, difficulty_level: 'Intermediate' },
];

export const sampleTopicsWithProgress: TopicWithProgress[] = [
  {
    id: 1,
    topic: 'Basic questions and polite expressions',
    progress: {
      totalExercises: 4,
      completedExercises: 1,
      percentage: 25,
    },
  },
  {
    id: 2,
    topic: 'Greetings and introductions',
    progress: {
      totalExercises: 3,
      completedExercises: 3,
      percentage: 100,
    },
  },
];

export const sampleUserSettingsMissingAI = {
  language: 'French',
  difficulty: 'Beginner',
  server_url: '',
  enable_local_models: 'false',
  theme: 'frost',
};

export const sampleUserSettingsWithAI = {
  language: 'French',
  difficulty: 'Beginner',
  server_url: 'https://llm.example.com',
  enable_local_models: 'false',
  theme: 'polar',
};

export const sampleUserContext = {
  userId: 42,
  settings: {
    language: 'French',
    difficulty: 'Beginner',
  },
};
