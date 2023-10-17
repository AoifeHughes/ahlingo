const { app, BrowserWindow } = require("electron");
const isDev = process.env.NODE_ENV !== "production";
const path = require("path");

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

app.on("ready", createWindow);
