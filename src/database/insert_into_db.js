const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const LanguageDB = require("./languageDB"); // Update this path as needed

// Function to read JSON file
function readJsonFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(data));
    });
  });
}

// Function to insert exercise into the database
async function insertExercisesFromFile(filePath, db) {
  try {
    const exercises = await readJsonFile(filePath);
    exercises.forEach((exercise) => {
      // Extracting topic, type, and difficulty from file path
      const filePathParts = filePath.split("/");
      const language = filePathParts[3]; // Assuming 'french' is the fourth element in the path
      const level = filePathParts[4]; // Assuming 'advanced' is the fifth element in the path

      // Extracting the topic from the file name
      const fileName = filePathParts[filePathParts.length - 1]; // Get the last part of the path
      const topic = fileName
        .replace("prompt_", "") // Remove 'prompt_'
        .split("_run")[0] // Split at '_run' and take the first part
        .replace(/_/g, " "); // Replace all underscores with spaces
      db.addExercise(
        topic,
        "Translation", // Assuming the type is 'Translation'
        level,
        "French", // Assuming the first language is 'French'
        "English", // Assuming the second language is 'English
        exercise.French,
        exercise.English,
        (err, lastID) => {
          if (err) {
            console.error("Error inserting exercise:", err.message);
          } else {
            console.log(`Exercise inserted with ID: ${lastID}`);
          }
        },
      );
    });
  } catch (err) {
    console.error("Error processing file:", err.message);
  }
}

// Main function that accepts the file path as an argument
async function main(filePath) {
  const dbPath = "./languageLearningDatabase.db"; // Adjust this path if necessary
  const db = new LanguageDB(dbPath);

  await insertExercisesFromFile(filePath, db);

  db.close(); // Close the database connection
}

const filePath = process.argv[2]; // Get file path from command line argument
if (!filePath) {
  console.error("No file path provided.");
  process.exit(1);
}

main(filePath);
