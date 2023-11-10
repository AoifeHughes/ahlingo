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
    // Create tables if they don't exist

    this.db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS languages (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      language_id INTEGER,
      FOREIGN KEY (language_id) REFERENCES languages (id)
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY,
      topic_id INTEGER,
      french TEXT NOT NULL,
      english TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics (id)
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS user_exercises (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      exercise_id INTEGER,
      score INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 1,
      last_attempt_date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )`);
  }

  addLanguage(languageName, callback) {
    this.db.run(
      "INSERT INTO languages (name) VALUES (?)",
      [languageName],
      function (err) {
        callback(err, this.lastID);
      }
    );
  }

  getLanguages(callback) {
    this.db.all("SELECT * FROM languages", callback);
  }

  addTopic(topicName, languageId, callback) {
    this.db.run(
      "INSERT INTO topics (name, language_id) VALUES (?, ?)",
      [topicName, languageId],
      function (err) {
        callback(err, this.lastID);
      }
    );
  }

  getTopics(callback) {
    this.db.all("SELECT * FROM topics", callback);
  }

  getTopicsByLanguage(languageId, callback) {
    this.db.all(
      "SELECT * FROM topics WHERE language_id = ?",
      [languageId],
      callback
    );
  }

  addExercise(topicId, french, english, callback) {
    this.db.run(
      "INSERT INTO exercises (topic_id, french, english) VALUES (?, ?, ?)",
      [topicId, french, english],
      function (err) {
        callback(err, this.lastID);
      }
    );
  }

  getExercises(callback) {
    this.db.all("SELECT * FROM exercises", callback);
  }

  getExercisesByTopic(topicId, callback) {
    this.db.all(
      "SELECT * FROM exercises WHERE topic_id = ?",
      [topicId],
      callback
    );
  }

  updateUserExercise(userId, exerciseId, score, callback) {
    this.db.run(
      `UPDATE user_exercises SET score = ?, attempts = attempts + 1, last_attempt_date = CURRENT_TIMESTAMP 
       WHERE user_id = ? AND exercise_id = ?`,
      [score, userId, exerciseId],
      function (err) {
        callback(err, this.changes);
      }
    );
  }

  getUserExerciseHistory(userId, callback) {
    this.db.all(
      `SELECT u.name, e.french, e.english, ue.score, ue.attempts, ue.last_attempt_date 
       FROM user_exercises ue 
       JOIN users u ON ue.user_id = u.id 
       JOIN exercises e ON ue.exercise_id = e.id 
       WHERE u.id = ?`,
      [userId],
      callback
    );
  }

  languageExists(languageName, callback) {
    this.db.get(
      "SELECT id FROM languages WHERE name = ?",
      [languageName],
      callback
    );
  }

  topicExists(topicName, callback) {
    this.db.get("SELECT id FROM topics WHERE name = ?", [topicName], callback);
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error(err.message);
      } else {
        console.log("Closed the SQLite database connection.");
      }
    });
  }
}

module.exports = LanguageDB;
