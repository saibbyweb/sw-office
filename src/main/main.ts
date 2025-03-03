import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import log from 'electron-log';

const isDev = process.env.NODE_ENV === 'development';

// Configure proper logging
log.transports.file.level = 'info';

// Register IPC handlers only once
const registerIpcHandlers = () => {
  // Remove existing handler if it exists
  ipcMain.removeHandler('get-app-version');
  
  // Register new handler
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
};

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// Register handlers when app is ready
app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
});

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