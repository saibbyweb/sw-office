import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import { setupAutoUpdater } from "./autoUpdater";

log.transports.file.level = "debug"
autoUpdater.logger = log

const isDev = process.env.NODE_ENV !== "development";

// Configure proper logging
log.transports.file.level = "info";

let mainWindow: BrowserWindow | null = null;

// Register IPC handlers only once
const registerIpcHandlers = () => {
  // Remove existing handler if it exists
  ipcMain.removeHandler("get-app-version");

  // Register new handler
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // and load the index.html of the app.
  if (process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  // Setup auto updater after window is created
  setupAutoUpdater(isDev, mainWindow);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
