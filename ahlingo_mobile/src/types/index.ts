// Database entity types based on Kivy app schema
export interface User {
  id: number;
  name: string;
  last_login?: string;
}

export interface Language {
  id: number;
  language: string;
}

export interface Topic {
  id: number;
  topic: string;
}

export interface TopicWithProgress extends Topic {
  progress: {
    totalExercises: number;
    completedExercises: number;
    percentage: number;
  };
}

export interface StudyTopicInfo extends Topic {
  availableExerciseTypes: ('pairs' | 'conversation' | 'translation' | 'fill_in_blank')[];
  totalExercises: number;
  completedExercises: number;
  percentage: number;
}

export interface Difficulty {
  id: number;
  difficulty_level: string;
}

export interface ExerciseInfo {
  id: number;
  exercise_name: string;
  topic_id: number;
  difficulty_id: number;
  language_id: number;
  exercise_type: 'pairs' | 'translation' | 'conversation' | 'fill_in_blank';
  lesson_id?: string;
}

export interface PairExercise {
  id: number;
  exercise_id: number;
  language_1: string;
  language_2: string;
  language_1_content: string;
  language_2_content: string;
}

export interface TranslationExercise {
  id: number;
  exercise_id: number;
  language_1: string;
  language_2: string;
  language_1_content: string;
  language_2_content: string;
}

export interface FillInBlankExercise {
  id: number;
  exercise_id: number;
  sentence: string; // Sentence with blank marked as _ (e.g., "Bonjour, je _ Jacques.")
  correct_answer: string; // Correct word (e.g., "m'appelle")
  incorrect_1: string; // First distractor (e.g., "suis")
  incorrect_2: string; // Second distractor (e.g., "ai")
  blank_position: number; // Position of blank in sentence (e.g., 2)
  translation?: string; // English translation of the complete sentence (e.g., "Hello, my name is Jacques.")
}

export interface ConversationExercise {
  id: number;
  exercise_id: number;
  speaker: string;
  message: string;
  order_index?: number;
  language?: string;
}

export interface UserSetting {
  id: number;
  user_id: number;
  setting_name: string;
  setting_value: string;
}

export interface ChatDetail {
  id: number;
  user_id: number;
  language: string;
  difficulty: string;
  model: string;
  created_at: string;
  last_updated: string;
}

export interface ChatHistory {
  id: number;
  chat_id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// UI state types
export interface RecentExercise {
  exerciseId: number;
  topicId: number;
  exerciseType: string;
  lessonId?: string;
  timestamp: number;
}

export interface GameState {
  selectedPairs: { column1: number | null; column2: number | null };
  correctPairs: number[];
  score: { correct: number; incorrect: number };
  isLoading: boolean;
  currentPairs: PairExercise[];
  recentExercises: RecentExercise[];
}

export interface AppSettings {
  language: string;
  difficulty: string;
  userId: number;
  apiKey?: string;
  apiUrl?: string;
  hostname?: string;
  username?: string;
  enableLocalModels?: boolean;
  preferLocalModels?: boolean;
  preferredVoices?: { [languageCode: string]: string }; // Map of language code to preferred voice ID
}

// Local LLM types
export interface LocalModel {
  id: string;
  name: string;
  filename: string;
  downloadUrl: string;
  filePath?: string;
  fileSize?: number;
  isDownloaded?: boolean;
  isDownloading?: boolean;
  downloadProgress?: number;
  description?: string;
}

export interface LocalModelDownloadProgress {
  modelId: string;
  progress: number;
  bytesWritten: number;
  contentLength: number;
}

export interface LocalLlamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LocalLlamaCompletion {
  text: string;
  timings?: {
    predicted_per_token_ms: number;
    predicted_per_second: number;
  };
}

export interface TokenData {
  token: string;
}

// Navigation types
// Exercise Shuffle types
export interface ShuffleExercise {
  exerciseInfo: ExerciseInfo;
  exerciseType: 'pairs' | 'conversation' | 'translation' | 'fill_in_blank';
  topicName: string;
}

export interface ExerciseShuffleContext {
  isShuffleMode: boolean;
  currentChallenge: number;
  totalChallenges: number;
  onComplete: (success: boolean) => void;
}

export type RootStackParamList = {
  Welcome: undefined;
  MainMenu: undefined;
  TopicSelection: { exerciseType?: 'pairs' | 'conversation' | 'translation' | 'fill_in_blank' };
  PairsGame: {
    topicId?: number;
    shuffleContext?: ExerciseShuffleContext;
    exerciseInfo?: ExerciseInfo;
  };
  ConversationExercises: {
    topicId?: number;
    shuffleContext?: ExerciseShuffleContext;
    exerciseInfo?: ExerciseInfo;
  };
  TranslationExercises: {
    topicId?: number;
    shuffleContext?: ExerciseShuffleContext;
    exerciseInfo?: ExerciseInfo;
  };
  Chatbot: undefined;
  Settings: undefined;
  Stats: undefined;
  RetryMistakes: undefined;
  About: undefined;
  // New feature screens
  StudyTopic: undefined;
  StudyTopicShuffle: {
    topicId: number;
    topicName: string;
    exercises: ShuffleExercise[];
  };
  FillInTheBlank: {
    topicId?: number;
    shuffleContext?: ExerciseShuffleContext;
    exerciseInfo?: ExerciseInfo;
  };
  // Exercise Shuffle specific screens
  ExerciseShuffleStart: { exercises: ShuffleExercise[] };
  ExerciseShuffleTransition: {
    currentChallenge: number;
    totalChallenges: number;
    success: boolean;
    nextExercise: ShuffleExercise | null;
    results: boolean[];
    exercises: ShuffleExercise[];
  };
  ExerciseShuffleSummary: {
    results: boolean[];
    exercises: ShuffleExercise[];
  };
};
