const fs = require("fs");
const LanguageDB = require("./languageDB"); // Assuming LanguageDB is in the same directory

const filePath = process.argv[2];
const db = new LanguageDB();

// Extract level and topic from the file path
const pathComponents = filePath.split("/");
const level = pathComponents[pathComponents.length - 2];
const topic = filePath.split("_")[1]; // Adjust the index as needed

// Read and parse the JSON file
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }
  const phrases = JSON.parse(data);

  // Insert each phrase into the database
  phrases.forEach((phrase) => {
    // Assuming 'french' and 'english' are the keys in your JSON objects
    const french = phrase.French;
    const english = phrase.English;

    // Modify this to suit your DB schema and methods
    db.addExercise(level, topic, french, english, (error) => {
      if (error) {
        console.error("Error inserting data:", error);
      }
    });
  });
});

// Close the database connection
db.close();
