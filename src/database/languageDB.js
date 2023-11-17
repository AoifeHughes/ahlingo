const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class LanguageDB {
  constructor(dbPath = "./src/database/languageLearningDatabase.db") {
    this.db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Connection error", err.message);
        } else {
          this._initialize();
        }
      }
    );
  }

  _initialize() {
    this.db.serialize(() => {
      const tableCreationQueries = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY,
          topic TEXT NOT NULL,
          type TEXT NOT NULL,
          difficulty_level TEXT NOT NULL,
          language_1 TEXT NOT NULL,
          language_2 TEXT NOT NULL,
          language_1_content TEXT NOT NULL,
          language_2_content TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS user_exercises (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          exercise_id INTEGER,
          score INTEGER,
          attempts INTEGER DEFAULT 1,
          last_attempt_date TEXT,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (exercise_id) REFERENCES exercises (id)
        )`,
      ];

      // Create tables
      tableCreationQueries.forEach((query) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          }
        });
      });

      // Create default user
      this.db.run(
        "INSERT OR IGNORE INTO users (id, name) VALUES (?, ?)",
        [1, "user1"],
        (err) => {
          if (err) {
            console.error("Error creating default user:", err.message);
          }
        }
      );
      this._printExercisesCount();

    });
  }

  _printExercisesCount() {
    this.db.get("SELECT COUNT(*) AS count FROM exercises", [], (err, row) => {
      if (err) {
        console.error("Error fetching exercise count:", err.message);
      } else {
        console.log(`Number of entries in 'exercises' table: ${row.count}`);
      }
    });
  }

  addExercise(topic, type, difficultyLevel, language1, language2, language1Content, language2Content, callback) {
    this.db.run(
      "INSERT INTO exercises (topic, type, difficulty_level, language_1, language_2, language_1_content, language_2_content) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [topic, type, difficultyLevel, language1, language2, language1Content, language2Content],
      function (err) {
        if (typeof callback === "function") {
          callback(err, this.lastID); // this.lastID will return the ID of the newly inserted exercise
        }
      }
    );
  }
  
  getDifficultyLevels(callback) {
    this.db.all("SELECT DISTINCT difficulty_level FROM exercises", [], callback);
  }

  getTopicsByDifficulty(difficultyLevel, callback) {
    this.db.all(
      "SELECT DISTINCT topic FROM exercises WHERE difficulty_level = ?",
      [difficultyLevel],
      callback
    );
  }

  getLanguagesByTopicAndDifficulty(topic, difficultyLevel, callback) {
    this.db.all(
      "SELECT DISTINCT language_1, language_2 FROM exercises WHERE (language_1 = ? OR language_2 = ?) AND topic = ? AND difficulty_level = ?",
      [topic, difficultyLevel],
      callback
    );
  }

  getTopicsByLanguage(languageName, callback) {
    const query = `SELECT DISTINCT topic FROM exercises WHERE language_1 = ? OR language_2 = ?`;
    console.log("Query:", query);
    console.log("Language name:", languageName);
    this.db.all(query, [languageName, languageName], callback);
  }
  
  close() {
    this.db.close((err) => {
      if (err) {
        console.error(err.message);
      }
    });
  }
}

module.exports = LanguageDB;
