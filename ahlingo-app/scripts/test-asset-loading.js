/**
 * This script tests the loading of language content assets.
 * It can be used to verify that the assets are properly bundled and accessible.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if a directory exists and is accessible
 * @param {string} dir - Directory path
 * @returns {boolean} - Whether the directory exists and is accessible
 */
function checkDirectory(dir) {
  try {
    fs.accessSync(dir, fs.constants.R_OK);
    const stats = fs.statSync(dir);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * List all files in a directory recursively
 * @param {string} dir - Directory path
 * @param {string[]} fileList - Array to store file paths
 * @returns {string[]} - Array of file paths
 */
function listFilesRecursively(dir, fileList = []) {
  if (!checkDirectory(dir)) {
    console.error(`Directory does not exist or is not accessible: ${dir}`);
    return fileList;
  }

  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      listFilesRecursively(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Test asset loading
 */
function testAssetLoading() {
  try {
    console.log('Testing asset loading...');
    
    // Check both the assets directory and the temp_assets directory
    const assetsDir = path.join(__dirname, '..', 'assets');
    const tempDir = path.join(__dirname, '..', 'temp_assets');
    
    // Define the language content directories
    const assetLanguageContentDir = path.join(assetsDir, 'language_learning_content');
    const tempLanguageContentDir = path.join(tempDir, 'language_learning_content');
    
    // Check if either directory exists
    let languageContentDir = null;
    if (checkDirectory(assetLanguageContentDir)) {
      languageContentDir = assetLanguageContentDir;
      console.log(`Language content directory exists in assets: ${languageContentDir}`);
    } else if (checkDirectory(tempLanguageContentDir)) {
      languageContentDir = tempLanguageContentDir;
      console.log(`Language content directory exists in temp_assets: ${languageContentDir}`);
    } else {
      console.error('Error: language_learning_content directory not found in assets or temp_assets');
      return;
    }
    
    // Check if the index.json file exists
    const indexPath = path.join(languageContentDir, 'index.json');
    try {
      fs.accessSync(indexPath, fs.constants.R_OK);
      console.log(`Index file exists: ${indexPath}`);
    } catch (error) {
      console.error(`Error: index.json file not found: ${indexPath}`);
      return;
    }
    
    // List all language directories
    const languageDirs = fs.readdirSync(languageContentDir)
      .filter(item => {
        const itemPath = path.join(languageContentDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
    
    console.log(`Found ${languageDirs.length} language directories: ${languageDirs.join(', ')}`);
    
    // Count total files
    const allFiles = listFilesRecursively(languageContentDir);
    console.log(`Total files in language content directory: ${allFiles.length}`);
    
    // Count JSON files
    const jsonFiles = allFiles.filter(file => file.endsWith('.json'));
    console.log(`Total JSON files: ${jsonFiles.length}`);
    
    // Count audio files
    const audioFiles = allFiles.filter(file => file.endsWith('.wav') || file.endsWith('.mp3'));
    console.log(`Total audio files: ${audioFiles.length}`);
    
    console.log('Asset loading test completed successfully');
  } catch (error) {
    console.error('Error testing asset loading:', error);
  }
}

// Run the test
testAssetLoading();
