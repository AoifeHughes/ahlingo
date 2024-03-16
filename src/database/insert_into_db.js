const fs = require('fs');
const LanguageDB = require('./LanguageDB'); // Adjust the path as necessary
const { v4: uuidv4 } = require('uuid');

// Modify the db instantiation to include a callback for initialization completion
const db = new LanguageDB('./src/database/languageLearningDatabase.db', () => {
  // Initialization complete, now safe to insert data
  main(); // Moved the call to main here, to ensure it runs after DB initialization
});

function addContentFromFile(filename) {
  const pathParts = filename.split('/');
  // log path
  const language = pathParts[1];
  const exerciseType = pathParts[2];
  const topic = pathParts[3].replace(/_/g, ' ');
  const difficulty = pathParts[4].split('.')[0];

  console.log(`Adding content for language: ${language} - Exercise type: ${exerciseType} - Topic: ${topic} - Difficulty: ${difficulty}`);

  fs.readFile(filename, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    const content = JSON.parse(data);
    content.forEach((conversationExercise, index) => {
      const exerciseId = uuidv4(); // Generate a random unique ID
      const exerciseName = `${topic} Conversation ${index + 1} - ID: ${exerciseId}`;

      if (exerciseType === 'pairs') {
        db.addPairExerciseFromJSON(exerciseName, language, topic, difficulty, conversationExercise, (err, exerciseId) => {
          if (err) {
            console.error(`Error adding pairs exercise ${index + 1}:`, err);
          } else {
            console.log(`Added pairs exercise ${index + 1} with ID: ${exerciseId}`);
          }
        });
      } else if (exerciseType === 'translations') {
        db.addTranslationExerciseFromJSON(exerciseName, language, topic, difficulty, conversationExercise, (err, exerciseId) => {
          if (err) {
            console.error(`Error adding translations exercise ${index + 1}:`, err);
          } else {
            console.log(`Added translations exercise ${index + 1} with ID: ${exerciseId}`);
          }
        });
      } else {
        db.addConversationExerciseFromJSON(exerciseName, language, topic, difficulty, conversationExercise, (err, exerciseId) => {
          if (err) {
            console.error(`Error adding conversation exercise ${index + 1}:`, err);
          } else {
            console.log(`Added conversation exercise ${index + 1} with ID: ${exerciseId}`);
          }
        });
      }
    });
  });
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) {
    console.error('Usage: node scriptName.js <path/to/jsonfile>');
    process.exit(1);
  }

  const filename = args[0];
  addContentFromFile(filename);
}

