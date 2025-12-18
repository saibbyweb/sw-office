import { app, BrowserWindow, IpcMainInvokeEvent, Menu, shell } from "electron";
import path from "path";
import log from "electron-log";
import { autoUpdater } from "electron-updater";
import { setupAutoUpdater } from "./autoUpdater";
import { ipcMain } from "electron";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

log.transports.file.level = "debug";
autoUpdater.logger = log;

const isDev = process.env.NODE_ENV === "development";

// Configure proper logging
log.transports.file.level = "info";

let mainWindow: BrowserWindow | null = null;

// Set app name
app.name = "SW Office";

app.setAsDefaultProtocolClient("swoffice");

// Create the Application's main menu
const template = [
  {
    label: "SW Office",
    submenu: [
      {
        label: "About SW Office",
        click: () => {
          app.setAboutPanelOptions({
            applicationName: "SW Office",
            applicationVersion: app.getVersion(),
            version: app.getVersion(),
            copyright: "Copyright © 2024 Saibby Web",
            website: "https://saibbyweb.com",
            iconPath: path.join(__dirname, "../../build/icons/icon.png"),
          });
          app.showAboutPanel();
        },
      },
      { type: "separator" },
      { role: "services" },
      { type: "separator" },
      { role: "hide" },
      { role: "hideOthers" },
      { role: "unhide" },
      { type: "separator" },
      { role: "quit" },
    ],
  },
  { role: "editMenu" },
  { role: "viewMenu" },
  { role: "windowMenu" },
];

const menu = Menu.buildFromTemplate(template as any);
Menu.setApplicationMenu(menu);

// Register IPC handlers only once
const registerIpcHandlers = () => {
  // Remove existing handler if it exists
  ipcMain.removeHandler("get-app-version");
  ipcMain.removeHandler("open-external-link");
  ipcMain.removeHandler("get-audio-path");
  ipcMain.removeHandler("authenticate-system");

  // Register new handler
  ipcMain.handle("get-app-version", () => {
    return app.getVersion();
  });

  ipcMain.on("open-external-link", (event: IpcMainInvokeEvent, url: string) => {
    shell.openExternal(url);
  });

  // Add window focus handler
  ipcMain.on("focus-window", () => {
    if (mainWindow) {
      // Show the window if it's hidden
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      // Bring window to front and focus it
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Add dock bounce handler
  ipcMain.on("bounce-dock", () => {
    if (process.platform === "darwin") {
      app.dock.bounce("critical");
    }
  });

  // Add audio path handler
  ipcMain.handle("get-audio-path", () => {
    if (isDev) {
      return "assets/ring.mp3";
    } else {
      // In production, use the path relative to the app's resources
      return path.join(process.resourcesPath, "app", "public", "assets", "ring.mp3");
    }
  });

  // Add system authentication handler
  ipcMain.handle("authenticate-system", async () => {
    try {
      if (process.platform === "darwin") {
        // On macOS, use osascript with administrator privileges
        // This will prompt for the user's system password
        const script = `osascript -e 'do shell script "echo authenticated" with prompt "SW Office requires authentication to view payout details." with administrator privileges'`;
        await execAsync(script);
        return { success: true };
      } else if (process.platform === "win32") {
        // On Windows, use PowerShell to prompt for credentials
        const script = `powershell -Command "Start-Process powershell -Verb RunAs -ArgumentList '-Command', 'exit' -WindowStyle Hidden"`;
        await execAsync(script);
        return { success: true };
      } else {
        // On Linux, use pkexec for authentication
        const script = `pkexec echo "authenticated"`;
        await execAsync(script);
        return { success: true };
      }
    } catch (error) {
      log.error("Authentication failed:", error);
      return { success: false, error: (error as Error).message };
    }
  });
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "SW Office",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      // webSecurity: true,
      enableWebSQL: false,
      webgl: true,
      sandbox: false,
    },
    backgroundColor: "#ffffff",
    icon: path.join(__dirname, "../../build/icons", process.platform === "darwin" ? "icon.icns" : process.platform === "win32" ? "icon.ico" : "icon.png"),
  });

  // and load the index.html of the app.

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.setTitle("SW Office");

  mainWindow.on("closed", () => {
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
