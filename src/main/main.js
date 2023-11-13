const { app, BrowserWindow, ipcMain, session } = require("electron");
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
      enableRemoteModule: true,
    },  
    icon: path.join(__dirname, "assets/logo.icns"),
  });
  win.webContents.openDevTools();

  if (isDev) {
    win.loadURL("http://localhost:8080");
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }
}


app.on("ready", () => {
  console.log("App is ready");
  createWindow();
  console.log("Window created");
  setupIPC(); // Set up the IPC event handlers if needed
  console.log("IPC handlers set up");
  
  // Set up the webRequest to modify headers if necessary
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Access-Control-Allow-Origin": ["*"],
      },
    });
  });
  console.log("Web request handler set up");
});

app.on("will-quit", () => {
  db.close(); // Close the database connection when the app is about to quit
});
