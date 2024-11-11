const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // プリロードスクリプトを指定
      contextIsolation: true, // 安全なIPC通信のために有効にする
      enableRemoteModule: false,
    },
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });
  if (result.canceled) return;

  const folderPath = result.filePaths[0];
  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".mp3") || file.endsWith(".wav"))
    .map((file) => path.join(folderPath, file));

  return files;
});
