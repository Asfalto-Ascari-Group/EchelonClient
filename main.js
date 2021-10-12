const { BrowserWindow, app, ipcMain, autoUpdater, dialog, Notification } = require('electron');
const { io } = require('socket.io-client');
const fs = require('fs');
const { getGamePath } = require('steam-game-path');
const unzipper = require('unzipper');
const http = require('http');
const pth = require('path');
const { time } = require('console');
const path = require('path');
const async = require('async');

require('dotenv').config();

// Configure electron autoUpdater
// require('update-electron-app')({
//     repo: 'https://github.com/Asfalto-Ascari-Group/EchelonClient-Release-Stable',
//     updateInterval: '5 minutes',
//     logger: require('electron-log')
// });

// autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
//     const dialogOpts = {
//         type: 'info',
//         buttons: ['Restart', 'Later'],
//         title: 'Application Update',
//         message: process.platform === 'win32' ? releaseNotes : releaseName,
//         detail: 'A new version has been downloaded. Restart the application to apply the updates.'
//     };

//     dialog.showMessageBox(dialogOpts).then((returnValue) => {
//         if (returnValue.response === 0) autoUpdater.quitAndInstall();
//     });
// });

// autoUpdater.on('error', msg => {
//     console.error('There was a problem updating the application');
//     console.error(msg);
// });

// autoUpdater.on('checking-for-update', () => {
//     win.webContents.send('log', 'hit');
// });

// Define variable connection
const socket = io(`http://35.223.123.5:4644`, {
    reconnection: true,
    pingTimeout: 1000,
    pingInterval: 1000,
    reconnectionDelayMax: 1000
});
// Above connection is the socket.io server
// During the request phase, the server will send back a socket that leads to the file server to download content

// Global variables
var log = console.log.bind(console);
var isPathFound = false;
var gameInstallDir;
var documentsDir;
var isWindowOn = false;
var notisChoice = false;
var canHashMapBeFormatted = false;
const modulesArr = ['flSpec', 'gtSpec', 'cSpec'];
var isServerConnected = false;
var completedModulesArr = [];
var chosenModules = [];
var isDownloadStopped = new Boolean();
isDownloadStopped = false;
var moduleCount = 0;
var filesToDownload = [];
var isDownloadQueueOpen = true;
var globalFilesCount = 0;
var percentTerm = 0;
var counter = 0;
var totalPercent = 0;

// Configure window options
var win;
app.whenReady();

function createWindow() {
    win = new BrowserWindow({
        height: 870,
        width: 1080,
        title: `Project Echelon @${process.env.VERSION}`,
        icon: '.\\root\\src\\images\\thumb.png',
        resizable: false,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    win.loadFile('root/index.html');
};

// When app is ready, create window
app.whenReady().then(() => {
    createWindow();
    // If app has been activated but no windows were created (internal error), create window
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        };
    });
});

// If all windows in this context are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    };
});

// On window load
ipcMain.on('windowLoad', (event, arr) => {

    // Get game path
    var data = getGamePath(244210);
    isWindowOn = true;

    // Client (windows) notification choice
    notisChoice = arr.notis;

    // If game path is NOT found
    if (!data.game) {
        win.webContents.send('gamePathStatus', {
            code: 404,
            msg: 'Game installation path not found'
        });
        isPathFound = false;
    }

    // If game path is found
    else if (data.game.path) {
        gameInstallDir = data.game.path;
        win.webContents.send('gamePathStatus', {
            msg: gameInstallDir
        });
        isPathFound = true;

        // // Configure documents path
        // var baseuid = os.homedir().split('\\')[2];
        // if (fs.readdirSync(`${data.game.path[0]}:/Users/${baseuid}/`)) {
        //     if (fs.readdirSync(`${data.game.path[0]}:/Users/${baseuid}/Documents/assettocorsa`)) {

        //         // 'assettocorsa' exists in documents folder
        //         documentsDirUser = `${data.game.path[0]}:/Users/${baseuid}/Documents/assettocorsa`;
        //         documentsDir = documentsDirUser;
        //         win.webContents.send('documentPathStatus', {msg: documentsDir});
        //     };
        // }
        // else if (!fs.readdirSync(`${data.game.path[0]}:/Users/${baseuid}/`)) {
        //     win.webContents.send('notification', {title: 'Cannot Find Documents Path', content: 'Please choose a documents path for "assettocorsa"', type: 'bad', ms: 10000});
        // }
        // else if (!fs.readdirSync(`${data.game.path[0]}:/Users/${baseuid}/Documents/assettocorsa`)) {
        //     win.webContents.send('notification', {title: 'Cannot Find Documents Path', content: 'Please choose a documents path for "assettocorsa"', type: 'bad', ms: 10000});
        // };

    };

    // If server is connected
    // if (isServerConnected) {
    //     win.webContents.send('serverState', isServerConnected);

    //     win.webContents.send('notification', {
    //         title: 'Echelon Connected',
    //         content: `Echelon successfully connected to the server`,
    //         type: 'good',
    //         ms: 6000
    //     });
        
    // } else if (!isServerConnected) {
    //     win.webContents.send('serverState', isServerConnected);

    //     win.webContents.send('notification', {
    //         title: 'Echelon Lost Connection',
    //         content: `Awaiting server reconnection...`,
    //         type: 'bad',
    //         ms: 0
    //     });

    // };

});

// User chooses their steam game path
ipcMain.on('gamePathMount', () => {

    // Give user choice to browse for assettocorsa directory
    gameInstallDirUser = dialog.showOpenDialogSync(win, {
        title: 'Choose "assettocorsa" file path',
        properties: ['openDirectory'],
        defaultPath: `${gameInstallDir}`
    });

    // Check chosen game path
    if (gameInstallDirUser == undefined || gameInstallDirUser == 'undefined' || gameInstallDirUser == '') {
        // null -- undefined, dialog closed out
        if (!gameInstallDir) {
            win.webContents.send('gamePathStatus', {
                msg: gameInstallDir
            });
            win.webContents.send('notification', {
                title: 'Invalid Installation Path',
                content: `Please enter a steam installation path`,
                type: 'bad',
                ms: 10000
            });
        };

    } else if (!gameInstallDirUser[0].includes('assettocorsa')) {
        // false
        win.webContents.send('gamePathStatus', {
            msg: gameInstallDir
        });
        win.webContents.send('notification', {
            title: 'Invalid Installation Path',
            content: `Please enter a steam installation path that contains the 'assettocorsa' directory`,
            type: 'bad',
            ms: 10000
        });
    } else if (gameInstallDirUser[0].includes('assettocorsa')) {
        if (!gameInstallDirUser[0].includes('Documents')) {

            let checkForSub = gameInstallDirUser[0].split('assettocorsa');
            if (checkForSub[1]) {
                gameInstallDir = `${checkForSub[0]}assettocorsa`;
                win.webContents.send('gamePathStatus', {
                    msg: gameInstallDir
                });
            } else if (!checkForSub[1]) {
                // true
                win.webContents.send('gamePathStatus', {
                    msg: gameInstallDirUser
                });
                gameInstallDir = gameInstallDirUser;
            };
        } else if (!gameInstallDirUser[0].includes('Documents')) {
            win.webContents.send('notification', {
                title: 'Invalid Installation Path',
                content: `Please enter a steam installation path that contains the 'assettocors' directory`,
                type: 'bad',
                ms: 10000
            });
        };
    };
});

// User chooses their documents game path
// ipcMain.on('documentsPathMount', () => {

//     // Open dialog box
//     documentsDirUser = dialog.showOpenDialogSync(win, {
//         title: 'Choose "assettocorsa" file path',
//         properties: ['openDirectory']
//     });

//     // Check chosen path
//     if (documentsDirUser == undefined || documentsDirUser == 'undefined' || documentsDirUser == '') {
//         // null, error, dialog closed out
//         win.webContents.send('notification', {title: 'Invalid Documents Path', content: 'Please choose a valid documents path for "assettocorsa"', type: 'bad', ms: 10000});
//     }
//     else if (documentsDirUser[0].includes('Documents') == false) {
//         // Path does not contain the 'Documents' query
//         win.webContents.send('notification', {title: 'Invalid Documents Path', content: 'Please choose a valid documents path for "assettocorsa"', type: 'bad', ms: 10000});
//     }
//     else if (documentsDirUser[0].includes('assettocorsa') == false) {
//         // Path does not contain the 'assettocorsa' query
//         win.webContents.send('notification', {title: 'Invalid Documents Path', content: 'Please choose a valid documents path for "assettocorsa"', type: 'bad', ms: 10000});
//     }
//     else if (documentsDirUser[0].includes('Documents') && documentsDirUser[0].includes('assettocorsa')) {
//         // Correct path has been chosen
//         win.webContents.send('documentPathStatus', {msg: documentsDirUser});
//         documentsDir = documentsDirUser;
//     };
// });

// Fired when the notification bool value has been changed on the renderer
ipcMain.on('notisChange', async (event, bool) => {
    // Request boolean value for notifications from appStorage
    notisChoice = bool;
});

// Listen for series change on the renderer and store array
ipcMain.on('racingSeries', (event, arr) => {

    if (arr.value == true) {
        if (!chosenModules.filter(e => e === arr.type).length > 0) {
            chosenModules.push(arr.type);
        };
    } else if (arr.value == false) {
        if (chosenModules.filter(e => e == arr.type).length > 0) {
            removeItemOnce(chosenModules, arr.type);
        };
    };
});

// Remove item from 2D array only
const removeItemOnce = (arr, value) => {
    var index = arr.indexOf(value);
    if (index > -1) {
        arr.splice(index, 1);
    };
    return arr;
};

// dev
ipcMain.on('cout', (event, arr) => {
    log(arr);
});

// Request files from server in json format
ipcMain.on('getCurrent', (event, arr) => {
    socket.emit('getCurrent', {
        modules: chosenModules
    });
    win.webContents.send('btnReact', 'go');
    notisChoice = arr.notis;
});

// Watch for button events
ipcMain.on('syncButton', (event, foo) => {

    if (foo == 'start') {
        win.webContents.send('buttonStart');
    } else if (foo == 'stop') {
        const options = {
            buttons: ['Cancel', 'Yes, please', 'No, thanks'],
            defaultId: 2,
            title: 'Stop Download?',
            message: 'Do you want to stop the download?',
            detail: 'As of Echelon_BETA, Stopping a download may not work properly.'
        };

        dialog.showMessageBox(options)
            .then(result => {
                if (result.response == 1) {
                    win.webContents.send('buttonStop');
                    isDownloadStopped = true;
                };
            });
    };
});

const preDownloadConf = () => {

    // Check if download is stopped
    if (!isDownloadStopped) {

        // Send complete state for client UI
        win.webContents.send('btnReact', 'finish');
        win.webContents.send('downloadDone', 'Finished!');

        // Check for notification boolean
        if (notisChoice == 'true') {
            const notification = new Notification({
                title: `Echelon has Finished Syncing`,
                body: 'Your Assetto Corsa content is synchronised'
            }).show();
        };
    };
};

const pushFileToQueue = (file) => {

    // Push file to queue
    filesToDownload.push(file);

    // Check if queue is in use
    if (isDownloadQueueOpen) {
        downloadFile(file);
    };

};

const downloadFile = (file) => {

    // Block download queue
    isDownloadQueueOpen = false;
    log(file)

    // Download file
    var req = http.get(file.urlpath, (res) => {

        res.pipe(
            unzipper.Extract({
                path: `${gameInstallDir}/content/${file.type}`
            })
        );

        // Unzip finish (unknown)
        res.on('end', () => {
            log('end');
            counter++;
            totalPercent += percentTerm;
            win.webContents.send('downloadProgress', Math.trunc(totalPercent));
            filesToDownload.shift();
            isDownloadQueueOpen = true;
            if (counter != globalFilesCount) {
                downloadFile(filesToDownload[0]);
            };
        });

    });
    
    // Initial file download
    req.on('response', () => {
        log('response');
        if (counter != filesToDownload.length) {
            win.webContents.send('currentInstallPath', `${gameInstallDir}/${file.filename}`);
        };
    });

    // Destroy request when file is completley done
    req.on('close', () => {
        req.end();
        req.destroy();
    });

};

// Start download socket response from server
socket.on('currentServerResponse', (arr) => {

    // Download each file seperatley
    for (let i=0; i<arr.response.length; i++) {
        pushFileToQueue(arr.response[i]);
        globalFilesCount++;
        percentTerm = 100 / globalFilesCount;
    };
    
    // Do confs after download has done
    if (counter == filesToDownload.length) {
        preDownloadConf();
        win.webContents.send('downloadDone', 'Finished!');
    };

});

// Check version against server module versions
socket.on('versionCheck', (serverArr) => {

    // Get client version
    var clientVersionFile = fs.readFileSync(pth.join(__dirname, './content/temp/clientVersion.json'));
    const clientVersion = JSON.parse(clientVersionFile.toString());
    var array = [];

    for (item of modulesArr) {
        if (serverArr[item].version != clientVersion[item].version) {

            moduleName = serverArr[item];
            array.push(moduleName.type);

            // Notify user that a racing series is out of date
            if (chosenModules.includes(moduleName.type) == false) {
                // win.webContents.send('notification', {title: 'Racing Series Out of Date', content: `Please sync the following: ${array.join()}`, type: 'bad', ms: 10000});
            };
            win.webContents.send('sendSeriesVersion', {
                module: moduleName,
                bool: 'bad'
            });
        } else if (serverArr[item].version == clientVersion[item].version) {

            // If versions do match then change html content accordingly
            const id = serverArr[item];
            win.webContents.send('sendSeriesVersion', {
                module: id,
                bool: 'good'
            });
        };
    };
});

// Watch for server connection event
socket.on('connect', () => {
    log('Connected to Server');
    if (isWindowOn) {
        win.webContents.send('notification', {
            title: 'Echelon Connected',
            content: `Echelon successfully connected to the server`,
            type: 'good',
            ms: 10000
        });

        isDownloadStopped = false;
        isServerConnected = true;
        win.webContents.send('serverState', isServerConnected);
    };
});

// Watch for server connect error
socket.on('connect_error', (err) => {
    log('Server not available, Retrying...');
    if (isWindowOn) {
        win.webContents.send('notification', {
            title: 'Echelon Lost Connection',
            content: `Awaiting server reconnection...`,
            type: 'bad',
            ms: 10000
        });

        isDownloadStopped = true;
        isServerConnected = false;
        win.webContents.send('serverState', isServerConnected);
    };
});