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
  exercise_type: 'pairs' | 'translation' | 'conversation';
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
export interface GameState {
  selectedPairs: { column1: number | null; column2: number | null };
  correctPairs: number[];
  score: { correct: number; incorrect: number };
  isLoading: boolean;
  currentPairs: PairExercise[];
}

export interface AppSettings {
  language: string;
  difficulty: string;
  userId: number;
  apiKey?: string;
  apiUrl?: string;
  hostname?: string;
  username?: string;
}

// Navigation types
export type RootStackParamList = {
  MainMenu: undefined;
  TopicSelection: { exerciseType?: 'pairs' | 'conversation' | 'translation' };
  PairsGame: { topicId: number };
  ConversationExercises: { topicId: number };
  TranslationExercises: { topicId: number };
  Chatbot: undefined;
  Settings: undefined;
};