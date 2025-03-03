import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import fs from "fs";

log.transports.file.level = "debug"
autoUpdater.logger = log

const isDev = process.env.NODE_ENV === "development";

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

  if (isDev) {
    // For testing in development
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  }

  autoUpdater.checkForUpdatesAndNotify();
});

// Optional: Set up event listeners to handle update events
autoUpdater.on("update-available", () => {
  // Notify user that an update is available
  console.log("Update available");
});

autoUpdater.on("update-downloaded", () => {
  // Notify user that update is ready to install
  console.log("Update downloaded");
});

// Force refresh from the server by clearing the cache
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
  // Clear cache directory
  const cacheDir = path.join(app.getPath('userData'), 'update-cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmdirSync(cacheDir, { recursive: true });
      log.info('Update cache cleared');
    } catch (err) {
      log.error('Failed to clear update cache:', err);
    }
  }
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available:', info);
});

autoUpdater.on('error', (err) => {
  console.log('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log('Download progress:', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info);
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
