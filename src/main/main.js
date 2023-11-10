const { app, BrowserWindow, session } = require("electron");
const isDev = process.env.NODE_ENV !== "production";
const path = require("path");
const setupIPC = require("./ipcHandlers"); // Import the setup function for IPC

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

app.on("ready", () => {
  createWindow();
  setupIPC(); // Set up the IPC event handlers

  // Set up the webRequest to modify headers if necessary
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
      },
    });
  });
});

app.on("will-quit", () => {
  // Close the database connection if it's part of the db module
});
