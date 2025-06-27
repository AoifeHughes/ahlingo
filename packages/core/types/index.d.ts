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
export interface User {
    id: number;
    name: string;
    last_login?: Date;
}
export interface UserSetting {
    id: number;
    user_id: number;
    setting_name: string;
    setting_value: string;
}
export interface ExerciseInfo {
    id: number;
    exercise_name: string;
    topic_id: number;
    difficulty_id: number;
    language_id: number;
    exercise_type: ExerciseType;
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
export interface ConversationExercise {
    id: number;
    exercise_id: number;
    conversation_order?: number;
    speaker: string;
    message: string;
}
export interface TranslationExercise {
    id: number;
    exercise_id: number;
    language_1: string;
    language_2: string;
    language_1_content: string;
    language_2_content: string;
}
export interface UserExerciseAttempt {
    id: number;
    user_id: number;
    exercise_id: number;
    is_correct: boolean;
    attempt_date: Date;
}
export interface ChatDetail {
    id: number;
    user_id: number;
    language: string;
    difficulty: string;
    model: string;
    created_at: Date;
    last_updated: Date;
}
export interface ChatHistory {
    id: number;
    chat_id: number;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}
export interface PronunciationAudio {
    id: number;
    text: string;
    language: string;
    audio_data: Buffer;
    exercise_type: string;
    topic?: string;
    difficulty?: string;
    created_at: Date;
}
export type ExerciseType = 'pairs' | 'conversation' | 'translation' | 'chatbot';
export interface ExerciseWithDetails extends ExerciseInfo {
    topic: Topic;
    difficulty: Difficulty;
    language: Language;
}
export interface PairExerciseWithInfo extends PairExercise {
    exercise_info: ExerciseWithDetails;
}
export interface ConversationWithInfo extends ConversationExercise {
    exercise_info: ExerciseWithDetails;
}
export interface TranslationWithInfo extends TranslationExercise {
    exercise_info: ExerciseWithDetails;
}
export interface PairGameState {
    pairs: PairExercise[];
    selectedLeft?: number;
    selectedRight?: number;
    matchedPairs: Set<number>;
    score: {
        correct: number;
        incorrect: number;
    };
    currentExercise?: ExerciseWithDetails;
    isLoading: boolean;
    error?: string;
}
export interface GamePair {
    id: number;
    leftText: string;
    rightText: string;
    matched: boolean;
    leftSelected: boolean;
    rightSelected: boolean;
}
export interface UserSettings {
    language: Language;
    difficulty: Difficulty;
    userId: number;
    apiConfig?: {
        endpoint?: string;
        apiKey?: string;
    };
}
export interface DatabaseConnectionConfig {
    path: string;
    isReadOnly?: boolean;
}
export type ScreenName = 'MainMenu' | 'Settings' | 'TopicSelection' | 'PairsGame' | 'ConversationExercises' | 'TranslationExercises' | 'Chatbot';
export interface NavigationParams {
    MainMenu: undefined;
    Settings: undefined;
    TopicSelection: undefined;
    PairsGame: {
        topicId: number;
        exerciseId?: number;
    };
    ConversationExercises: {
        topicId: number;
    };
    TranslationExercises: {
        topicId: number;
    };
    Chatbot: undefined;
}
//# sourceMappingURL=index.d.ts.map