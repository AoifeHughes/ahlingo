const { ipcMain } = require("electron");
const LanguageDB = require('../database/LanguageDB');

function setupIPC() {
  const db = new LanguageDB("../database/languageLearningDatabase.db", function(err) {
    if (err) {
      console.log("Failed to initialize database", err);
    } else {
      console.log("Database initialized successfully");
    }
  });
  
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

  ipcMain.on('get-difficulty-levels', (event) => {
    db.getDifficultyLevels((err, levels) => {
      if (err) {
        console.error("Error fetching difficulty levels:", err);
        event.reply('get-difficulty-levels-reply', { error: err.message });
        return;
      }
      event.reply('get-difficulty-levels-reply', { levels });
    });
  });

  ipcMain.on('get-topics-by-difficulty', (event, difficultyLevel) => {
    db.getTopicsByDifficulty(difficultyLevel, (err, topics) => {
      if (err) {
        console.error("Error fetching topics:", err);
        event.reply('get-topics-reply', { error: err.message });
        return;
      }
      event.reply('get-topics-reply', { topics });
    });
  });

  ipcMain.on('get-languages', (event, { topic, difficultyLevel }) => {
    db.getLanguagesByTopicAndDifficulty(topic, difficultyLevel, (err, languages) => {
      if (err) {
        console.error("Error fetching languages:", err);
        event.reply('get-languages-reply', { error: err.message });
        return;
      }
      event.reply('get-languages-reply', { languages });
    });
  });

// IPC Listener for fetching topics
ipcMain.on('get-topics', (event, languageName) => {
  db.getTopicsByLanguage(languageName, (err, topics) => {
    if (err) {
      console.error("Error fetching topics:", err);
      event.reply('get-topics-reply', { error: err.message });
      return;
    }
    console.log("Sending topics:", topics);
    event.reply('get-topics-reply', { topics });
  });
});


}

module.exports = setupIPC;
