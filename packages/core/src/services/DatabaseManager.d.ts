import { LanguageLearningDatabase } from './database';
import { DatabaseConnectionConfig } from '../../types';
export declare class DatabaseManager {
    private static instance;
    private db;
    private constructor();
    static getInstance(): DatabaseManager;
    getDatabase(config?: DatabaseConnectionConfig): LanguageLearningDatabase;
    closeDatabase(): void;
    static reset(): void;
}
//# sourceMappingURL=DatabaseManager.d.ts.map