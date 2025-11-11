import SQLite, {
  SQLiteDatabase,
  Transaction,
} from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = TIMEOUTS.QUERY_MEDIUM
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
};

/**
 * Enhanced transaction-aware database cleanup helper with state validation
 */
export const safeCloseDatabase = async (
  db: SQLiteDatabase | null
): Promise<void> => {
  if (!db) return;

  try {
    // First, verify the database is actually open by testing a simple operation
    let isDatabaseOpen = false;
    try {
      // Test if database is responsive with a lightweight query
      await withTimeout(db.executeSql('SELECT 1'), TIMEOUTS.QUERY_SHORT);
      isDatabaseOpen = true;
    } catch (testError) {
      const testErrorMsg = testError instanceof Error ? testError.message : String(testError);

      if (
        testErrorMsg.includes('database is not open') ||
        testErrorMsg.includes('database is closed') ||
        testErrorMsg.includes('invalid connection')
      ) {
        console.log('ℹ️ Database already closed, no cleanup needed');
        return;
      } else {
        console.log('⚠️ Database test query failed, but attempting cleanup anyway:', testErrorMsg);
        // Continue with cleanup attempt even if test query fails for other reasons
        isDatabaseOpen = true;
      }
    }

    if (!isDatabaseOpen) {
      return;
    }

    // Check if we're in a transaction by querying SQLite's internal state
    let inTransaction = false;
    try {
      const result = await withTimeout(db.executeSql('PRAGMA journal_mode'), TIMEOUTS.QUERY_SHORT);
      // If we can execute this, the database is responsive

      // Try to detect if we're in a transaction by attempting a savepoint
      try {
        await withTimeout(db.executeSql('SAVEPOINT test_transaction_state'), TIMEOUTS.QUERY_SHORT);
        await withTimeout(db.executeSql('RELEASE SAVEPOINT test_transaction_state'), TIMEOUTS.QUERY_SHORT);
      } catch (savepointError) {
        // If savepoint fails, we might be in a transaction
        inTransaction = true;
      }
    } catch (pragmaError) {
      // Database might be closed or corrupted
      console.log('Database state check failed, attempting direct close');
    }

    // If we detected an active transaction, try to clean it up
    if (inTransaction) {
      console.log('🔄 Active transaction detected, attempting cleanup...');

      // Try multiple rollback attempts with increasing delays
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await withTimeout(db.executeSql('ROLLBACK'), TIMEOUTS.QUERY_SHORT);
          console.log(`✅ Transaction rolled back on attempt ${attempt}`);
          break;
        } catch (rollbackError) {
          const errorMsg = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);

          if (errorMsg.includes('no transaction is active')) {
            // Transaction was already completed
            console.log('✅ No active transaction found');
            break;
          }

          if (attempt === maxAttempts) {
            console.log(`⚠️ Could not rollback transaction after ${maxAttempts} attempts:`, errorMsg);
          } else {
            console.log(`🔄 Rollback attempt ${attempt} failed, retrying...`);
            // Wait longer between attempts
            await new Promise(resolve => setTimeout(resolve, 200 * attempt));
          }
        }
      }
    }

    // Wait for any pending operations to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Now try to close the database with timeout
    await withTimeout(db.close(), TIMEOUTS.CONNECTION);
    console.log('✅ Database closed safely');

  } catch (closeError) {
    const errorMsg = closeError instanceof Error ? closeError.message : String(closeError);

    // Filter out expected/harmless errors and categorize them properly
    if (
      errorMsg.includes('database is closed') ||
      errorMsg.includes('invalid connection') ||
      errorMsg.includes('database cannot be closed while a transaction is in progress') ||
      errorMsg.includes('database is not open') ||
      errorMsg.includes('cannot close: database is not open')
    ) {
      console.log('ℹ️ Database close info:', errorMsg);
    } else {
      console.error('❌ Unexpected error during database close:', errorMsg);
    }
  }
};

/**
 * Ensures the database is copied from bundle to Documents directory
 * Checks version and replaces database if a newer version is bundled
 */
export const ensureDatabaseCopied = async (): Promise<void> => {
  try {
    const bundlePath =
      Platform.OS === 'ios'
        ? `${RNFS.MainBundlePath}/${DATABASE_CONFIG.NAME}`
        : `android_asset/${DATABASE_CONFIG.NAME}`;

    const documentsPath =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

    const databasePath = `${documentsPath}/${DATABASE_CONFIG.NAME}`;

    const exists = await RNFS.exists(databasePath);

    // Check the installed database version
    const DB_VERSION_KEY = '@database_version';
    const installedVersionStr = await AsyncStorage.getItem(DB_VERSION_KEY);
    const installedVersion = installedVersionStr ? parseInt(installedVersionStr, 10) : 0;
    const bundledVersion = DATABASE_CONFIG.VERSION;

    console.log(`Database version check - Installed: ${installedVersion}, Bundled: ${bundledVersion}`);

    // Determine if we need to copy/update the database
    const needsUpdate = !exists || installedVersion < bundledVersion;

    if (needsUpdate) {
      if (exists && installedVersion < bundledVersion) {
        console.log(`🔄 Database update detected (v${installedVersion} → v${bundledVersion}). Replacing database...`);
        // Delete the old database before copying the new one
        await RNFS.unlink(databasePath);
        console.log('✅ Old database deleted');
      } else if (!exists) {
        console.log('Database not found in documents, copying from bundle...');
      }

      if (Platform.OS === 'ios') {
        await RNFS.copyFile(bundlePath, databasePath);
      } else {
        // Enhanced Android debugging
        console.log('Android: Attempting to copy database...');
        console.log('Looking for:', `databases/${DATABASE_CONFIG.NAME}`);
        console.log('Target path:', databasePath);

        try {
          // Try to list all assets to see what's available
          console.log('Attempting to read Android assets directory...');
          // Note: RNFS doesn't support listing Android assets directly
          // We'll try different paths to help debug

          // Try the expected path first
          await RNFS.copyFileAssets(`databases/${DATABASE_CONFIG.NAME}`, databasePath);
        } catch (androidError) {
          console.error('Android copy failed with databases/ path:', androidError);

          // Try alternative paths
          console.log('Trying alternative paths...');

          try {
            // Try without subdirectory
            console.log('Trying root assets path:', DATABASE_CONFIG.NAME);
            await RNFS.copyFileAssets(DATABASE_CONFIG.NAME, databasePath);
          } catch (rootError) {
            console.error('Root path also failed:', rootError);

            try {
              // Try with database (singular)
              console.log('Trying database/ (singular) path:', `database/${DATABASE_CONFIG.NAME}`);
              await RNFS.copyFileAssets(`database/${DATABASE_CONFIG.NAME}`, databasePath);
            } catch (singularError) {
              console.error('Singular database/ path failed:', singularError);

              // Try custom directory
              try {
                console.log('Trying custom/ path:', `custom/${DATABASE_CONFIG.NAME}`);
                await RNFS.copyFileAssets(`custom/${DATABASE_CONFIG.NAME}`, databasePath);
              } catch (customError) {
                console.error('Custom path failed:', customError);
                console.error('All paths attempted have failed. Database file not found in Android assets.');
                throw androidError; // Throw the original error
              }
            }
          }
        }
      }

      console.log('Database copied successfully to:', databasePath);

      // Update the stored version number after successful copy
      await AsyncStorage.setItem(DB_VERSION_KEY, bundledVersion.toString());
      console.log(`✅ Database version updated to v${bundledVersion}`);
    } else {
      console.log(`✅ Database is up to date (v${installedVersion})`);
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

      // Determine the correct database path for opening
      const documentsPath =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

      const databasePath = `${documentsPath}/${DATABASE_CONFIG.NAME}`;

      // Open the database using absolute path for Android, location for iOS
      const databaseConfig = Platform.OS === 'ios'
        ? {
            name: DATABASE_CONFIG.NAME,
            location: 'Documents',
          }
        : {
            name: databasePath,
            location: 'default',
          };

      globalDb = await withTimeout(
        SQLite.openDatabase(databaseConfig),
        TIMEOUTS.CONNECTION
      );

      console.log('✅ Database opened successfully from:', Platform.OS === 'ios' ? 'Documents directory' : databasePath);

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
  return executeQuery(async db => {
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
  return executeQuery(async db => {
    return new Promise<T>((resolve, reject) => {
      db.transaction(
        async tx => {
          try {
            const result = await operations(tx);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        },
        (error: any) => {
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
