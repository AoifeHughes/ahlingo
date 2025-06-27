/**
 * API interfaces and types for future server integration
 */
import { Language, Topic, Difficulty, ExerciseWithDetails, PairExercise, ConversationExercise, TranslationExercise, UserSettings, User, ExerciseType } from '../../types';
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
}
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
        pairs: {
            attempts: number;
            correct: number;
        };
        conversation: {
            attempts: number;
            correct: number;
        };
        translation: {
            attempts: number;
            correct: number;
        };
    };
}
export interface SyncDataResponse {
    syncTimestamp: string;
    conflictsResolved: number;
    itemsSynced: number;
}
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
export interface ApiClient {
    login(request: LoginRequest): Promise<ApiResponse<LoginResponse>>;
    createUser(request: CreateUserRequest): Promise<ApiResponse<User>>;
    logout(): Promise<ApiResponse<void>>;
    getLanguages(): Promise<ApiResponse<GetLanguagesResponse>>;
    getTopics(): Promise<ApiResponse<GetTopicsResponse>>;
    getDifficulties(): Promise<ApiResponse<GetDifficultiesResponse>>;
    getUserSettings(): Promise<ApiResponse<GetUserSettingsResponse>>;
    updateUserSettings(request: UpdateUserSettingsRequest): Promise<ApiResponse<UserSettings>>;
    getExercises(request: GetExercisesRequest): Promise<ApiResponse<GetExercisesResponse>>;
    getPairExercises(topicId: number, languageId?: number, difficultyId?: number): Promise<ApiResponse<GetPairExercisesResponse>>;
    getConversationExercises(exerciseId: number): Promise<ApiResponse<GetConversationExercisesResponse>>;
    getTranslationExercises(exerciseId: number): Promise<ApiResponse<GetTranslationExercisesResponse>>;
    recordAttempt(request: RecordAttemptRequest): Promise<ApiResponse<void>>;
    getUserProgress(): Promise<ApiResponse<UserProgressResponse>>;
    syncData(request: SyncDataRequest): Promise<ApiResponse<SyncDataResponse>>;
    sendChatMessage(request: ChatRequest): Promise<ApiResponse<ChatResponse>>;
}
export declare class MockApiClient implements ApiClient {
    private isAuthenticated;
    private currentUser;
    login(request: LoginRequest): Promise<ApiResponse<LoginResponse>>;
    createUser(request: CreateUserRequest): Promise<ApiResponse<User>>;
    logout(): Promise<ApiResponse<void>>;
    getLanguages(): Promise<ApiResponse<GetLanguagesResponse>>;
    getTopics(): Promise<ApiResponse<GetTopicsResponse>>;
    getDifficulties(): Promise<ApiResponse<GetDifficultiesResponse>>;
    getUserSettings(): Promise<ApiResponse<GetUserSettingsResponse>>;
    updateUserSettings(): Promise<ApiResponse<UserSettings>>;
    getExercises(): Promise<ApiResponse<GetExercisesResponse>>;
    getPairExercises(): Promise<ApiResponse<GetPairExercisesResponse>>;
    getConversationExercises(): Promise<ApiResponse<GetConversationExercisesResponse>>;
    getTranslationExercises(): Promise<ApiResponse<GetTranslationExercisesResponse>>;
    recordAttempt(): Promise<ApiResponse<void>>;
    getUserProgress(): Promise<ApiResponse<UserProgressResponse>>;
    syncData(): Promise<ApiResponse<SyncDataResponse>>;
    sendChatMessage(): Promise<ApiResponse<ChatResponse>>;
    private delay;
}
//# sourceMappingURL=index.d.ts.map