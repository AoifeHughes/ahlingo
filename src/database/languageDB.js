const sqlite3 = require("sqlite3").verbose();
const path = require("path");

class LanguageDB {
  constructor(dbPath = "./src/database/languageLearningDatabase.db", callback) {
    this.db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Connection error", err.message);
          return;
        }
        this._initialize(callback);
      }
    );
  }

  _initialize(callback) {
    this.db.serialize(() => {
      const tableCreationQueries = [
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS difficulties (
          id INTEGER PRIMARY KEY,
          difficulty_level TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS languages (
          id INTEGER PRIMARY KEY,
          language TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS topics (
          id INTEGER PRIMARY KEY,
          topic TEXT NOT NULL UNIQUE
        )`,
        `CREATE TABLE IF NOT EXISTS exercises_info (
          id INTEGER PRIMARY KEY,
          exercise_name TEXT NOT NULL UNIQUE,
          topic_id INTEGER NOT NULL,
          difficulty_id INTEGER NOT NULL,
          language_id INTEGER NOT NULL,
          FOREIGN KEY (topic_id) REFERENCES topics (id),
          FOREIGN KEY (difficulty_id) REFERENCES difficulties (id),
          FOREIGN KEY (language_id) REFERENCES languages (id)
        )`,
        `CREATE TABLE IF NOT EXISTS pair_exercises (
          id INTEGER PRIMARY KEY,
          exercise_id INTEGER NOT NULL,
          language_1 TEXT NOT NULL,
          language_2 TEXT NOT NULL,
          language_1_content TEXT NOT NULL,
          language_2_content TEXT NOT NULL,
          FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
        )`,
        `CREATE TABLE IF NOT EXISTS conversation_exercises (
          id INTEGER PRIMARY KEY,
          exercise_id INTEGER NOT NULL,
          conversation_order INTEGER,
          speaker TEXT NOT NULL,
          message TEXT NOT NULL,
          FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
        )`,
        `CREATE TABLE IF NOT EXISTS conversation_summaries (
          id INTEGER PRIMARY KEY,
          exercise_id INTEGER NOT NULL,
          summary TEXT NOT NULL,
          FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
        )`,
        `CREATE TABLE IF NOT EXISTS translation_exercises (
          id INTEGER PRIMARY KEY,
          exercise_id INTEGER NOT NULL,
          language_1 TEXT NOT NULL,
          language_2 TEXT NOT NULL,
          language_1_content TEXT NOT NULL,
          language_2_content TEXT NOT NULL,
          FOREIGN KEY (exercise_id) REFERENCES exercises_info (id)
        )`,
      ];

      tableCreationQueries.forEach((query, index) => {
        this.db.run(query, (err) => {
          if (err) {
            console.error("Error creating table:", err.message);
          }
          if (index === tableCreationQueries.length - 1) {
            // Call the callback after the last query completes
            callback();
          }
        });
      });
    });
  }

  _getOrCreateTopic(topic, callback) {
    const queryFind = `SELECT id FROM topics WHERE topic = ?`;
    const queryInsert = `INSERT INTO topics (topic) VALUES (?)`;
    this.db.get(queryFind, [topic], (err, row) => {
      if (err) {
        return callback(err);
      } else if (row) {
        return callback(null, row.id);
      } else {
        this.db.run(queryInsert, [topic], function (err) {
          callback(err, this.lastID);
        });
      }
    });
  }

  _getOrCreateLanguage(language, callback) {
    const queryFind = `SELECT id FROM languages WHERE language = ?`;
    const queryInsert = `INSERT INTO languages (language) VALUES (?)`;
    this.db.get(queryFind, [language], (err, row) => {
      if (err) {
        return callback(err);
      } else if (row) {
        return callback(null, row.id);
      } else {
        this.db.run(queryInsert, [language], function (err) {
          callback(err, this.lastID);
        });
      }
    });
  }

  // Utility function to get or create a difficulty and return its ID
  _getOrCreateDifficulty(difficultyLevel, callback) {
    const queryFind = `SELECT id FROM difficulties WHERE difficulty_level = ?`;
    const queryInsert = `INSERT INTO difficulties (difficulty_level) VALUES (?)`;
    this.db.get(queryFind, [difficultyLevel], (err, row) => {
      if (err) {
        return callback(err);
      } else if (row) {
        return callback(null, row.id);
      } else {
        this.db.run(queryInsert, [difficultyLevel], function (err) {
          callback(err, this.lastID);
        });
      }
    });
  }

  addConversationExercise(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    conversations,
    summary,
    callback
  ) {
    // Capture a reference to the db property of LanguageDB instance
    const db = this.db;

    db.serialize(() => {
      this._getOrCreateLanguage(language, (err, languageId) => {
        if (err) return callback(err);
        this._getOrCreateTopic(topic, (err, topicId) => {
          if (err) return callback(err);
          this._getOrCreateDifficulty(difficultyLevel, (err, difficultyId) => {
            if (err) return callback(err);

            const queryInsertExercise = `INSERT INTO exercises_info (exercise_name, language_id, topic_id, difficulty_id) VALUES (?, ?, ?, ?)`;
            // Here we are inside the serialize() call, and 'this' refers correctly to the LanguageDB instance,
            // but 'db' is used to ensure it's the same reference inside callbacks.
            db.run(
              queryInsertExercise,
              [exerciseName, languageId, topicId, difficultyId],
              function (err) {
                if (err) return callback(err);
                // The context here ('this') refers to the callback function's scope, not LanguageDB,
                // but we don't need 'this' here anymore since we're using 'db'.
                const exerciseId = this.lastID;

                const insertConversationQuery = `INSERT INTO conversation_exercises (exercise_id, conversation_order, speaker, message) VALUES (?, ?, ?, ?)`;

                conversations.forEach((conv, index) => {
                  db.run(
                    insertConversationQuery,
                    [exerciseId, index, conv.speaker, conv.message],
                    (err) => {
                      if (err) return callback(err);
                      // Callback after the last conversation is inserted to ensure all operations are complete
                      if (index === conversations.length - 1) {
                        const insertSummaryQuery = `INSERT INTO conversation_summaries (exercise_id, summary) VALUES (?, ?)`;
                        db.run(
                          insertSummaryQuery,
                          [exerciseId, summary],
                          (err) => {
                            // Only callback with the exercise ID after all inserts are done
                            callback(err, exerciseId);
                          }
                        );
                      }
                    }
                  );
                });
              }
            );
          });
        });
      });
    });
  }

  addConversationExerciseFromJSON(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    jsonInput,
    callback
  ) {
    const conversations = jsonInput.conversation;
    const summary = jsonInput.conversation_summary;

    this.addConversationExercise(
      exerciseName,
      language,
      topic,
      difficultyLevel,
      conversations,
      summary,
      callback
    );
  }

  addPairExercise(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    language1,
    language2,
    language1Content,
    language2Content,
    callback
  ) {
    const db = this.db; // Capture a reference to the db property of LanguageDB instance
    // log all the params
    console.log(
      `Adding pair exercise: ${exerciseName}, ${language}, ${topic}, ${difficultyLevel}, ${language1}, ${language2}, ${language1Content}, ${language2Content}`
    );
    db.serialize(() => {
      this._getOrCreateLanguage(language, (err, languageId) => {
        if (err) return callback(err);
        this._getOrCreateTopic(topic, (err, topicId) => {
          if (err) return callback(err);
          this._getOrCreateDifficulty(difficultyLevel, (err, difficultyId) => {
            if (err) return callback(err);

            const queryInsertExercise = `INSERT INTO exercises_info (exercise_name, language_id, topic_id, difficulty_id) VALUES (?, ?, ?, ?)`;
            db.run(
              queryInsertExercise,
              [exerciseName, languageId, topicId, difficultyId],
              function (err) {
                if (err) return callback(err);
                const exerciseId = this.lastID;

                const insertPairQuery = `INSERT INTO pair_exercises (exercise_id, language_1, language_2, language_1_content, language_2_content) VALUES (?, ?, ?, ?, ?)`;
                db.run(
                  insertPairQuery,
                  [
                    exerciseId,
                    language1,
                    language2,
                    language1Content,
                    language2Content,
                  ],
                  (err) => {
                    callback(err, exerciseId);
                  }
                );
              }
            );
          });
        });
      });
    });
  }

  addPairExerciseFromJSON(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    jsonInput,
    callback
  ) {
    const language_1 = "English";
    const language_2 = language;
    const language_1_content = jsonInput[language_1];
    const language_2_content = jsonInput[language_2];

    this.addPairExercise(
      exerciseName,
      language,
      topic,
      difficultyLevel,
      language_1,
      language_2,
      language_1_content,
      language_2_content,
      callback
    );
  }

  addTranslationExercise(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    language1,
    language2,
    language1Content,
    language2Content,
    callback
  ) {
    const db = this.db; // Capture a reference to the db property of LanguageDB instance

    db.serialize(() => {
      this._getOrCreateLanguage(language, (err, languageId) => {
        if (err) return callback(err);
        this._getOrCreateTopic(topic, (err, topicId) => {
          if (err) return callback(err);
          this._getOrCreateDifficulty(difficultyLevel, (err, difficultyId) => {
            if (err) return callback(err);

            const queryInsertExercise = `INSERT INTO exercises_info (exercise_name, language_id, topic_id, difficulty_id) VALUES (?, ?, ?, ?)`;
            db.run(
              queryInsertExercise,
              [exerciseName, languageId, topicId, difficultyId],
              function (err) {
                if (err) return callback(err);
                const exerciseId = this.lastID;

                const insertTranslationQuery = `INSERT INTO translation_exercises (exercise_id, language_1, language_2, language_1_content, language_2_content) VALUES (?, ?, ?, ?, ?)`;
                db.run(
                  insertTranslationQuery,
                  [
                    exerciseId,
                    language1,
                    language2,
                    language1Content,
                    language2Content,
                  ],
                  (err) => {
                    callback(err, exerciseId);
                  }
                );
              }
            );
          });
        });
      });
    });
  }

  addTranslationExerciseFromJSON(
    exerciseName,
    language,
    topic,
    difficultyLevel,
    jsonInput,
    callback
  ) {
    const language_1 = "English";
    const language_2 = language;
    const language_1_content = jsonInput[language_1];
    const language_2_content = jsonInput[language_2];

    this.addTranslationExercise(
      exerciseName,
      language,
      topic,
      difficultyLevel,
      language_1,
      language_2,
      language_1_content,
      language_2_content,
      callback
    );
  }

  addUser(userName, callback) {
    const query = `INSERT INTO users (name) VALUES (?)`;
    this.db.run(query, [userName], function (err) {
      callback(err);
    });
  }

  getDifficultyLevels(callback) {
    const query = `SELECT difficulty_level FROM difficulties`;
    this.db.all(query, [], (err, rows) => {
      if (err) {
        return callback(err);
      }
      const levels = rows.map((row) => row.difficulty_level);
      callback(null, levels);
    });
  }

  getTopicsByDifficulty(difficultyLevel, callback) {
    const query = `SELECT topic FROM topics WHERE id IN (SELECT topic_id FROM exercises_info WHERE difficulty_id = (SELECT id FROM difficulties WHERE difficulty_level = ?))`;
    this.db.all(query, [difficultyLevel], (err, rows) => {
      if (err) {
        return callback(err);
      }
      const topics = rows.map((row) => row.topic);
      callback(null, topics);
    });
  }

  getLanguagesByTopicAndDifficulty(topic, difficultyLevel, callback) {
    const query = `SELECT language FROM languages WHERE id IN (SELECT language_id FROM exercises_info WHERE topic_id = (SELECT id FROM topics WHERE topic = ?) AND difficulty_id = (SELECT id FROM difficulties WHERE difficulty_level = ?))`;
    this.db.all(query, [topic, difficultyLevel], (err, rows) => {
      if (err) {
        return callback(err);
      }
      const languages = rows.map((row) => row.language);
      callback(null, languages);
    });
  }

  getTopicsByLanguage(languageName, callback) {
    const query = `SELECT topic FROM topics WHERE id IN (SELECT topic_id FROM exercises_info WHERE language_id = (SELECT id FROM languages WHERE language = ?))`;
    this.db.all(query, [languageName], (err, rows) => {
      if (err) {
        return callback(err);
      }
      const topics = rows.map((row) => row.topic);
      callback(null, topics);
    });
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
