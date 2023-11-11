const { ipcMain } = require("electron");
const db = require("./database"); // Make sure this path is correct

function setupIPC() {
  ipcMain.on("add-user", (event, arg) => {
    const userName = arg.name;
    db.addUser(userName, (err) => {
      if (err) {
        event.reply("add-user-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("add-user-response", { success: true });
      }
    });
  });

  ipcMain.on("add-exercise-score", (event, arg) => {
    const { userName, exerciseName, score, date } = arg;
    db.addExerciseScore(userName, exerciseName, score, date, (err) => {
      if (err) {
        event.reply("add-exercise-score-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("add-exercise-score-response", { success: true });
      }
    });
  });

  ipcMain.on("get-scores-for-user", (event, arg) => {
    const userName = arg.name;
    db.getScoresForUser(userName, (err, scores) => {
      if (err) {
        event.reply("get-scores-for-user-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("get-scores-for-user-response", { success: true, scores });
      }
    });
  });

  ipcMain.on("add-exercise-keywords", (event, arg) => {
    const { exerciseName, keywords } = arg;
    db.addExerciseKeywords(exerciseName, keywords, (err) => {
      if (err) {
        event.reply("add-exercise-keywords-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("add-exercise-keywords-response", { success: true });
      }
    });
  });

  ipcMain.handle("get-levels", async (event) => {
    return new Promise((resolve, reject) => {
      db.getAllLevels((err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => row.name));
        }
      });
    });
  });

  ipcMain.handle("get-topics-by-level", async (event, level) => {
    return new Promise((resolve, reject) => {
      db.getTopicsByLanguage(level, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows.map((row) => row.name));
        }
      });
    });
  });

  ipcMain.handle("get-exercises-by-topic", async (event, topic) => {
    return new Promise((resolve, reject) => {
      db.getExercisesByTopic(topic, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  });

  ipcMain.on("get-keywords-for-exercise", (event, arg) => {
    const exerciseName = arg.name;
    db.getKeywordsForExercise(exerciseName, (err, keywords) => {
      if (err) {
        event.reply("get-keywords-for-exercise-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("get-keywords-for-exercise-response", {
          success: true,
          keywords,
        });
      }
    });
  });
}

module.exports = setupIPC;
