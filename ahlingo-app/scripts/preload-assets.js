/**
 * This script helps with preloading assets for the app.
 * It creates the necessary directory structure and files for language content.
 */

const fs = require('fs');
const path = require('path');

/**
 * Create a directory if it doesn't exist
 * @param {string} dir - Directory path
 */
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

/**
 * Create a simple index.json file
 * @param {string} dir - Directory path
 */
function createIndexFile(dir) {
  const indexPath = path.join(dir, 'index.json');
  
  if (!fs.existsSync(indexPath)) {
    const simpleIndex = {
      languages: {
        Spanish: { name: "Spanish" },
        French: { name: "French" },
        German: { name: "German" },
        Ukrainian: { name: "Ukrainian" }
      }
    };
    
    fs.writeFileSync(indexPath, JSON.stringify(simpleIndex, null, 2));
    console.log(`Created index.json file at: ${indexPath}`);
  }
}

/**
 * Create a simple lesson.json file
 * @param {string} dir - Directory path
 * @param {string} language - Language name
 * @param {string} difficulty - Difficulty level
 * @param {string} exerciseType - Exercise type
 * @param {string} topic - Topic name
 * @param {number} id - Exercise ID
 */
function createLessonFile(dir, language, difficulty, exerciseType, topic, id) {
  const lessonDir = path.join(dir, language, difficulty, exerciseType, topic, id.toString());
  createDirIfNotExists(lessonDir);
  
  const lessonPath = path.join(lessonDir, 'lesson.json');
  
  if (!fs.existsSync(lessonPath)) {
    const lesson = {
      id: id,
      type: exerciseType,
      name: `${topic} ${exerciseType} Lesson - ID: ${id}`,
      language: language,
      topic: topic,
      difficulty: difficulty,
      content: {
        english: {
          text: "Sample English text",
        },
        target_language: {
          text: "Sample target language text",
        }
      }
    };
    
    fs.writeFileSync(lessonPath, JSON.stringify(lesson, null, 2));
    console.log(`Created lesson.json file at: ${lessonPath}`);
  }
}

/**
 * Main function to preload assets
 */
function preloadAssets() {
  try {
    console.log('Preloading assets...');

    // Define the target directory
    const tempDir = path.join(__dirname, '..', 'temp_assets');
    const languageContentDir = path.join(tempDir, 'language_learning_content');
    
    // Create the language content directory
    createDirIfNotExists(languageContentDir);
    
    // Create the index.json file
    createIndexFile(languageContentDir);
    
    // Define the languages, difficulties, exercise types, and topics
    const languages = ['Spanish', 'French', 'German', 'Ukrainian'];
    const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
    const exerciseTypes = ['pairs', 'translations', 'conversations'];
    const topics = ['Greetings', 'Food', 'Colors', 'Numbers', 'Family'];
    
    // Create the directory structure and sample lesson files
    let id = 1000;
    for (const language of languages) {
      for (const difficulty of difficulties) {
        for (const exerciseType of exerciseTypes) {
          for (const topic of topics) {
            // Create a sample lesson file
            createLessonFile(languageContentDir, language, difficulty, exerciseType, topic, id++);
          }
        }
      }
    }
    
    console.log('Assets preloaded successfully');
  } catch (error) {
    console.error('Error preloading assets:', error);
  }
}

// Run the preload function
preloadAssets();
