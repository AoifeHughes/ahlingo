#!/usr/bin/env node

/**
 * Database Split Script
 *
 * This script splits the monolithic languageLearningDatabase.db into two databases:
 * 1. content.db - Read-only content (lessons, exercises, etc.)
 * 2. userdata_template.db - User-specific data template (progress, settings, chats)
 *
 * Usage: node scripts/splitDatabase.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const SOURCE_DB = path.join(__dirname, '../assets/databases/languageLearningDatabase.db');
const CONTENT_DB = path.join(__dirname, '../assets/databases/content.db');
const USERDATA_DB_TEMPLATE = path.join(__dirname, '../assets/databases/userdata_template.db');

// Tables that belong to content database
const CONTENT_TABLES = [
  'database_metadata',
  'pronunciation_audio',
  'difficulties',
  'languages',
  'topics',
  'exercises_info',
  'pair_exercises',
  'conversation_exercises',
  'conversation_summaries',
  'translation_exercises',
  'fill_in_blank_exercises'
];

// Tables that belong to user database
const USER_TABLES = [
  'users',
  'user_exercise_attempts',
  'user_settings',
  'chat_details',
  'chat_histories'
];

async function copyTable(sourceDb, targetDbPath, tableName) {
  return new Promise((resolve, reject) => {
    sourceDb.serialize(() => {
      // Get table schema
      sourceDb.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
        if (err) {
          reject(new Error(`Error getting schema for ${tableName}: ${err.message}`));
          return;
        }

        if (!row) {
          console.log(`⚠️  Table ${tableName} not found, skipping...`);
          resolve();
          return;
        }

        // Attach target database
        sourceDb.run(`ATTACH DATABASE '${targetDbPath}' AS target`, (err) => {
          if (err) {
            reject(new Error(`Error attaching target database: ${err.message}`));
            return;
          }

          // Create table in target
          sourceDb.run(row.sql.replace(/CREATE TABLE (\w+)/i, 'CREATE TABLE target.$1'), (err) => {
            if (err) {
              reject(new Error(`Error creating table ${tableName}: ${err.message}`));
              return;
            }

            // Copy data
            sourceDb.run(`INSERT INTO target.${tableName} SELECT * FROM main.${tableName}`, (err) => {
              if (err) {
                reject(new Error(`Error copying data for ${tableName}: ${err.message}`));
                return;
              }

              // Detach target database
              sourceDb.run('DETACH DATABASE target', (err) => {
                if (err) {
                  reject(new Error(`Error detaching target database: ${err.message}`));
                  return;
                }

                console.log(`  ✅ Copied ${tableName}`);
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

async function copyTables(sourceDb, targetDbPath, tables) {
  for (const table of tables) {
    await copyTable(sourceDb, targetDbPath, table);
  }
}

async function addSchemaVersion(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS schema_version (
          version INTEGER PRIMARY KEY,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        db.run(`INSERT OR REPLACE INTO schema_version (version) VALUES (1)`, (err) => {
          if (err) {
            reject(err);
            return;
          }

          db.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  });
}

async function copyIndices(sourceDb, contentDbPath, userDbPath) {
  return new Promise((resolve, reject) => {
    sourceDb.all(`SELECT sql, tbl_name FROM sqlite_master WHERE type='index' AND sql IS NOT NULL`, [], async (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      console.log(`\n📇 Found ${rows.length} indices to copy...`);

      for (const row of rows) {
        const sql = row.sql;
        const tableName = row.tbl_name;

        // Determine which db the index belongs to
        let targetDbPath = null;

        if (CONTENT_TABLES.includes(tableName)) {
          targetDbPath = contentDbPath;
        } else if (USER_TABLES.includes(tableName)) {
          targetDbPath = userDbPath;
        }

        if (targetDbPath) {
          try {
            await new Promise((resolveIndex, rejectIndex) => {
              const db = new sqlite3.Database(targetDbPath);
              db.run(sql, (err) => {
                db.close();
                if (err && !err.message.includes('already exists')) {
                  console.warn(`⚠️  Warning creating index on ${tableName}:`, err.message);
                }
                resolveIndex();
              });
            });
          } catch (indexError) {
            console.warn(`⚠️  Error copying index for ${tableName}:`, indexError.message);
          }
        }
      }

      console.log('✅ Indices copied');
      resolve();
    });
  });
}

async function main() {
  console.log('🔄 Starting database split process...\n');

  // Check if source database exists
  if (!fs.existsSync(SOURCE_DB)) {
    console.error(`❌ Source database not found: ${SOURCE_DB}`);
    process.exit(1);
  }

  // Backup existing databases
  if (fs.existsSync(CONTENT_DB)) {
    const backup = CONTENT_DB + '.backup.' + Date.now();
    fs.copyFileSync(CONTENT_DB, backup);
    console.log(`📦 Backed up existing content.db to ${path.basename(backup)}`);
  }

  if (fs.existsSync(USERDATA_DB_TEMPLATE)) {
    const backup = USERDATA_DB_TEMPLATE + '.backup.' + Date.now();
    fs.copyFileSync(USERDATA_DB_TEMPLATE, backup);
    console.log(`📦 Backed up existing userdata_template.db to ${path.basename(backup)}`);
  }

  // Open source database
  const sourceDb = new sqlite3.Database(SOURCE_DB, (err) => {
    if (err) {
      console.error('❌ Error opening source database:', err.message);
      process.exit(1);
    }
  });

  // Delete old databases
  if (fs.existsSync(CONTENT_DB)) fs.unlinkSync(CONTENT_DB);
  if (fs.existsSync(USERDATA_DB_TEMPLATE)) fs.unlinkSync(USERDATA_DB_TEMPLATE);

  // Create empty databases
  fs.closeSync(fs.openSync(CONTENT_DB, 'w'));
  fs.closeSync(fs.openSync(USERDATA_DB_TEMPLATE, 'w'));

  try {
    // Copy content tables
    console.log('\n📚 Copying content tables...');
    await copyTables(sourceDb, CONTENT_DB, CONTENT_TABLES);
    console.log('✅ Content tables copied successfully');

    // Copy user tables
    console.log('\n👤 Copying user tables...');
    await copyTables(sourceDb, USERDATA_DB_TEMPLATE, USER_TABLES);
    console.log('✅ User tables copied successfully');

    // Add schema version to user database
    console.log('\n🔢 Adding schema version tracking...');
    await addSchemaVersion(USERDATA_DB_TEMPLATE);
    console.log('✅ Schema version tracking added');

    // Copy indices
    await copyIndices(sourceDb, CONTENT_DB, USERDATA_DB_TEMPLATE);

    console.log('\n✅ Database split completed successfully!\n');
    console.log('📁 Created files:');
    console.log(`   - ${path.relative(process.cwd(), CONTENT_DB)}`);
    console.log(`   - ${path.relative(process.cwd(), USERDATA_DB_TEMPLATE)}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Review the new database files');
    console.log('   2. Update your React Native asset configuration');
    console.log('   3. Test the database initialization');
    console.log('\n💡 The userdata_template.db is used as a template for new installations.');
    console.log('   Existing user data will be preserved during app updates.');

    sourceDb.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error during split:', error.message);
    sourceDb.close();
    process.exit(1);
  }
}

main();
