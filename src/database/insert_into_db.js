const fs = require("fs");
const LanguageDB = require("./languageDB"); // Make sure this path is correct
const db = new LanguageDB();
const path = require("path");

async function processFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, "utf8");
    const phrases = JSON.parse(data);

    // Extract the level, which is the parent folder of the file
    const level = path.basename(path.dirname(filePath));
    // Extract the topic from the file name, assuming the format 'prompt_Topic_run_N_response.json'
    const topic = path.basename(filePath, ".json").split("_")[1]; // Gets 'Topic' from the filename

    for (const phrase of phrases) {
      await new Promise((resolve, reject) => {
        db.addExercise(level, topic, phrase.French, phrase.English, (error) => {
          if (error) {
            console.error("Error inserting data:", error);
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  } catch (err) {
    console.error("Error processing file:", err);
  }
}

async function processFiles(filePaths) {
  for (const filePath of filePaths) {
    await processFile(filePath);
  }
  db.close();
}

// Read all file paths from the command line arguments
const filePaths = process.argv.slice(2);
processFiles(filePaths);
