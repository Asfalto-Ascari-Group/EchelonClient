const { BrowserWindow, app, autoUpdater, ipcMain, dialog, Notification } = require('electron');
const { io } = require('socket.io-client');
const fs = require('fs');
const { getGamePath } = require('steam-game-path');
const isDev = require('electron-is-dev');
const unzipper = require('unzipper');
const http = require('http');
const pth = require('path');
const os = require('os');

require('dotenv').config();

// Check if electron is in dev or production
if (isDev) {
	console.log('Running in development');
} else if (!isDev) {
	console.log('Running in production');
};

// Define variable connection
const socket = io(`http://34.69.110.17:4644`, {
    reconnection: true,
    pingTimeout: 1000,
    pingInterval: 1000,
    reconnectionDelayMax: 1000
});
// Above connection is the socket.io server
// During the request phase, the server will send back a socket that leads to the file server to download content

// Global variables
var log = console.log.bind(console);
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
var clientLoadProgress = false;
var mainLoadProgress = false;

// Configure window options
var win;
app.whenReady();

// Declare createWindow function
function createWindow() {
    win = new BrowserWindow({
        height: 870,
        width: 1080,
        title: `Project Echelon`,
        icon: '.\\root\\src\\images\\thumb.png',
        resizable: false,
        frame: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    win.loadFile('root/index.html');

    win.webContents.on('did-finish-load', function() {
        win.show();
    });
    
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
    mainLoadProgress = true;
});

// If all windows in this context are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    };
});

// DEPRECATED
// const findDocumentsFallback = (baseuid) => {
//     try {
//         win.webContents.send('cout', 'documents error callback - @findDocumentsFallback {func}');

//         if (fs.readdirSync(`${baseuid}\\Documents\\assettocorsa`)) {

//             documentsDirUser = `${baseuid}\\Documents\\assettocorsa`;
//             documentsDir = documentsDirUser;
//             win.webContents.send('documentPathStatus', {msg: documentsDir});
//         }
//         win.webContents.send('notification', {title: 'Temporary Documents Path Found...', content: 'Please choose a documents path for "assettocorsa"', type: 'bad', ms: 7000});
//     }
//     catch (err) {

//         win.webContents.send('notification', {title: 'Documents Could Not Be Found...', content: 'Please choose a documents path for "assettocorsa"', type: 'bad', ms: 10000});
//         return err;
//     };
// };

// const findDocuments = async (baseuid, dataGamePath) => {
//     try {
//         win.webContents.send('cout', 'documents main function - @findDocuments {func}');

//         if (fs.readdirSync(`${dataGamePath}:\\Users\\${baseuid}\\`)) {
//             if (fs.readdirSync(`${dataGamePath}:\\Users\\${baseuid}\\Documents\\assettocorsa`)) {

//                 // 'assettocorsa' exists in documents folder
//                 documentsDirUser = `${dataGamePath}:\\Users\\${baseuid}\\Documents\\assettocorsa`;
//                 documentsDir = documentsDirUser;
//                 win.webContents.send('documentPathStatus', {msg: documentsDir});
//             };
//         }
//         else {
//             findDocumentsFallback(baseuid);
//         };
//     }
//     catch (err) {
//         win.webContents.send('notification', {title: 'Documents Could Not Be Found...', content: 'Please choose a documents path for "assettocorsa"', type: 'bad', ms: 10000});
//     };
// };

// On window load
ipcMain.on('windowLoad', (event, arr) => {

    // Variables conf
    isWindowOn = true;
    notisChoice = arr.notis;

    // Find game install dir
    var data = getGamePath(244210);

    try {
        if (data.game.path) {
            gameInstallDir = data.game.path;
        };
        isGamePathFound = true;
        win.webContents.send('gamePathStatus', {msg: gameInstallDir});
    }
    catch (err) {
        isGamePathFound = false;
        win.webContents.send('gamePathStatus', {msg: 'Game installation path not found'});
        win.webContents.send('notification', {title: 'Assetto Corsa Could Not Be Found...', content: `Please choose a Steam installation path for 'assettocorsa'`, type: 'bad', ms: 10000});
    };

    // DEPRECATED
    // if (isGamePathFound) {
    //     var baseuid = os.homedir().split('\\')[2];
    //     findDocuments(baseuid, data.game.path[0]);
    // };

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

// Listen for path incoming
ipcMain.on('pathmount', (event, msg) => {
    gameInstallDir = msg;
});
ipcMain.on('documentmount', (event, msg) => {
    documentsDir = msg;
});

// Remove paths past 'assettocorsa'
function splitWithIndex(p, c) {
    let foo = p.split('\\');
    let newPath = ``;
    let bool = false;

    for (item of foo) {
        if (!bool) {
            if (item != c) {
                if (item == foo[0]) {
                    newPath = `${item}`;
                }
                else {
                    newPath = `${newPath}\\${item}`;
                };
            }
            else if (item == c) {
                bool = true;
                newPath = `${newPath}\\${item}`;
            };
        };
    };
    return newPath;
};

const newGamePath = (path) => {

    try {
        if (path == undefined) {
            // Empty
            win.webContents.send('notification', {title: 'Empty Installation Path', content: `Please enter a Steam installation path`, type: 'bad', ms: 10000});
        }
        else if (!path[0].includes('assettocorsa')) {
            // Incorrect
            win.webContents.send('notification', {title: 'Invalid Installation Path', content: `Please enter a Steam path that contains the 'assettocorsa' directory`, type: 'bad', ms: 10000});
        }
        else if (path[0].includes('steamapps') && path[0].includes('assettocorsa') && !path[0].includes('Documents')) {
            // Correct
            gameInstallDir = splitWithIndex(path[0], 'assettocorsa');
            log(gameInstallDir)
        };
    }
    catch (err) {
        log(err);
    };
};

const newDocumentsPath = (path) => {

    try {
        if (path == undefined) {
            // Empty
            win.webContents.send('notification', {title: 'Empty Documents Path', content: `Please enter an 'assettocorsa' documents path`, type: 'bad', ms: 10000});
        }
        else if (!path[0].includes('Documents')) {
            // Incorrect
            win.webContents.send('notification', {title: 'Invalid Documents Path', content: `Please enter a documents path that contains the 'assettocorsa' directory`, type: 'bad', ms: 10000});
        }
        else if (path[0].includes('Documents') && path[0].includes('assettocorsa')) {
            // Correct
            documentsDir = splitWithIndex(path[0], 'Documents');
        };
    }
    catch (err) {
        log(err);
    };
};

// User chooses their steam game path
ipcMain.on('gamePathMount', () => {

    // Give user choice to browse for assettocorsa directory
    gameInstallDirUser = dialog.showOpenDialogSync(win, {
        title: 'Choose "assettocorsa" file path', 
        properties: ['openDirectory'], 
        defaultPath: `${gameInstallDir || os.homedir()}`
    });

    newGamePath(gameInstallDirUser);
});

// User chooses their documents game path
ipcMain.on('documentsPathMount', () => {

    // Open dialog box
    documentsDirUser = dialog.showOpenDialogSync(win, {
        title: 'Choose "assettocorsa" file path',
        properties: ['openDirectory'], 
        defaultPath: `${documentsDir || os.homedir()}`
    });

    newDocumentsPath(documentsDirUser);

});

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
    win.webContents.send('uiString', 'Fetching Files');
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

const checkBeforeDownload = () => {

    // Check if gameInstallDir and documentsInstallDir are correct and present before downloading
    if (gameInstallDir != undefined || documentsDir != undefined) {
        return true;
    }
    else {
        win.webContents.send('notification', {title: 'Please Check File Path Settings', content: `The file path settings for one or more type is invalid`, type: 'bad', ms: 10000});
        return false;
    };
};

const DownloadFinished = () => {

    // Send complete state for client UI
    win.webContents.send('btnReact', 'finish');
    win.webContents.send('downloadDone', 'Syncronise Finished!');

    // Reset ALL download variables
    globalFilesCount = 0;
    percentTerm = 0;
    counter = 0;
    totalPercent = 0;
    isDownloadQueueOpen = true;

    // Check for notification boolean
    if (notisChoice == 'true') {
        const notification = new Notification({
            title: `Echelon has Finished Syncing`,
            body: 'Your Assetto Corsa content is synchronised'
        }).show();
    };
};

const pushFileToQueue = (file) => {

    // Push file to queue
    filesToDownload.push(file);

    // Configure variables
    globalFilesCount++;
    percentTerm = 100 / globalFilesCount;
    // -- 2.99999999999999976

    // Check if queue is in use
    if (isDownloadQueueOpen) {
        downloadFile(file);
    };
};

const downloadFile = (file) => {

    // Block download queue
    isDownloadQueueOpen = false;

    // Download file
    var req = http.get(file.urlpath, (res) => {

        // Make a check for module type and selector
        if (file.moduleType == 'setups') {
            log('setups');
            log(`${documentsDir}\\${file.selector}`);
            // let docsPath = fs.createWriteStream(`${documentsDir}\\assettocorsa\\${file.selector}`);
            res.pipe(unzipper.Extract({path: `${documentsDir}\\${file.selector}`}));
        }
        else if (file.moduleType == 'assets') {
            log('assets');
            res.pipe(unzipper.Extract({path: `${gameInstallDir}\\content\\${file.type}`}));
        };


        // Unzip finish
        res.on('end', () => {
            // log('end');
            counter++;
            totalPercent += percentTerm;
            win.webContents.send('downloadProgress', Math.trunc(totalPercent));
            filesToDownload.shift();
            isDownloadQueueOpen = true;
            if (counter != globalFilesCount) {
                downloadFile(filesToDownload[0]);
            }
            else if (counter == globalFilesCount) {
                DownloadFinished();
            };
        });

        res.on('error', (error) => {
            log(error)
        });

    });

    // Request options
    req.shouldKeepAlive = false;
    req.setTimeout(60000);
    
    // Initial file download
    req.on('response', () => {
        // log('response');
        win.webContents.send('uiString', 'Downloading Files');
        if (counter != filesToDownload.length) {
            let path = `${gameInstallDir}\\${file.filename}`;
            let newPath = path.split('assettocorsa');
            win.webContents.send('currentInstallPath', `assettocorsa${newPath[1]}`);
        };
    });

    // Catch error event
    req.on('error', (error) => {
        log(error);
    });
};

// Start download socket response from server
socket.on('currentServerResponse', (arr) => {
    let filesAmount = arr.response.length + arr.setups.appsJson.length + arr.setups.contentJson.length;
    let payload = [];
    log(documentsDir);
    log(gameInstallDir);

    for (item of arr.response) {
        payload.push(item);
    };

    for (item of arr.setups.appsJson) {
        payload.push(item);
    };

    for (item of arr.setups.contentJson) {
        payload.push(item);
    };
    
    if (checkBeforeDownload()) {

        win.webContents.send('uiString', 'Starting Download');

        // Download each file seperatley
        for (let i=0; i < filesAmount; i++) {
            pushFileToQueue(payload[i]);
        };
    };

});

// Check version against server module versions
socket.on('versionCheck', (serverArr) => {

    // Get client version
    var clientVersionFile = fs.readFileSync(pth.join(__dirname, '.\\content\\temp\\clientVersion.json'));
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

// Listen for client load event
ipcMain.on('clientLoaded', () => {
    clientLoadProgress = true;
});

// Watch for server connection event
socket.on('connect', () => {
    log('Connected to Server');
    if (isWindowOn) {

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