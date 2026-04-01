const { app, BrowserWindow } = require("electron");
const path = require("path");
const START_URL = "https://ii1123.github.io/our-app/";

function createWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 1100,
    minHeight: 760,
    backgroundColor: "#fff8f4",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "favicon.ico"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  window.loadURL(START_URL);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
