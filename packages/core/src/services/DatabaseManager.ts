import { LanguageLearningDatabase } from './database';
import { DatabaseConnectionConfig } from '../../types';

export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: LanguageLearningDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  getDatabase(config?: DatabaseConnectionConfig): LanguageLearningDatabase {
    if (!this.db) {
      const defaultConfig: DatabaseConnectionConfig = {
        path: 'database/languageLearningDatabase.db',
        isReadOnly: false,
      };
      
      this.db = new LanguageLearningDatabase(config || defaultConfig);
    }
    return this.db;
  }

  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Reset the singleton (useful for testing)
  static reset(): void {
    if (DatabaseManager.instance?.db) {
      DatabaseManager.instance.db.close();
    }
    DatabaseManager.instance = null;
  }
}