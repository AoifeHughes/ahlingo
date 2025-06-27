/**
 * API interfaces and types for future server integration
 */

import {
  Language,
  Topic,
  Difficulty,
  ExerciseWithDetails,
  PairExercise,
  ConversationExercise,
  TranslationExercise,
  UserSettings,
  User,
  ExerciseType,
} from '../../types';

// Base API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// API request interfaces
export interface LoginRequest {
  username: string;
  password?: string;
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  password?: string;
}

export interface UpdateUserSettingsRequest {
  languageId?: number;
  difficultyId?: number;
  apiEndpoint?: string;
  apiKey?: string;
}

export interface GetExercisesRequest {
  topicId: number;
  exerciseType: ExerciseType;
  languageId?: number;
  difficultyId?: number;
  limit?: number;
  offset?: number;
}

export interface RecordAttemptRequest {
  exerciseId: number;
  isCorrect: boolean;
  responseTime?: number;
  userAnswer?: string;
}

export interface SyncDataRequest {
  lastSyncTimestamp?: string;
  data: {
    settings?: UserSettings;
    attempts?: Array<{
      exerciseId: number;
      isCorrect: boolean;
      timestamp: string;
    }>;
  };
}

// API response interfaces
export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface GetLanguagesResponse {
  languages: Language[];
}

export interface GetTopicsResponse {
  topics: Topic[];
}

export interface GetDifficultiesResponse {
  difficulties: Difficulty[];
}

export interface GetExercisesResponse {
  exercises: ExerciseWithDetails[];
  totalCount: number;
  hasMore: boolean;
}

export interface GetPairExercisesResponse {
  exercises: PairExercise[];
  exerciseInfo?: ExerciseWithDetails;
}

export interface GetConversationExercisesResponse {
  exercise: ExerciseWithDetails;
  conversation: ConversationExercise[];
}

export interface GetTranslationExercisesResponse {
  exercise: ExerciseWithDetails;
  translations: TranslationExercise[];
}

export interface GetUserSettingsResponse {
  settings: UserSettings;
}

export interface UserProgressResponse {
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  streakDays: number;
  lastActivity: string;
  exerciseStats: {
    pairs: { attempts: number; correct: number };
    conversation: { attempts: number; correct: number };
    translation: { attempts: number; correct: number };
  };
}

export interface SyncDataResponse {
  syncTimestamp: string;
  conflictsResolved: number;
  itemsSynced: number;
}

// ChatBot API interfaces (for future AI integration)
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  context?: {
    language: string;
    difficulty: string;
    topic?: string;
  };
  conversationHistory?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  corrections?: Array<{
    original: string;
    correction: string;
    explanation: string;
  }>;
}

// API Client interface
export interface ApiClient {
  // Authentication
  login(request: LoginRequest): Promise<ApiResponse<LoginResponse>>;
  createUser(request: CreateUserRequest): Promise<ApiResponse<User>>;
  logout(): Promise<ApiResponse<void>>;

  // Reference data
  getLanguages(): Promise<ApiResponse<GetLanguagesResponse>>;
  getTopics(): Promise<ApiResponse<GetTopicsResponse>>;
  getDifficulties(): Promise<ApiResponse<GetDifficultiesResponse>>;

  // User settings
  getUserSettings(): Promise<ApiResponse<GetUserSettingsResponse>>;
  updateUserSettings(request: UpdateUserSettingsRequest): Promise<ApiResponse<UserSettings>>;

  // Exercises
  getExercises(request: GetExercisesRequest): Promise<ApiResponse<GetExercisesResponse>>;
  getPairExercises(topicId: number, languageId?: number, difficultyId?: number): Promise<ApiResponse<GetPairExercisesResponse>>;
  getConversationExercises(exerciseId: number): Promise<ApiResponse<GetConversationExercisesResponse>>;
  getTranslationExercises(exerciseId: number): Promise<ApiResponse<GetTranslationExercisesResponse>>;

  // Progress tracking
  recordAttempt(request: RecordAttemptRequest): Promise<ApiResponse<void>>;
  getUserProgress(): Promise<ApiResponse<UserProgressResponse>>;

  // Data synchronization
  syncData(request: SyncDataRequest): Promise<ApiResponse<SyncDataResponse>>;

  // Chatbot
  sendChatMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>>;
}

// Mock API Client for development
export class MockApiClient implements ApiClient {
  private isAuthenticated = false;
  private currentUser: User | null = null;

  async login(request: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    // Mock implementation
    await this.delay(500);
    
    const user: User = {
      id: 1,
      name: request.username,
      last_login: new Date(),
    };

    this.isAuthenticated = true;
    this.currentUser = user;

    return {
      success: true,
      data: {
        user,
        token: 'mock-token-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async createUser(request: CreateUserRequest): Promise<ApiResponse<User>> {
    await this.delay(300);
    
    const user: User = {
      id: Math.floor(Math.random() * 1000),
      name: request.username,
      last_login: new Date(),
    };

    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    this.isAuthenticated = false;
    this.currentUser = null;
    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  async getLanguages(): Promise<ApiResponse<GetLanguagesResponse>> {
    await this.delay(200);
    return {
      success: true,
      data: {
        languages: [
          { id: 1, language: 'French' },
          { id: 2, language: 'Spanish' },
          { id: 3, language: 'German' },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getTopics(): Promise<ApiResponse<GetTopicsResponse>> {
    await this.delay(200);
    return {
      success: true,
      data: {
        topics: [
          { id: 1, topic: 'Greetings' },
          { id: 2, topic: 'Numbers' },
          { id: 3, topic: 'Colors' },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getDifficulties(): Promise<ApiResponse<GetDifficultiesResponse>> {
    await this.delay(200);
    return {
      success: true,
      data: {
        difficulties: [
          { id: 1, difficulty_level: 'Beginner' },
          { id: 2, difficulty_level: 'Intermediate' },
          { id: 3, difficulty_level: 'Advanced' },
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Implement other methods as needed...
  async getUserSettings(): Promise<ApiResponse<GetUserSettingsResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async updateUserSettings(): Promise<ApiResponse<UserSettings>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async getExercises(): Promise<ApiResponse<GetExercisesResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async getPairExercises(): Promise<ApiResponse<GetPairExercisesResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async getConversationExercises(): Promise<ApiResponse<GetConversationExercisesResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async getTranslationExercises(): Promise<ApiResponse<GetTranslationExercisesResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async recordAttempt(): Promise<ApiResponse<void>> {
    await this.delay(200);
    return {
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  async getUserProgress(): Promise<ApiResponse<UserProgressResponse>> {
    await this.delay(200);
    throw new Error('Not implemented in mock');
  }

  async syncData(): Promise<ApiResponse<SyncDataResponse>> {
    await this.delay(1000);
    throw new Error('Not implemented in mock');
  }

  async sendChatMessage(): Promise<ApiResponse<ChatResponse>> {
    await this.delay(1500);
    throw new Error('Not implemented in mock');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}