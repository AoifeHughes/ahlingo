const { app, BrowserWindow, session, ipcMain } = require("electron");
const isDev = process.env.NODE_ENV !== "production";
const path = require("path");
const LanguageDB = require("./src/database/languageDB");

// Create an instance of the database
const db = new LanguageDB();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    icon: path.join(__dirname, "assets/logo.icns"),
  });

  if (isDev) {
    win.loadURL("http://localhost:8080");
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}

// Set up IPC listeners
ipcMain.on("add-user", (event, arg) => {
  const userName = arg.name;

  db.addUser(userName, (err) => {
    if (err) {
      event.reply("add-user-response", { success: false, error: err.message });
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

// Add more IPC listeners for other functions in LanguageDB as needed.

app.on("ready", () => {
  createWindow();

  // Set up the webRequest to modify headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
      },
    });
  });
});

// It's a good practice to close the database connection when your Electron app is about to exit.
app.on("will-quit", () => {
  db.close();
});
