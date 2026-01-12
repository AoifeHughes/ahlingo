import SQLite, {
  SQLiteDatabase,
  Transaction,
} from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DATABASE_CONFIG, TIMEOUTS } from './constants';
import {
  migrateUserSchema,
  initializeUserSchema,
  needsUserSchemaInitialization,
} from '../services/UserSchemaMigrationService';

// Enable debug mode and promises
SQLite.DEBUG(true);
SQLite.enablePromise(true);

const isTestEnv =
  typeof process !== 'undefined' &&
  typeof process.env !== 'undefined' &&
  typeof process.env.JEST_WORKER_ID !== 'undefined';

const createTestDatabase = (): SQLiteDatabase => {
  const emptyResult = [{ rows: { length: 0, item: () => null } }];
  const testTransaction = {
    executeSql: async () => emptyResult,
  } as unknown as Transaction;

  const testDb: Partial<SQLiteDatabase> = {
    executeSql: async () => emptyResult,
    close: async () => {},
    transaction: (_cb: (tx: Transaction) => void, errorCb?: (err: any) => void, successCb?: () => void) => {
      try {
        _cb(testTransaction);
        successCb?.();
      } catch (error) {
        errorCb?.(error);
      }
    },
    readTransaction: (_cb: (tx: Transaction) => void, errorCb?: (err: any) => void, successCb?: () => void) => {
      try {
        _cb(testTransaction);
        successCb?.();
      } catch (error) {
        errorCb?.(error);
      }
    },
  };

  return testDb as SQLiteDatabase;
};

/**
 * Database initialization and connection utilities
 * Two-Database Architecture:
 * - content.db: Read-only content database (lessons, exercises)
 * - userdata.db: User-specific data (progress, settings, chats)
 */

// Global database instance - userdata.db with content.db attached
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

    // Try to detach the content database before closing
    try {
      await withTimeout(db.executeSql('DETACH DATABASE content'), TIMEOUTS.QUERY_SHORT);
      console.log('✅ Content database detached');
    } catch (detachError) {
      // Detach might fail if already detached or if database is closing
      console.log('ℹ️ Content database detach info:', detachError);
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
 * Helper function to copy database from bundle to destination
 */
const copyDatabaseFromBundle = async (
  dbName: string,
  assetPath: string,
  destinationPath: string
): Promise<void> => {
  if (Platform.OS === 'ios') {
    // Try multiple possible locations in iOS bundle
    const possiblePaths = [
      `${RNFS.MainBundlePath}/${dbName}`,
      `${RNFS.MainBundlePath}/assets/databases/${dbName}`,
      `${RNFS.MainBundlePath}/databases/${dbName}`,
    ];

    let copied = false;
    let lastError: Error | null = null;

    for (const bundlePath of possiblePaths) {
      try {
        const exists = await RNFS.exists(bundlePath);
        if (exists) {
          await RNFS.copyFile(bundlePath, destinationPath);
          console.log(`✅ ${dbName} copied from ${bundlePath} (iOS)`);
          copied = true;
          break;
        }
      } catch (error) {
        lastError = error as Error;
        console.log(`  ⚠️ Could not copy from ${bundlePath}`);
      }
    }

    if (!copied) {
      console.error(`❌ ${dbName} not found in iOS bundle. Tried paths:`, possiblePaths);
      throw lastError || new Error(`${dbName} not found in iOS bundle`);
    }
  } else {
    // Android - try multiple asset paths
    console.log(`Android: Attempting to copy ${dbName}...`);
    console.log('Looking for:', assetPath);
    console.log('Target path:', destinationPath);

    try {
      await RNFS.copyFileAssets(assetPath, destinationPath);
      console.log(`✅ ${dbName} copied from ${assetPath} (Android)`);
    } catch (androidError) {
      console.error(`Android copy failed with ${assetPath} path:`, androidError);

      // Try alternative paths
      const alternatives = [
        dbName, // root assets
        `database/${dbName}`, // singular
        `custom/${dbName}`, // custom
      ];

      let copied = false;
      for (const altPath of alternatives) {
        try {
          console.log('Trying alternative path:', altPath);
          await RNFS.copyFileAssets(altPath, destinationPath);
          console.log(`✅ ${dbName} copied from ${altPath} (Android)`);
          copied = true;
          break;
        } catch (altError) {
          console.error(`${altPath} path failed:`, altError);
        }
      }

      if (!copied) {
        console.error(`All paths attempted have failed. ${dbName} not found in Android assets.`);
        throw androidError;
      }
    }
  }
};

/**
 * Migrate from legacy single-database to two-database architecture
 */
const migrateLegacyDatabase = async (
  legacyDbPath: string,
  contentDbPath: string,
  userDbPath: string
): Promise<void> => {
  console.log('🔄 Migrating from legacy single-database architecture...');

  // Check if split script has already been run
  const contentExists = await RNFS.exists(contentDbPath);
  const userExists = await RNFS.exists(userDbPath);

  if (contentExists && userExists) {
    console.log('✅ Split databases already exist, removing legacy database');
    await RNFS.unlink(legacyDbPath);
    return;
  }

  // If split databases don't exist, user needs to run the split script
  console.error('❌ Legacy database found but split databases not available');
  console.error('Please run: node scripts/splitDatabase.js');
  throw new Error(
    'Legacy database migration required. Run: node scripts/splitDatabase.js'
  );
};

/**
 * Get content database version from database_metadata table
 */
const getContentDbVersion = async (db: SQLiteDatabase): Promise<number> => {
  try {
    const [result] = await db.executeSql(
      'SELECT value FROM content.database_metadata WHERE key = "version"'
    );

    if (result.rows.length > 0) {
      return parseInt(result.rows.item(0).value, 10);
    }
    return 0;
  } catch (error) {
    console.error('Error getting content database version:', error);
    return 0;
  }
};

/**
 * Ensures both databases are copied and up to date
 */
export const ensureDatabaseCopied = async (): Promise<void> => {
  try {
    const documentsPath =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

    const legacyDbPath = `${documentsPath}/${DATABASE_CONFIG.LEGACY_NAME}`;
    const contentDbPath = `${documentsPath}/${DATABASE_CONFIG.CONTENT_DB.NAME}`;
    const userDbPath = `${documentsPath}/${DATABASE_CONFIG.USER_DB.NAME}`;

    // Check if legacy database exists and needs migration
    const legacyExists = await RNFS.exists(legacyDbPath);
    if (legacyExists) {
      await migrateLegacyDatabase(legacyDbPath, contentDbPath, userDbPath);
    }

    // Handle content database
    const CONTENT_VERSION_KEY = '@content_db_version';
    const installedContentVersionStr = await AsyncStorage.getItem(CONTENT_VERSION_KEY);
    const installedContentVersion = installedContentVersionStr
      ? parseInt(installedContentVersionStr, 10)
      : 0;
    const bundledContentVersion = DATABASE_CONFIG.CONTENT_DB.VERSION;

    console.log(
      `Content DB version check - Installed: ${installedContentVersion}, Bundled: ${bundledContentVersion}`
    );

    const contentExists = await RNFS.exists(contentDbPath);
    const needsContentUpdate =
      !contentExists || installedContentVersion < bundledContentVersion;

    if (needsContentUpdate) {
      console.log(`🔄 Updating content database to v${bundledContentVersion}...`);

      // Delete old content database if it exists
      if (contentExists) {
        await RNFS.unlink(contentDbPath);
        console.log('✅ Old content database deleted');
      }

      // Copy new content database from bundle
      await copyDatabaseFromBundle(
        DATABASE_CONFIG.CONTENT_DB.NAME,
        `databases/${DATABASE_CONFIG.CONTENT_DB.NAME}`,
        contentDbPath
      );

      // Update stored version
      await AsyncStorage.setItem(CONTENT_VERSION_KEY, bundledContentVersion.toString());
      console.log(`✅ Content database updated to v${bundledContentVersion}`);

      // Verify file
      const stats = await RNFS.stat(contentDbPath);
      console.log('Content database file size:', stats.size, 'bytes');
    } else {
      console.log(`✅ Content database is up to date (v${installedContentVersion})`);
    }

    // Handle user database
    const userExists = await RNFS.exists(userDbPath);

    if (!userExists) {
      console.log('🔧 User database not found, checking for template...');

      // Try to copy from template (created by split script)
      const templatePath = `${RNFS.MainBundlePath}/userdata_template.db`;
      const templateExists = Platform.OS === 'ios'
        ? await RNFS.exists(templatePath)
        : false; // Android doesn't support checking bundle files

      if (Platform.OS === 'android' || templateExists) {
        try {
          await copyDatabaseFromBundle(
            'userdata_template.db',
            'databases/userdata_template.db',
            userDbPath
          );
          console.log('✅ User database copied from template');
        } catch (templateError) {
          console.log('⚠️ Template not found, will initialize user schema manually');
        }
      }
    } else {
      console.log('✅ User database exists');
    }

    // Verify user database file
    if (await RNFS.exists(userDbPath)) {
      const userStats = await RNFS.stat(userDbPath);
      console.log('User database file size:', userStats.size, 'bytes');
    }

  } catch (error) {
    console.error('Failed to ensure databases copied:', error);
    throw error;
  }
};

/**
 * Attach content database to user database
 */
const attachContentDatabase = async (db: SQLiteDatabase): Promise<void> => {
  const documentsPath =
    Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

  const contentDbPath = `${documentsPath}/${DATABASE_CONFIG.CONTENT_DB.NAME}`;

  // Attach content database
  await db.executeSql(`ATTACH DATABASE '${contentDbPath}' AS content`);
  console.log('✅ Content database attached');

  // Verify attachment
  const [result] = await db.executeSql(
    "SELECT name FROM pragma_database_list WHERE name='content'"
  );

  if (result.rows.length === 0) {
    throw new Error('Failed to attach content database');
  }

  // Get and log content version
  try {
    const contentVersion = await getContentDbVersion(db);
    console.log(`📚 Content database version: ${contentVersion}`);
  } catch (versionError) {
    console.warn('⚠️ Could not read content version:', versionError);
  }
};

/**
 * Initialize the global database connection (call once during app startup)
 * Opens userdata.db and attaches content.db for cross-database queries
 */
export const initializeDatabase = async (): Promise<void> => {
  if (isTestEnv) {
    if (!initializationPromise) {
      globalDb = createTestDatabase();
      isInitialized = true;
      initializationPromise = Promise.resolve();
    }
    return initializationPromise;
  }

  if (isInitialized && globalDb) {
    return;
  }

  // If initialization is already in progress, wait for it
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      console.log('🔄 Initializing two-database architecture...');

      // Ensure both databases are copied and up to date
      await ensureDatabaseCopied();

      // Determine the correct database path
      const documentsPath =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;

      const userDbPath = `${documentsPath}/${DATABASE_CONFIG.USER_DB.NAME}`;

      // Open the user database
      const databaseConfig = Platform.OS === 'ios'
        ? {
            name: DATABASE_CONFIG.USER_DB.NAME,
            location: 'Documents',
          }
        : {
            name: userDbPath,
            location: 'default',
          };

      globalDb = await withTimeout(
        SQLite.openDatabase(databaseConfig),
        TIMEOUTS.CONNECTION
      );

      console.log(
        '✅ User database opened from:',
        Platform.OS === 'ios' ? 'Documents directory' : userDbPath
      );

      // Wait for database to be ready and test connection
      await new Promise(resolve => setTimeout(resolve, 100));
      await globalDb.executeSql('SELECT 1');
      console.log('✅ User database connection verified');

      // Check if user schema needs initialization
      const needsInit = await needsUserSchemaInitialization(globalDb);
      if (needsInit) {
        console.log('🔧 Initializing user schema for the first time...');
        await initializeUserSchema(globalDb);
      }

      // Attach content database
      await attachContentDatabase(globalDb);

      // Run user schema migrations
      await migrateUserSchema(globalDb);

      console.log('✅ Two-database architecture initialized successfully');
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
 * Returns userdata.db with content.db attached as 'content' schema
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
