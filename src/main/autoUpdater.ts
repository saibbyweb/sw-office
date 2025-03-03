import { app, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import path from "path";
import fs from "fs";
import { ipcMain } from "electron";

const clearUpdateCache = () => {
  let success = true;
  
  // Clear update-cache directory
  const cacheDir = path.join(app.getPath('userData'), 'update-cache');
  if (fs.existsSync(cacheDir)) {
    try {
      fs.rmdirSync(cacheDir, { recursive: true });
      log.info('Update cache cleared');
    } catch (err) {
      log.error('Failed to clear update cache:', err);
      success = false;
    }
  }

  // Clear pending downloads
  const pendingDir = path.join(app.getPath('home'), 'Library/Caches/electron-react-app/pending');
  if (fs.existsSync(pendingDir)) {
    try {
      fs.rmdirSync(pendingDir, { recursive: true });
      log.info('Pending updates cleared');
    } catch (err) {
      log.error('Failed to clear pending updates:', err);
      success = false;
    }
  }

  return success;
};

export const setupAutoUpdater = (isDev: boolean, mainWindow: BrowserWindow) => {
  // Remove existing handlers first
  ipcMain.removeHandler('clear-updates');
  
  // Prevent auto downloading of updates
  autoUpdater.autoDownload = false;

  if (isDev) {
    // For testing in development
    autoUpdater.forceDevUpdateConfig = true;
    autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  }

  // Force refresh from the server by clearing the cache
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    clearUpdateCache();
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available:', info);
  });

  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater:', err);
    mainWindow.webContents.send('update-error', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj);
    mainWindow.webContents.send('download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow.webContents.send('update-downloaded', info);
  });

  // Initialize auto updates - only check for updates, don't download
  autoUpdater.checkForUpdates();

  // Handle IPC events from renderer
  // Remove existing listeners before adding new ones
  ipcMain.removeAllListeners('start-download');
  ipcMain.removeAllListeners('restart-app');

  ipcMain.on('start-download', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.handle('clear-updates', () => {
    const success = clearUpdateCache();
    if (success) {
      autoUpdater.checkForUpdates();
    }
    return success;
  });

  // Add periodic update check (every hour)
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 60 * 60 * 1000);
}; 