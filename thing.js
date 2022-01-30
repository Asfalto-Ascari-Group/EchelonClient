const { BrowserWindow, app, ipcMain, dialog, Notification, autoUpdater } = require('electron');
const pth = require('path');

var win;
app.whenReady();

function createWindow() {
    win = new BrowserWindow({
        height: 870,
        width: 1080,
        title: `IntRevise`,
        resizable: true,
        frame: true,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    win.loadURL('<url>');

    win.webContents.on('did-finish-load', function() {
        win.show();
    });
};

app.whenReady().then(() => {
    createWindow();
    // If app has been activated but no windows were created (internal error), create window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        };
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    };
});