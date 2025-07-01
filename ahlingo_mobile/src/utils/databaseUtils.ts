import SQLite, { SQLiteDatabase, Transaction } from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { DATABASE_CONFIG, TIMEOUTS } from './constants';

// Enable debug mode and promises
SQLite.DEBUG(true);
SQLite.enablePromise(true);

/**
 * Database initialization and connection utilities
 */

// Global database instance - initialized once
let globalDb: SQLiteDatabase | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Timeout wrapper for database operations
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = TIMEOUTS.QUERY_MEDIUM): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
};

/**
 * Safe database cleanup helper
 */
export const safeCloseDatabase = async (db: SQLiteDatabase | null): Promise<void> => {
  if (!db) return;
  
  try {
    // Try to rollback any pending transactions
    try {
      await withTimeout(db.executeSql('ROLLBACK'), TIMEOUTS.QUERY_SHORT);
    } catch (rollbackError) {
      const errorMsg = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
      if (!errorMsg.includes('database is locked') && !errorMsg.includes('not an error')) {
        console.log('Rollback not needed or failed (this is usually normal):', errorMsg);
      }
    }
    
    // Wait a brief moment for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Now try to close the database with timeout
    await withTimeout(db.close(), TIMEOUTS.CONNECTION);
    console.log('✅ Database closed safely');
    
  } catch (closeError) {
    const errorMsg = closeError instanceof Error ? closeError.message : String(closeError);
    if (!errorMsg.includes('database is closed') && !errorMsg.includes('invalid connection')) {
      console.error('Error during safe database close:', errorMsg);
    }
  }
};

/**
 * Ensures the database is copied from bundle to Documents directory
 */
export const ensureDatabaseCopied = async (): Promise<void> => {
  try {
    const bundlePath = Platform.OS === 'ios' 
      ? `${RNFS.MainBundlePath}/${DATABASE_CONFIG.NAME}`
      : `android_asset/${DATABASE_CONFIG.NAME}`;
    
    const documentsPath = Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
    
    const databasePath = `${documentsPath}/${DATABASE_CONFIG.NAME}`;
    
    const exists = await RNFS.exists(databasePath);
    
    if (!exists) {
      console.log('Database not found in documents, copying from bundle...');
      
      if (Platform.OS === 'ios') {
        await RNFS.copyFile(bundlePath, databasePath);
      } else {
        await RNFS.copyFileAssets(DATABASE_CONFIG.NAME, databasePath);
      }
      
      console.log('Database copied successfully to:', databasePath);
    } else {
      console.log('Database already exists at:', databasePath);
    }
    
    // Verify the file
    const stats = await RNFS.stat(databasePath);
    console.log('Database file size:', stats.size, 'bytes');
    
  } catch (error) {
    console.error('Failed to copy database:', error);
    throw error;
  }
};

/**
 * Initialize the global database connection (call once during app startup)
 */
export const initializeDatabase = async (): Promise<void> => {
  if (isInitialized && globalDb) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing database...');
      
      // Ensure database is copied
      await ensureDatabaseCopied();
      
      // Open the database
      globalDb = await withTimeout(
        SQLite.openDatabase({
          name: DATABASE_CONFIG.NAME,
          location: DATABASE_CONFIG.LOCATION
        }),
        TIMEOUTS.CONNECTION
      );
      
      console.log('✅ Database opened successfully');
      
      // Wait for database to be ready and test connection
      await new Promise(resolve => setTimeout(resolve, 100));
      await globalDb.executeSql('SELECT 1');
      console.log('✅ Database connection verified');
      
      isInitialized = true;
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      globalDb = null;
      isInitialized = false;
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Get the global database connection, initializing if necessary
 */
export const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (!isInitialized || !globalDb) {
    await initializeDatabase();
  }
  
  if (!globalDb) {
    throw new Error('Database not initialized');
  }
  
  return globalDb;
};

/**
 * Execute a database operation with automatic connection management
 */
export const executeQuery = async <T>(
  operation: (db: SQLiteDatabase) => Promise<T>,
  timeoutMs: number = TIMEOUTS.QUERY_MEDIUM
): Promise<T> => {
  const db = await getDatabase();
  return withTimeout(operation(db), timeoutMs);
};

/**
 * Execute a SQL query and return results
 */
export const executeSql = async (
  query: string, 
  params: any[] = [],
  timeoutMs: number = TIMEOUTS.QUERY_MEDIUM
): Promise<any[]> => {
  return executeQuery(async (db) => {
    const results = await db.executeSql(query, params);
    return results;
  }, timeoutMs);
};

/**
 * Execute a SQL query and return the first result set
 */
export const executeSqlSingle = async (
  query: string, 
  params: any[] = [],
  timeoutMs: number = TIMEOUTS.QUERY_MEDIUM
): Promise<any> => {
  const results = await executeSql(query, params, timeoutMs);
  return results && results[0] ? results[0] : null;
};

/**
 * Convert SQL result rows to array of objects
 */
export const rowsToArray = <T>(rows: any): T[] => {
  const result: T[] = [];
  if (rows && rows.length > 0) {
    for (let i = 0; i < rows.length; i++) {
      result.push(rows.item(i));
    }
  }
  return result;
};

/**
 * Get single row from SQL results
 */
export const getSingleRow = <T>(results: any): T | null => {
  if (results && results.rows && results.rows.length > 0) {
    return results.rows.item(0);
  }
  return null;
};

/**
 * Execute transaction with automatic rollback on error
 */
export const executeTransaction = async <T>(
  operations: (transaction: Transaction) => Promise<T>,
  timeoutMs: number = TIMEOUTS.QUERY_MEDIUM
): Promise<T> => {
  return executeQuery(async (db) => {
    return new Promise<T>((resolve, reject) => {
      db.transaction(
        async (tx) => {
          try {
            const result = await operations(tx);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          console.error('Transaction failed:', error);
          reject(error);
        }
      );
    });
  }, timeoutMs);
};

/**
 * Cleanup function - close database connection (call during app shutdown)
 */
export const closeDatabase = async (): Promise<void> => {
  if (globalDb) {
    await safeCloseDatabase(globalDb);
    globalDb = null;
    isInitialized = false;
    initializationPromise = null;
  }
};