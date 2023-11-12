const { ipcMain } = require("electron");
const LanguageDB = require('../database/languageDB');

function setupIPC() {
  const db = new LanguageDB();
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

// IPC Listener for fetching topics
ipcMain.on('get-topics', (event, languageName) => {
  db.getTopicsByLanguage(languageName, (err, topics) => {
    if (err) {
      console.error("Error fetching topics:", err);
      event.reply('get-topics-reply', { error: err.message });
      return;
    }
    event.reply('get-topics-reply', { topics });
  });
});


}

module.exports = setupIPC;
