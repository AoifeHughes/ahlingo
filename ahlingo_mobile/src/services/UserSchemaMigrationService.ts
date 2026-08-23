/**
 * User Schema Migration Service
 *
 * Manages incremental migrations for the userdata.db database.
 * Each migration is applied only once and tracked in schema_version table.
 *
 * IMPORTANT: Never modify existing migrations. Always add new ones.
 */

import { SQLiteDatabase } from 'react-native-sqlite-storage';

export interface Migration {
  version: number;
  description: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * User schema migrations
 * Version 1 is the initial schema created by splitDatabase.js
 */
export const USER_SCHEMA_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial user schema',
    up: async (db: SQLiteDatabase) => {
      // Version 1 is already created by the split script
      // This migration is just for documentation
      console.log('User schema v1: Initial schema from split');
    },
  },

  // Example future migrations:
  // {
  //   version: 2,
  //   description: 'Add email field to users',
  //   up: async (db: SQLiteDatabase) => {
  //     await db.executeSql(`
  //       ALTER TABLE users ADD COLUMN email TEXT;
  //     `);
  //   },
  // },
  //
  // {
  //   version: 3,
  //   description: 'Add index on user_exercise_attempts',
  //   up: async (db: SQLiteDatabase) => {
  //     await db.executeSql(`
  //       CREATE INDEX IF NOT EXISTS idx_attempts_user_exercise
  //       ON user_exercise_attempts(user_id, exercise_id);
  //     `);
  //   },
  // },
];

/**
 * Get the current schema version from the database
 */
export async function getUserSchemaVersion(
  db: SQLiteDatabase
): Promise<number> {
  try {
    const [result] = await db.executeSql(
      'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
    );

    if (result.rows.length > 0) {
      return result.rows.item(0).version;
    }
    return 0;
  } catch (error) {
    console.error('Error getting user schema version:', error);
    return 0;
  }
}

/**
 * Update the schema version in the database
 */
async function setUserSchemaVersion(
  db: SQLiteDatabase,
  version: number
): Promise<void> {
  await db.executeSql(
    'INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, datetime("now"))',
    [version]
  );
}

/**
 * Apply all pending migrations to the user database
 */
export async function migrateUserSchema(db: SQLiteDatabase): Promise<void> {
  const currentVersion = await getUserSchemaVersion(db);

  console.log(`📊 Current user schema version: ${currentVersion}`);

  const pendingMigrations = USER_SCHEMA_MIGRATIONS.filter(
    m => m.version > currentVersion
  );

  if (pendingMigrations.length === 0) {
    console.log('✅ User schema is up to date');
    return;
  }

  console.log(
    `🔄 Applying ${pendingMigrations.length} user schema migrations...`
  );

  for (const migration of pendingMigrations) {
    console.log(
      `  ⬆️  Applying migration ${migration.version}: ${migration.description}`
    );

    try {
      await db.transaction(async tx => {
        await migration.up(tx as any);
        await setUserSchemaVersion(tx as any, migration.version);
      });

      console.log(`  ✅ Migration ${migration.version} applied successfully`);
    } catch (error) {
      console.error(`  ❌ Migration ${migration.version} failed:`, error);
      throw new Error(
        `Failed to apply user schema migration ${migration.version}: ${error}`
      );
    }
  }

  console.log('✅ All user schema migrations applied successfully');
}

/**
 * Rollback to a specific schema version (for development/testing only)
 * WARNING: This can cause data loss. Use with caution.
 */
export async function rollbackUserSchema(
  db: SQLiteDatabase,
  targetVersion: number
): Promise<void> {
  const currentVersion = await getUserSchemaVersion(db);

  if (targetVersion >= currentVersion) {
    console.log('No rollback needed');
    return;
  }

  console.warn(
    `⚠️  Rolling back user schema from ${currentVersion} to ${targetVersion}`
  );
  console.warn('⚠️  This may cause data loss!');

  // For now, we don't implement down migrations
  // In production, you would need to add 'down' functions to each migration
  throw new Error(
    'Rollback not implemented. Please restore from backup if needed.'
  );
}

/**
 * Check if user database needs schema initialization
 */
export async function needsUserSchemaInitialization(
  db: SQLiteDatabase
): Promise<boolean> {
  try {
    const [result] = await db.executeSql(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'`
    );
    return result.rows.length === 0;
  } catch (error) {
    return true;
  }
}

/**
 * Initialize user database schema (for new installations)
 * This creates all user tables from scratch
 */
export async function initializeUserSchema(db: SQLiteDatabase): Promise<void> {
  console.log('🔧 Initializing user database schema...');

  await db.transaction(async tx => {
    // Create schema version table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        last_login TIMESTAMP
      )
    `);

    // Create user_exercise_attempts table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS user_exercise_attempts (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        exercise_id INTEGER NOT NULL,
        is_correct BOOLEAN NOT NULL,
        attempt_date TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (exercise_id) REFERENCES content.exercises_info (id)
      )
    `);

    // Create user_settings table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        setting_name TEXT NOT NULL,
        setting_value TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, setting_name)
      )
    `);

    // Create chat_details table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS chat_details (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        language TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL,
        last_updated TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create chat_histories table
    await tx.executeSql(`
      CREATE TABLE IF NOT EXISTS chat_histories (
        id INTEGER PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        FOREIGN KEY (chat_id) REFERENCES chat_details (id)
      )
    `);

    // Set initial version
    await tx.executeSql(
      'INSERT OR REPLACE INTO schema_version (version) VALUES (1)'
    );
  });

  console.log('✅ User database schema initialized');
}
