import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';

// Enable debug mode to see SQL logs
SQLite.DEBUG(true);
SQLite.enablePromise(true);

// First, ensure the database is copied from bundle to Documents
async function ensureDatabaseCopied() {
  try {
    const databaseName = 'languageLearningDatabase.db'; // Note: capital L
    const bundlePath = Platform.OS === 'ios' 
      ? `${RNFS.MainBundlePath}/${databaseName}`
      : `android_asset/${databaseName}`;
    
    const documentsPath = Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
    
    const databasePath = `${documentsPath}/${databaseName}`;
    
    const exists = await RNFS.exists(databasePath);
    
    if (!exists) {
      console.log('Database not found in documents, copying from bundle...');
      
      if (Platform.OS === 'ios') {
        await RNFS.copyFile(bundlePath, databasePath);
      } else {
        await RNFS.copyFileAssets(databaseName, databasePath);
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
}

export const logDatabaseTables = async () => {
  let db = null;
  
  try {
    // First ensure database is copied
    await ensureDatabaseCopied();
    
    console.log('🔄 Opening database...');
    
    // Open database from Documents directory (where we just copied it)
    db = await SQLite.openDatabase({
      name: 'languageLearningDatabase.db', // Note: capital L
      location: 'Documents' // This is the key difference!
    });
    
    console.log('✅ Database opened successfully');
    
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test connection
    await db.executeSql('SELECT 1');
    console.log('✅ Database connection verified');
    
    // Query all table names
    const results = await db.executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
    );
    
    if (!results || !results[0]) {
      console.log('No results returned');
      return;
    }
    
    const tables = results[0].rows;
    console.log(`\n📊 Found ${tables.length} tables:\n`);
    
    // Log each table name
    for (let i = 0; i < tables.length; i++) {
      const tableName = tables.item(i).name;
      console.log(`  📋 ${tableName}`);
      
      // Get row count for each table
      try {
        const countResult = await db.executeSql(
          `SELECT COUNT(*) as count FROM ${tableName}`
        );
        const count = countResult[0].rows.item(0).count;
        console.log(`     Rows: ${count}`);
      } catch (error) {
        console.error(`     Error counting rows:`, error.message);
      }
      
      // Get column info for each table
      try {
        const columnResults = await db.executeSql(
          `PRAGMA table_info("${tableName}");`
        );
        
        if (columnResults && columnResults[0]) {
          const columns = columnResults[0].rows;
          console.log(`     Columns:`);
          
          for (let j = 0; j < columns.length; j++) {
            const col = columns.item(j);
            console.log(`       - ${col.name} (${col.type})`);
          }
        }
      } catch (colError) {
        console.error(`     Error getting columns:`, colError.message);
      }
      
      console.log(''); // Empty line for readability
    }
    
  } catch (error) {
    console.error('❌ Database Error:', error);
    console.error('Details:', error.message);
  } finally {
    // Always close the database
    if (db) {
      try {
        await db.close();
        console.log('✅ Database closed');
      } catch (closeError) {
        console.error('Error closing database:', closeError);
      }
    }
  }
};