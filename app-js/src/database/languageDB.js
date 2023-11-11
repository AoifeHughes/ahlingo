const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class LanguageDB {
  constructor(dbPath = path.resolve(__dirname, "languageLearningDatabase.db")) {
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
        `CREATE TABLE IF NOT EXISTS languages (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS topics (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          language_id INTEGER,
          FOREIGN KEY (language_id) REFERENCES languages (id)
        )`,
        `CREATE TABLE IF NOT EXISTS exercises (
          id INTEGER PRIMARY KEY,
          topic_id INTEGER,
          french TEXT NOT NULL,
          english TEXT NOT NULL,
          FOREIGN KEY (topic_id) REFERENCES topics (id)
        )`,
        `CREATE TABLE IF NOT EXISTS user_exercises (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          exercise_id INTEGER,
          score INTEGER NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 1,
          last_attempt_date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES users (id),
          FOREIGN KEY (exercise_id) REFERENCES exercises (id)
        )`,
      ];

      tableCreationQueries.forEach((query) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          }
        });
      });
    });
  }

  addLanguage(languageName, callback) {
    this.db.run(
      "INSERT INTO languages (name) VALUES (?)",
      [languageName],
      function (err) {
        if (typeof callback === "function") {
          callback(err, this.lastID);
        }
      }
    );
  }

  addTopic(topicName, languageId, callback) {
    this.db.run(
      "INSERT INTO topics (name, language_id) VALUES (?, ?)",
      [topicName, languageId],
      function (err) {
        if (typeof callback === "function") {
          callback(err, this.lastID);
        }
      }
    );
  }

  addExercise(topicId, french, english, callback) {
    this.db.run(
      "INSERT INTO exercises (topic_id, french, english) VALUES (?, ?, ?)",
      [topicId, french, english],
      function (err) {
        if (typeof callback === "function") {
          callback(err, this.lastID);
        }
      }
    );
  }

  updateUserExercise(userId, exerciseId, score, callback) {
    this.db.run(
      "UPDATE user_exercises SET score = ?, attempts = attempts + 1, last_attempt_date = CURRENT_TIMESTAMP WHERE user_id = ? AND exercise_id = ?",
      [score, userId, exerciseId],
      function (err) {
        if (typeof callback === "function") {
          callback(err, this.changes);
        }
      }
    );
  }

  getAllLevels(callback) {
    this.db.all("SELECT DISTINCT name FROM languages", callback);
  }

  getTopicsByLanguage(languageName, callback) {
    this.db.all(
      "SELECT t.name FROM topics t JOIN languages l ON t.language_id = l.id WHERE l.name = ?",
      [languageName],
      callback
    );
  }

  getExercisesByTopic(topicName, callback) {
    this.db.all(
      "SELECT e.french, e.english FROM exercises e JOIN topics t ON e.topic_id = t.id WHERE t.name = ?",
      [topicName],
      callback
    );
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
