import { Language, Topic, Difficulty, User, ExerciseInfo, PairExercise, ConversationExercise, TranslationExercise, ExerciseWithDetails, DatabaseConnectionConfig, ExerciseType } from '../../types';
export declare class LanguageLearningDatabase {
    private mockData;
    constructor(config: DatabaseConnectionConfig);
    private initialize;
    private logDatabaseStats;
    getLanguages(): Language[];
    getLanguageById(id: number): Language | undefined;
    getTopics(): Topic[];
    getTopicsByLanguageAndDifficulty(languageId: number, difficultyId: number): Topic[];
    getDifficulties(): Difficulty[];
    getDifficultyById(id: number): Difficulty | undefined;
    getMostRecentUser(): string;
    createUser(name: string): void;
    updateUserLogin(username: string): void;
    getUserByName(name: string): User | undefined;
    getUserSetting(userId: number, settingName: string): string | undefined;
    setUserSetting(userId: number, settingName: string, settingValue: string): void;
    getUserSettings(userId: number): Record<string, string>;
    getExercisesByType(exerciseType: ExerciseType): ExerciseInfo[];
    getExercisesWithDetails(topicId: number, difficultyId: number, languageId: number, exerciseType: ExerciseType): ExerciseWithDetails[];
    getRandomPairExercise(topicId: number, difficultyId: number, languageId: number): PairExercise[];
    getConversationExercises(exerciseId: number): ConversationExercise[];
    getTranslationExercises(exerciseId: number): TranslationExercise[];
    recordExerciseAttempt(userId: number, exerciseId: number, isCorrect: boolean): void;
    close(): void;
    backup(backupPath: string): void;
}
//# sourceMappingURL=database.d.ts.map