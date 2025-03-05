import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import { setupAutoUpdater } from "./autoUpdater";
import { ipcMain } from "electron";

log.transports.file.level = "debug"
autoUpdater.logger = log

const isDev = process.env.NODE_ENV === "development";

// Configure proper logging
log.transports.file.level = "info";

let mainWindow: BrowserWindow | null = null;

// Set app name
app.name = 'SW Office';

app.setAsDefaultProtocolClient('swoffice')

  // Create the Application's main menu
  const template = [
    {
      label: 'SW Office',
      submenu: [
        {
          label: 'About SW Office',
          click: () => {
            app.setAboutPanelOptions({
              applicationName: 'SW Office',
              applicationVersion: app.getVersion(),
              version: app.getVersion(),
              copyright: 'Copyright © 2024 Saibby Web',
              website: 'https://saibbyweb.com',
              iconPath: path.join(__dirname, '../../build/icons/icon.png'),
            });
            app.showAboutPanel();
          },
        },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);

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
    minWidth: 800,
    minHeight: 600,
    title: 'SW Office',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: '#ffffff',
    icon: path.join(__dirname, '../../build/icons', 
      process.platform === 'darwin' ? 'icon.icns' : 
      process.platform === 'win32' ? 'icon.ico' : 
      'icon.png'
    )
  });


  // and load the index.html of the app.

  // if (isDev) {
  //   mainWindow.loadURL("http://localhost:5173");
  //   // Open the DevTools.
    mainWindow.webContents.openDevTools();
    
  //   // Force set the window title in dev mode
  //   mainWindow.webContents.on('did-finish-load', () => {
  //     if (mainWindow) {
  //       mainWindow.setTitle('SW Office');
  //     }
  //   });
  // } else 
{
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.setTitle("SW Office");


  mainWindow.on('closed', () => {
    mainWindow = null;
  });

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
