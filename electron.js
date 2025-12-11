const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "VolleyTag Pro",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  if (!app.isPackaged) {
    // Development: Load from Vite Dev Server
    // Adding a small delay to ensure Vite is ready
    setTimeout(() => {
        win.loadURL('http://localhost:5173');
    }, 1000);
    // win.webContents.openDevTools(); 
  } else {
    // Production: Load from built files
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
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