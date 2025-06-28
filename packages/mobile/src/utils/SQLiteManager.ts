import { Platform } from 'react-native';

export interface SQLiteResult {
  success: boolean;
  data?: any[];
  error?: string;
  isNativeModuleError?: boolean;
}

export class SQLiteManager {
  private static instance: SQLiteManager | null = null;
  private sqliteModule: any = null;
  private db: any = null;
  private isInitialized = false;
  private initializationError: string | null = null;

  private constructor() {}

  static getInstance(): SQLiteManager {
    if (!SQLiteManager.instance) {
      SQLiteManager.instance = new SQLiteManager();
    }
    return SQLiteManager.instance;
  }

  private async loadSQLiteModule(): Promise<any> {
    if (this.sqliteModule) {
      return this.sqliteModule;
    }

    try {
      console.log('Attempting to load SQLite module...');
      
      // Lazy load the module to prevent early NativeEventEmitter initialization
      const SQLite = await import('react-native-sqlite-storage');
      this.sqliteModule = SQLite.default || SQLite;
      
      // Enable promise support
      this.sqliteModule.enablePromise(true);
      this.sqliteModule.DEBUG(false);
      
      console.log('SQLite module loaded successfully');
      return this.sqliteModule;
      
    } catch (error: any) {
      console.error('Failed to load SQLite module:', error);
      this.initializationError = `SQLite module load failed: ${error.message}`;
      
      // Check for specific NativeEventEmitter error
      if (error.message && error.message.includes('NativeEventEmitter')) {
        this.initializationError = 'SQLite native module linking issue. Please run "cd ios && pod install" and rebuild the app.';
      }
      
      throw error;
    }
  }

  async initializeDatabase(): Promise<SQLiteResult> {
    if (this.isInitialized && this.db) {
      return { success: true };
    }

    if (this.initializationError) {
      return { 
        success: false, 
        error: this.initializationError,
        isNativeModuleError: true 
      };
    }

    try {
      console.log('Initializing SQLite database...');
      
      const SQLiteModule = await this.loadSQLiteModule();
      const databaseName = 'languageLearningDatabase.db';
      
      // Open the database directly from Documents (already copied)
      this.db = await SQLiteModule.openDatabase({
        name: databaseName,
        location: 'Documents'
      });

      // Simple connection test without full executeQuery overhead
      await new Promise<void>((resolve, reject) => {
        this.db.transaction((tx: any) => {
          tx.executeSql(
            'SELECT 1 as test',
            [],
            () => resolve(),
            (tx: any, error: any) => {
              reject(error);
              return false;
            }
          );
        });
      });
      
      this.isInitialized = true;
      console.log('SQLite database initialized successfully');
      
      return { success: true };
      
    } catch (error: any) {
      console.error('SQLite database initialization failed:', error);
      
      const errorMessage = error.message || 'Unknown database error';
      this.initializationError = errorMessage;
      
      // Determine if this is a native module error
      const isNativeModuleError = errorMessage.includes('NativeEventEmitter') || 
                                  errorMessage.includes('native module') ||
                                  errorMessage.includes('pod install');
      
      return { 
        success: false, 
        error: errorMessage,
        isNativeModuleError 
      };
    }
  }

  async executeQuery(query: string, params: any[] = []): Promise<SQLiteResult> {
    // Check if database is ready (no auto-initialization to avoid redundant calls)
    if (!this.isInitialized || !this.db) {
      return {
        success: false,
        error: 'Database not initialized. Call initializeDatabase() first.',
        isNativeModuleError: false
      };
    }

    try {
      // Log only in development mode for performance
      if (__DEV__) {
        console.log('Executing query:', query.substring(0, 50) + (query.length > 50 ? '...' : ''));
      }
      
      const results = await new Promise<any[]>((resolve, reject) => {
        this.db.transaction((tx: any) => {
          tx.executeSql(
            query,
            params,
            (tx: any, results: any) => {
              const rows = [];
              for (let i = 0; i < results.rows.length; i++) {
                rows.push(results.rows.item(i));
              }
              resolve(rows);
            },
            (tx: any, error: any) => {
              reject(error);
              return false;
            }
          );
        });
      });

      if (__DEV__) {
        console.log('Query completed, returned', results.length, 'rows');
      }
      return { success: true, data: results };
      
    } catch (error: any) {
      console.error('Query execution failed:', error);
      return { 
        success: false, 
        error: `Query failed: ${error.message}` 
      };
    }
  }

  async testConnection(): Promise<SQLiteResult> {
    if (__DEV__) {
      console.log('Testing SQLite connection...');
    }
    
    try {
      // Quick connection test - just verify database is accessible
      if (!this.isInitialized || !this.db) {
        return {
          success: false,
          error: 'Database not initialized'
        };
      }

      // Simple test: Check if topics table exists (fast)
      const topicsTest = await this.executeQuery('SELECT COUNT(*) as count FROM topics LIMIT 1');
      if (!topicsTest.success) {
        return {
          success: false,
          error: 'Database missing required tables (topics table not found)'
        };
      }

      if (__DEV__) {
        console.log('SQLite connection test passed');
      }
      return { success: true };
      
    } catch (error: any) {
      console.error('SQLite connection test failed:', error);
      return { 
        success: false, 
        error: `Connection test failed: ${error.message}` 
      };
    }
  }

  async closeDatabase(): Promise<void> {
    if (this.db) {
      try {
        await this.db.close();
        console.log('Database closed successfully');
      } catch (error) {
        console.warn('Error closing database:', error);
      }
      this.db = null;
      this.isInitialized = false;
    }
  }

  getInitializationError(): string | null {
    return this.initializationError;
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null && this.initializationError === null;
  }
}