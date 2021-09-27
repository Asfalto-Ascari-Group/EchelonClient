const {
    BrowserWindow,
    app,
    ipcMain,
    autoUpdater,
    dialog,
    Notification
} = require('electron');
const {
    io
} = require('socket.io-client');
const fs = require('fs');
const {
    getGamePath
} = require('steam-game-path');
const unzipper = require('unzipper');
const http = require('http');
const pth = require('path');
const {
    time
} = require('console');

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
            detail: 'As of Echelon_BETA, Stopping a download can cause un-wanted side effects.'
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

// Catch response json files from server
socket.on('currentServerResponse', (arr) => {

    var json = [];
    for (item of arr.response) {
        json.push(item);
    };
    var counter = 0;
    var itemCount = json.length;
    var percentTerm = 100 / itemCount;
    var totalPercent = 0;

    // DOWNLOAD PORTION
    // Loop through all items in response JSON

    for (let item of json) {

        let itemString = item.urlpath.split('/');
        var id = itemString[5];

        // Start file download
        var req = http.get(item.urlpath, (res) => {

            // Emit server event
            socket.emit("cout", `Download Started: "${item.filename}" `);

            // Direct download stream to unzipper module
            res.pipe(
                unzipper.Extract({
                    path: `${gameInstallDir}/content/${item.type}/`
                })
            );

            res.on('close', () => {

                // Send current download path to renderer
                let path = `${gameInstallDir}/${item.filename}`;
                win.webContents.send('currentInstallPath', path);

                // Check if entry exists on the client hash map already
                // var clientHashMapPath = fs.readFileSync('./content/temp/client.json');
                var clientHashMap = JSON.parse(fs.readFileSync(pth.join(__dirname, '\\content\\temp\\client.json')));
                let dupe = clientHashMap.find(entry => entry.path.replace(/\\/g, "/") == `${gameInstallDir}\\content\\${item.type}\\${item.filename}`.replace(/\\/g, "/"));

                // If the entry does not exist, then add the entry to the hash map
                if (!dupe) {

                    let hashMapFinal = JSON.parse(fs.readFileSync(pth.join(__dirname, 'content\\temp\\client.json')));
                    hashMapFinal.push({
                        namespace: id,
                        type: item.type,
                        filename: item.filename,
                        ext: item.ext,
                        basename: item.basename,
                        urlpath: item.urlpath,
                        path: `${gameInstallDir}\\content\\${item.type}\\${item.filename}`
                    });

                    fs.writeFileSync(pth.join(__dirname, '.\\content\\temp\\client.json'), JSON.stringify(hashMapFinal, null, 4));
                };

                if (!isDownloadStopped) {
                    // Increment loop/progress counter
                    counter++;
                    totalPercent = totalPercent + percentTerm;
                    win.webContents.send('downloadProgress', Math.trunc(totalPercent));
                };

                // If all items on respective module have finished downloading
                if (json.length == counter) {

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

                    // Get and set the new client version
                    // var clientVersion = JSON.parse(fs.readFileSync(pth.join(__dirname, './content/temp/clientVersion.json')).toString());

                    // // let serverVersion = arr.version[id].version;
                    // // clientVersion[id].version = serverVersion;
                    // fs.writeFileSync(pth.join(__dirname, './content/temp/clientVersion.json'), JSON.stringify(clientVersion, null, 4));

                    // // HASHMAP PORTION (where appplicable)
                    // // Determine what modules have been unticked and delete all items that are under the respective module
                    // var clientHashMap = JSON.parse(fs.readFileSync(pth.join(__dirname, './content/temp/client.json')));
                    // for (item of clientHashMap) {
                    //     // if the item has a namespace that is inside of the chosenModules array
                    //     // -- delete files BEFORE then text on screen then the hash map

                    //     if (item.namespace == 'flSpec') {
                    //         // log(item.filename)
                    //     };
                    // };

                };
            });
        });
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