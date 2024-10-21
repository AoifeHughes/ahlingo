const { ipcMain } = require("electron");
const LanguageDB = require("../database/LanguageDB");

function setupIPC() {
  const db = new LanguageDB(
    "./src/database/languageLearningDatabase.db",
    function (err) {
      if (err) {
        console.log("Failed to initialize database", err);
      } else {
        console.log("Database initialized successfully");
      }
    },
  );

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

  ipcMain.on("get-languages", (event, arg) => {
    db.getLanguages((err, languages) => {
      if (err) {
        event.reply("get-languages-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("get-languages-response", { success: true, languages });
      }
    });
  });

  ipcMain.on("get-difficulty-by-language", (event, arg) => {
    db.getDifficultyByLanguage(arg.language, (err, difficulty) => {
      if (err) {
        event.reply("get-difficulty-by-language-response", {
          success: false,
          error: err.message,
        });
      } else {
        event.reply("get-difficulty-by-language-response", {
          success: true,
          difficulty,
        });
      }
    });
  });

  ipcMain.on("get-topics-by-language-difficulty", (event, arg) => {
    db.getTopicsByLanguageDifficulty(
      arg.language,
      arg.difficulty,
      (err, topics) => {
        if (err) {
          event.reply("get-topics-by-language-difficulty-response", {
            success: false,
            error: err.message,
          });
        } else {
          event.reply("get-topics-by-language-difficulty-response", {
            success: true,
            topics,
          });
        }
      },
    );
  });

  ipcMain.on("get-random-pair-exercise", (event, arg) => {
    db.getRandomPairExercise(
      arg.language,
      arg.difficulty,
      arg.topic,
      (err, exercise) => {
        if (err) {
          event.reply("get-random-pair-exercise-response", {
            success: false,
            error: err.message,
          });
        } else {
          event.reply("get-random-pair-exercise-response", {
            success: true,
            exercise,
          });
        }
      },
    );
  });
}

module.exports = setupIPC;
