# Database Migration Guide

## Overview

The AhLingo app now includes a comprehensive database migration system that preserves user data when updating the database to a new version. This prevents users from losing their settings, chat histories, and progress statistics when the app is updated with new content.

## How It Works

When the app detects that a newer database version is bundled:

1. **Backup Phase**: All user data is backed up to AsyncStorage
   - User accounts
   - User settings (language, difficulty, preferences)
   - Chat sessions and messages
   - Aggregate statistics (total attempts, correct count, per-topic progress)

2. **Replace Phase**: The old database is deleted and replaced with the new version

3. **Restore Phase**: User data is restored to the new database
   - Users and settings are fully restored
   - Chat histories are preserved
   - Aggregate stats are stored as settings for display

4. **Cleanup Phase**: Temporary backup data is removed

## What Gets Preserved

✅ **Fully Preserved:**
- User accounts and authentication
- All user settings (language preference, difficulty level, theme, etc.)
- Complete chat conversation histories
- Aggregate progress statistics:
  - Total exercise attempts (lifetime)
  - Total correct attempts (lifetime)
  - Per-language statistics
  - Per-topic completion percentages

❌ **Reset During Migration:**
- Individual exercise attempt records (these reference specific exercise IDs that change between database versions)

The aggregate stats are preserved as special settings:
- `legacy_total_attempts` - Total number of exercises attempted before migration
- `legacy_total_correct` - Total number of correct exercises before migration
- `legacy_language_stats` - Statistics broken down by language (JSON)
- `legacy_topic_stats` - Statistics broken down by topic (JSON)
- `last_migration_date` - When the last migration occurred

## Updating the Database

### Step 1: Update Database Content

Update your database file in the appropriate locations:
- iOS: `assets/databases/languageLearningDatabase.db`
- Android: `android/app/src/main/assets/databases/languageLearningDatabase.db`

### Step 2: Update Database Metadata

Update the version in the `database_metadata` table within the database itself:

```sql
UPDATE database_metadata SET value = '141' WHERE key = 'version';
```

### Step 3: Update App Configuration

Update the version constant in `src/utils/constants.ts`:

```typescript
export const DATABASE_CONFIG = {
  NAME: 'languageLearningDatabase.db',
  VERSION: 141,  // Increment this to match database_metadata
} as const;
```

### Step 4: Test

Test the migration on a development device that has existing user data:

1. Install the current version and create some user data (settings, chat messages, attempt some exercises)
2. Install the new version with updated database
3. Verify that:
   - Settings are preserved
   - Chat history is intact
   - Aggregate stats appear in settings
   - New exercises are available

## Technical Details

### Files Involved

- **`src/services/DatabaseMigrationService.ts`** - Core migration logic
  - `backupUserData()` - Exports user data to AsyncStorage
  - `calculateAggregateStats()` - Computes lifetime statistics
  - `restoreUserData()` - Imports data back after replacement
  - `performDatabaseMigration()` - Orchestrates the entire process

- **`src/utils/databaseUtils.ts`** - Database initialization
  - `ensureDatabaseCopied()` - Detects version mismatch and triggers migration
  - `copyDatabaseFromBundle()` - Handles platform-specific database copying

### Migration Safety

The migration system includes several safety mechanisms:

1. **Progress Tracking**: Uses `@migration_in_progress` flag to detect incomplete migrations
2. **Backup Persistence**: Backup data remains in AsyncStorage until migration completes successfully
3. **Error Handling**: If migration fails, the backup remains available for recovery
4. **Recovery Function**: `attemptMigrationRecovery()` can restore from backup if needed

### AsyncStorage Keys

- `@database_version` - Currently installed database version
- `@database_migration_backup` - JSON backup of user data during migration
- `@migration_in_progress` - Flag indicating active migration

## Troubleshooting

### Migration Fails

If a migration fails, the app will log detailed error messages. The backup data remains in AsyncStorage, allowing for manual recovery or retry.

To manually trigger recovery:
```typescript
import { attemptMigrationRecovery } from './services/DatabaseMigrationService';
await attemptMigrationRecovery();
```

### User Data Missing

Check AsyncStorage for backup data:
```typescript
import { getStoredBackup } from './services/DatabaseMigrationService';
const backup = await getStoredBackup();
console.log('Backup data:', backup);
```

### Version Mismatch

Ensure that:
1. `DATABASE_CONFIG.VERSION` in constants.ts
2. `database_metadata.version` in the actual database file
3. Both match the same version number

## Future Enhancements

Potential improvements for the migration system:

1. **Smart Exercise Matching**: Hash exercise content to preserve progress for unchanged exercises
2. **UI Progress Indicator**: Show migration progress to user with percentage complete
3. **Migration History**: Store history of all migrations for debugging
4. **Selective Backup**: Allow configuration of what data to preserve
5. **Cloud Backup Integration**: Sync backup data to cloud before migration

## Example: First Migration

When a user updates from v140 to v141:

```
Before Migration:
- User: "default_user" with settings
- 50 exercise attempts (30 correct)
- 5 chat conversations with 100+ messages

During Migration:
📦 Backing up: 1 user, 8 settings, 5 chats, 123 messages
📊 Calculating stats: 50 attempts, 30 correct, 3 topics attempted
🔄 Replacing database v140 → v141
📥 Restoring user data...
✅ Migration complete!

After Migration:
- User: "default_user" with all settings intact
- 5 chat conversations with all 100+ messages preserved
- Settings show: "legacy_total_attempts: 50, legacy_total_correct: 30"
- Ready to attempt new exercises from v141 database
```

## Questions?

For implementation details, see:
- `src/services/DatabaseMigrationService.ts` - Main migration logic with extensive comments
- `src/utils/databaseUtils.ts` - Integration with database initialization

The migration system is designed to be robust, safe, and transparent to the end user while protecting their valuable data.
