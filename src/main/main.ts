import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { autoUpdater } from 'electron-updater';

import log from 'electron-log';

const isDev = process.env.NODE_ENV === 'development';

// Configure proper logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Enable auto-updater
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // Add IPC handler for app version
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
  
  // Auto updater events
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for updates...');
    win.webContents.send('update_checking');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    win.webContents.send('update_available');
  });

  autoUpdater.on('update-not-available', () => {
    log.info('Update not available');
    win.webContents.send('update_not_available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    log.info('Download progress:', progressObj);
    win.webContents.send('update_progress', progressObj);
  });

  autoUpdater.on('update-downloaded', () => {
    log.info('Update downloaded');
    win.webContents.send('update_downloaded');
    // Install update after 5 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 5000);
  });

  // Check for updates if not in development
  if (!isDev) {
    // Initial check for updates
    setTimeout(() => {
      log.info('Checking for updates on startup...');
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000); // Check after 3 seconds to allow app to initialize

    // Check for updates every hour
    setInterval(() => {
      log.info('Checking for updates (hourly)...');
      autoUpdater.checkForUpdatesAndNotify();
    }, 60 * 60 * 1000);
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
}); 