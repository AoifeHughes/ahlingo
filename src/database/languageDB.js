// languageDB.js

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

    this.db.run(`CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT
    )`);

    this.db.run(`CREATE TABLE IF NOT EXISTS user_exercises (
      id INTEGER PRIMARY KEY,
      user_id INTEGER,
      exercise_id INTEGER,
      score INTEGER NOT NULL,
      date TEXT NOT NULL,
      keyword TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (exercise_id) REFERENCES exercises (id)
    )`);
  }

  addUser(name, callback) {
    this.db.run(
      "INSERT OR IGNORE INTO users (name) VALUES (?)",
      [name],
      callback
    );
  }

  addExercise(type, description, callback) {
    this.db.run(
      "INSERT OR IGNORE INTO exercises (type, description) VALUES (?, ?)",
      [type, description],
      callback
    );
  }

  assignExerciseToUser(userName, exerciseType, score, date, keyword, callback) {
    this.db.run(
      `INSERT INTO user_exercises (user_id, exercise_id, score, date, keyword) 
                 VALUES ((SELECT id FROM users WHERE name = ?), 
                         (SELECT id FROM exercises WHERE type = ?), 
                         ?, ?, ?)`,
      [userName, exerciseType, score, date, keyword],
      callback
    );
  }

  getExercisesForUser(userName, callback) {
    this.db.all(
      `SELECT u.name, e.type, e.description, ue.score, ue.date, ue.keyword 
                 FROM user_exercises ue 
                 JOIN users u ON ue.user_id = u.id 
                 JOIN exercises e ON ue.exercise_id = e.id 
                 WHERE u.name = ?`,
      [userName],
      callback
    );
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
