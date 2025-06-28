#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗄️ Copying database for mobile app...');

const sourceDb = path.join(__dirname, '../../../database/languageLearningDatabase.db');
const androidAssets = path.join(__dirname, '../android/app/src/main/assets');
const iOSBundle = path.join(__dirname, '../ios/mobile');

// Create directories if they don't exist
if (!fs.existsSync(androidAssets)) {
  fs.mkdirSync(androidAssets, { recursive: true });
}

if (!fs.existsSync(iOSBundle)) {
  fs.mkdirSync(iOSBundle, { recursive: true });
}

// Copy database to Android assets
const androidDbPath = path.join(androidAssets, 'languageLearningDatabase.db');
fs.copyFileSync(sourceDb, androidDbPath);
console.log('✅ Database copied to Android assets');

// Copy database to iOS bundle
const iOSDbPath = path.join(iOSBundle, 'languageLearningDatabase.db');
fs.copyFileSync(sourceDb, iOSDbPath);
console.log('✅ Database copied to iOS bundle');

console.log('🎉 Database copying completed successfully!');

// Also add the database to Xcode project if not already added
try {
  require('./add-db-to-xcode.js');
} catch (error) {
  console.warn('⚠️ Could not add database to Xcode project:', error.message);
}