const { mainWindow, ipcRenderer, remote, ipcMain } = require('electron');
const ReactAnimatedEllipsis = require('react-animated-ellipsis');
const appStorage = window.localStorage;

// @GLOBALS
const log = console.log.bind(console);
const modulesArr = ['flSpec', 'gtSpec', 'cSpec'];
var userModulesArr = [];
const eventArr = ['eventcontent1', 'eventcontent2'];
const infoArr = ['infocontent1', 'infocontent2', 'infocontent3'];
var notisQueue = [];
var isQueueOpen = true;
var eventCounter = 0;
var infoCounter = 0;
var releaseName;
var canButtonBeUsed = true;
var serverState = false;
var downloadState = 'dl';

// Config appStorage entries
const check = (id, n) => {
    var bool = (appStorage.getItem(n) === 'true');
    document.getElementById(id).checked = bool;
};

ipcRenderer.on('cout', (event, msg) => {
    log(msg);
});

// DEPRECATED
// ipcRenderer.on('getLocalStorage', (event) => {
//     // Send local storage user choice data to main.js
//     var array = [];

//     for (const module of modulesArr) {
//         let value = appStorage.getItem(module);
//         if (value != null) {
//             array.push({
//                 moduleName: module,
//                 value: value
//             });
//         };
//     };

//     // if (array.length <= 0) {}; -- code on main
//     ipcMain.send('resLocalStorage', array);
// });

// Game install path listener
ipcRenderer.on('gamePathStatus', (event, arr) => {
    
    document.getElementById('pathmount').innerHTML = arr.msg;
    // Save install path to appStorage
    appStorage.setItem('gameInstallDir', arr.msg);
});

// Mod handler path listener
ipcRenderer.on('documentPathStatus', (event, arr) => {
    
    document.getElementById('documentmount').innerHTML = arr.msg;
    // Save install path to appStorage
    appStorage.setItem('documentsDir', arr.msg);
});

// ? DEPRECATED
// ipcRenderer.on('downloadState?', (event, rescode) => {
//     if (rescode === 200) {
//         log('download started');
//         // notify user that download has started
//     } else if (rescode === 206) {
//         log('download stopped');
//         // notify user that download has stopped
//     } else if (rescode === 201) {
//         log('download finished');
//         // turn start button opacity back to 1
//         const btnGo = document.getElementById('btnGo');
//         const btnGoTop = document.getElementById('btnGoTop');
        
//         btnGo.style.pointerEvents = 'auto';
//         btnGoTop.style.pointerEvents= 'auto';
//         btnGo.style.opacity = 1;
//         btnGoTop.style.opacity = 1;
//     };
// });

ipcRenderer.on('downloadProgress', (event, msg) => {
    document.getElementById('demoText').innerHTML = `${msg}%`;
});

ipcRenderer.on('downloadDone', (event, msg) => {
    document.getElementById('demoText2').innerHTML = msg;
    confStopButton();
    document.getElementById('demoText3Container').style.display = 'none';
});

ipcRenderer.on('dlPath', (event, msg) => {
    document.getElementById('demoText2').innerHTML = '...' + msg;
});

ipcRenderer.on('currentInstallPath', (event, path) => {
    // log('..' + path.split('\\common')[1].replace(/\\/g, '/'));
    document.getElementById('demoText2').innerHTML = '..' + path.split('\\common')[1].replace(/\\/g, '/');
});

// Mount sends path back to ipcMain when user chooses a steam path
document.getElementById('pathmountButton').addEventListener('click', () => {
    ipcRenderer.send('gamePathMount');
});

// Mount sends path back to ipcMain when user chooses a document path
document.getElementById('documentsmountButton').addEventListener('click', () => {
    ipcRenderer.send('documentsPathMount');
});

// Window close button event listener
document.getElementById('btnClose').addEventListener('click', () => {
    remote.BrowserWindow.getFocusedWindow().close();
});

// Window minimize button event listener
document.getElementById('btnMin').addEventListener('click', () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
});

// Listen for release name from main
ipcRenderer.on('releaseName', (event, rel) => {
    releaseName = rel;
});

ipcRenderer.on('sendSeriesVersion', (event, arr) => {
    if (arr.bool == 'bad') {
        document.getElementById(`${arr.module.type}VersionContent`).innerHTML = '❌ Out of Date';
    }
    else if (arr.bool != 'bad') {
        document.getElementById(`${arr.module.type}VersionContent`).innerHTML = '✔️ Up to Date';
    };
});

ipcRenderer.on('sendSeriesVersionFin', (event, arr) => {
    if (arr.bool == 'bad') {
        document.getElementById(`${arr.module}VersionContent`).innerHTML = '❌ Out of Date';
    }
    else if (arr.bool != 'bad') {
        document.getElementById(`${arr.module}VersionContent`).innerHTML = '✔️ Up to Date';
    };
});

ipcRenderer.on('serverState', (event, bool) => {
    serverState = bool;

    if (serverState) {
        // change to green
        document.getElementById('statusIcon').innerHTML = '🟢';

    }
    else if (!serverState) {
        // change to red
        document.getElementById('statusIcon').innerHTML = '🔴';

    };
});

const confStopButton = () => {
    const btnStop = document.getElementById('btnStop');
    const btnStopTop = document.getElementById('btnStopTop');
    const btnStopText = document.getElementById('stopButtonText');

    // Turn the button off
    btnStop.style.pointerEvents = 'none';
    btnStopTop.style.pointerEvents = 'none';
    btnStopText.style.pointerEvents = 'none';
    btnStop.style.opacity = 0.3;
    btnStopTop.style.opacity = 0.3;
    btnStopText.style.opacity = 0.3;
};

window.addEventListener('DOMContentLoaded', () => {

    // Send load event to ipcMain
    ipcRenderer.send('windowLoad', {notis: appStorage.getItem('notifications') === 'true'});

    // Send all chosen modules to ipcMain
    for (item of modulesArr) {

        // Get item from appStorage (string), if item is 'true', then set boolean to true
        let p = appStorage.getItem(item);
        let bool = false;
        if (p == 'true') {
            bool = true;
        };
        ipcRenderer.send('racingSeries', {type: item, value: bool});
    };

    // Update game install path to what is in appStorage
    document.getElementById('pathmount').innerHTML = appStorage.getItem('gameInstallDir');

    // Update game documents path to what is in appStorage
    // document.getElementById('documentmount').innerHTML = appStorage.getItem('gameInstallDir');

    // Configure checkboxes
    check('cb1', 'flSpec');
    check('cb2', 'gtSpec');
    check('cb3', 'cSpec');
    check('notiCbx', 'notifications');

    // Configure stop button
    confStopButton();

    // Are you developing ? = true/false
    // -- true = shows content that is NOT in the stable release
    const devBool = false;
    if (!devBool) {
        // -- Hide dev content
        document.getElementById('eventcontent1').style.display = 'none';
        document.getElementById('nextArrowMid').style.pointerEvents = 'none';
        document.getElementById('eventdot1').style.pointerEvents = 'none';
        document.getElementById('eventdot2').style.pointerEvents = 'none';

        document.getElementById('memberinfoContainer').style.display = 'none';
        document.getElementById('settingsCogProfile').style.display = 'none';
        document.getElementById('devMemberContent').style.display = 'inline-block';

        document.getElementById('userContainer').style.display = 'none';
    
        document.getElementById('demoText2').style.display = 'inline-block';
        document.getElementById('demoText2').style.marginTop = '45px';

        // document.getElementById('titlemount2').style.display = 'none';
        // document.getElementById('documentsmountButton').style.display = 'none';
        // document.getElementById('documentmount').style.display = 'none';

        document.getElementById('eventdot1').style.display = 'none';
        document.getElementById('eventdot1full').style.display = 'none';
        document.getElementById('eventdot2').style.display = 'none';
        document.getElementById('eventdot2full').style.display = 'none';

        // remove this to see series versions
        document.getElementById('seriesVersionsContainer').style.display = 'none';
        document.getElementById('seriesNotification').style.display = 'none';
        document.getElementById('menuContainer').style.display = 'none';

        // -- Show release content
        document.getElementById('devEventContent').style.display = 'block';
        document.getElementById('cellHead2').style.marginTop = '-110px';
    }
    else if (devBool) {
        // -- Hide release content
        document.getElementById('devEventContent').style.display = 'none';
        document.getElementById('devMemberContent').style.display = 'none';

        // -- Show dev content
        document.getElementById('eventcontent1').style.display = 'inline-block';
        document.getElementById('nextArrowMid').style.pointerEvents = 'auto';
        document.getElementById('eventdot1').style.pointerEvents = 'auto';
        document.getElementById('eventdot2').style.pointerEvents = 'auto';

        document.getElementById('demoText2').style.display = 'inline-block';
        document.getElementById('demoText2').style.marginTop = '45px';
    };
});

function valueParse(elem) {
    appStorage.setItem(elem.name, elem.checked);
    ipcRenderer.send('racingSeries', {type: elem.name, value: elem.checked});

    // Send notification where applicable
    if (elem.checked == true) {
        document.getElementById('seriesNotification').innerHTML = '&#8226; Please synchronise to download respective series content';
    }
    else if (elem.checked == false) {
        document.getElementById('seriesNotification').innerHTML = '&#8226; Please synchronise to delete respective series content';
    };
};

function clientNotificationChange(elem) {

    if (elem.checked) {
        appStorage.setItem('notifications', true);
        ipcRenderer.send('notisChange', false);
    }
    else if (!elem.checked) {
        appStorage.setItem('notifications', false);
        ipcRenderer.send('notisChange', false);
    };
};

function menuFold(x) {
    x.classList.toggle('change');
};

function createBrowserWindow(url) {
    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;
    const win = new BrowserWindow({
        height: 600,
        width: 800,
        icon: '.\\src\\images\\thumb.png',
        title: 'Asfalto Ascari Discord',
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    win.loadURL(url);
}

// Watch for social links click
document.getElementById('discordClick').addEventListener('click', () => {
    createBrowserWindow('https://discord.gg/GvB7k7kp7g');
});
document.getElementById('githubClick').addEventListener('click', () => {
    createBrowserWindow('https://github.com/Asfalto-Ascari-Group/EchelonClient-Release-Stable/releases');
});

// Listen for notification event from main
ipcRenderer.on('notification', (event, arr) => {
    // createNotification(arr.title, arr.content, arr.type, arr.ms);
    pushNotification(arr.title, arr.content, arr.type, arr.ms);
});

// Push content of notification to queue array
function pushNotification(title, content, type, ms) {

    // Push notification to queue array
    notisQueue.push({
        title: title,
        content: content,
        type: type,
        ms: ms
    });

    // Check if container is in use
    if (isQueueOpen) {
        createNotification(title, content, type, ms);
    };

};

// Create notification
function createNotification(title, content, type, ms) {

    // Block container
    isQueueOpen = false;
    
    // -- if (indexOf == 0) {};
    // --   false = show notification
    // --   true = do not show

    // -- containerBool { @bool };
    // --   true = empty container
    // --   false = container in use until debounce called


    // Configure the notification
    var notification = document.getElementById('notification');

    if (type == 'good') {
        notification.style.backgroundColor = 'rgb(63, 153, 63)';
    }
    else if (type == 'bad') {
        notification.style.backgroundColor = 'rgb(151, 55, 55)';
    };

    notification.style.display = 'inline-block';
    document.getElementById('notificationTitle').innerHTML = title;
    document.getElementById('notificationSubtitle').innerHTML = content;

    // Notification debounce
    if (ms != 0) {
        setTimeout(() => {

            notification.style.display = 'none';
    
            notisQueue.shift();
            // log(notisQueue);
    
            isQueueOpen = true;
            
            if (notisQueue[0]) {
                let tname = notisQueue[0];
                createNotification(tname.title, tname.content, tname.type, tname.ms);
            };
            
        }, ms);
    };

    // If debounce is 0 then make it promise based (internal) - ???
};

var transDuration = 150;
function settingsSyncFold() {

    const topelem = document.getElementById('contentTL');
    topelem.style.transition = `opacity .${transDuration}s`;
    topelem.style.opacity = 0;
    setTimeout(() => {topelem.style.display = 'none';}, transDuration);

    const botelem = document.getElementById('subContentTL');
    botelem.style.opacity = 0;
    botelem.style.transition = `opacity .${transDuration}s`;
    setTimeout(() => {botelem.style.display = 'block';}, transDuration);
    botelem.style.opacity = 1;
};

function settingsSyncFlip() {

    const botelem = document.getElementById('subContentTL');
    botelem.style.transition = `opacity .${transDuration}s`;
    botelem.style.opacity = 0;
    setTimeout(() => {botelem.style.display = 'none';}, transDuration);

    const topelem = document.getElementById('contentTL');
    topelem.style.opacity = 0;
    topelem.style.transition = `opacity .${transDuration}s`;
    setTimeout(() => {topelem.style.display = 'block';}, transDuration);
    topelem.style.opacity = 1;
};

async function elipAnim() {

    var foo = [' ', '.', '..', '...'];
    var ele = document.getElementById('demoText3');
    var eleC = document.getElementById('demoText3Container');
    var x = 0;

    ele.innerHTML = '';
    eleC.style.display = 'inline-block';

    ele.innerHTML = 'Downloading Files' + foo[x++];
    setInterval(() => {
        if (downloadState == 'dl') {
            ele.innerHTML = `Downloading Files${foo[x++]}`;
            x &= 3;
        };
        if (downloadState == 'unzip') {
            ele.innerHTML = `Unzipping Files${foo[x++]}`;
            x &= 3;
        }
    }, 650);
};

ipcRenderer.on('elipAnimCallUnzip', (event) => {
    downloadState = 'unzip';
});

ipcRenderer.on('removeStartPos', (event) => {
    document.getElementById('demoText3Container').style.display = 'none';
});

ipcRenderer.on('btnReact', (event, type) => {

    if (type == 'go') {
        const btnGo = document.getElementById('btnGo');
        const btnGoTop = document.getElementById('btnGoTop');
        const btnGoText = document.getElementById('goButtonText');
    
        // Turn the button off
        btnGo.style.pointerEvents = 'none';
        btnGoTop.style.pointerEvents = 'none';
        btnGoText.style.pointerEvents = 'none';
        btnGo.style.opacity = 0.3;
        btnGoTop.style.opacity = 0.3;
        btnGoText.style.opacity = 0.3;
    
        // Return stop button back to normal
        document.getElementById('btnStop').style.opacity = 1;
        document.getElementById('btnStopTop').style.opacity = 1;
        document.getElementById('stopButtonText').style.opacity = 1;

        // Change innerHTML of progress text
        // document.getElementById('demoText2').innerHTML = 'Starting download..';
        document.getElementById('demoText').innerHTML = '0%';
        elipAnim();

        // use while loop and setTimeout instead

    }
    else if (type == 'finish') {
        const btnGo = document.getElementById('btnGo');
        const btnGoTop = document.getElementById('btnGoTop');
        const btnGoText = document.getElementById('goButtonText');
    
        // Turn the button off
        btnGo.style.pointerEvents = 'auto';
        btnGoTop.style.pointerEvents = 'auto';
        btnGoText.style.pointerEvents = 'auto';
        btnGo.style.opacity = 1;
        btnGoTop.style.opacity = 1;
        btnGoText.style.opacity = 1;

        // Revert boolean so button can be used again
        canButtonBeUsed = true;

        document.getElementById('demoText3').style.display = 'none';
    };
});

const btnGo = () => {

    if (canButtonBeUsed) {
        ipcRenderer.send('syncButton', 'start');
    };
};

ipcRenderer.on('buttonStart', () => {

    document.getElementById('demoText').style.opacity = 1;

    var element = document.getElementById('demoText2');
    element.style.opacity = 1;
    element.innerHTML = '<ReactAnimatedEllipsis/>';

    // Disable use of button
    canButtonBeUsed = false;

    // Loop through appStorage and send module key&value pairs to ipcMain
    var array = [];
    for (var keyName in appStorage) {
        var item = appStorage.getItem(keyName);
        if (item != null) {
            if (modulesArr.includes(keyName)) {
                if (item == 'true') {
                    array.push(keyName);
                };
            };
        };
    };
    // ^ deprecated ?

    // Check if series has been selected initially
    if (array.length == 0) {
        pushNotification('Invalid Series Selection', 'Please choose a racing series to synchronise', 'bad', 10000)
    }
    else if (array.length != 0) {
        ipcRenderer.send('getCurrent', {arr: array, notis: appStorage.getItem('notifications')});
    };
});

const btnStop = () => {
    ipcRenderer.send('syncButton', 'stop');
};

ipcRenderer.on('buttonStop', () => {

    confStopButton();
    document.getElementById('demoText').style.opacity = 0;
    document.getElementById('demoText2').style.opacity = 0;
    document.getElementById('demoText3').style.display = 'none';

    setTimeout(() => {
        const btnGo = document.getElementById('btnGo');
        const btnGoTop = document.getElementById('btnGoTop');
        const btnGoText = document.getElementById('goButtonText');
    
        // Turn the go button on
        btnGo.style.pointerEvents = 'auto';
        btnGoTop.style.pointerEvents = 'auto';
        btnGoText.style.pointerEvents = 'auto';
        btnGo.style.opacity = 1;
        btnGoTop.style.opacity = 1;
        btnGoText.style.opacity = 1;

        // Revert boolean so button can be used again
        canButtonBeUsed = true;
    }, 600);
    
});

const changeEventSlide = () => {
    let a = document.getElementById(eventArr[eventCounter]);
    a.style.transition = '0.15s ease-in-out';
    a.style.opacity = 1;
    setTimeout(() => {a.style.display = 'none'}, 150);
    a.style.opacity = 0;

    eventCounter++;

    const eventdot1full = document.getElementById('eventdot1full');
    const eventdot1 = document.getElementById('eventdot1');
    const eventdot2full = document.getElementById('eventdot2full');
    const eventdot2 = document.getElementById('eventdot2');

    if (eventCounter == 1) {
        eventdot1full.style.display = 'none';
        eventdot1.style.display = 'inline-block';

        eventdot2.style.display = 'none';
        eventdot2full.style.display = 'inline-block';
    };

    if (eventCounter == 2) {
        eventCounter = 0;

        eventdot1full.style.display = 'inline-block';
        eventdot1.style.display = 'none';

        eventdot2.style.display = 'inline-block';
        eventdot2full.style.display = 'none';
    };
    
    let b = document.getElementById(eventArr[eventCounter]);
    b.style.opacity = 0;
    b.style.transition = '0.15s ease-in-out';
    setTimeout(() => {b.style.display = 'inline-block';}, 150);
    b.style.opacity = 1;
};


const changeInfoSlide = () => {
    let a = document.getElementById(infoArr[infoCounter]);
    a.style.transition = '0.15s ease-in-out';
    a.style.opacity = 1;
    setTimeout(() => {a.style.display = 'none'}, 150);
    a.style.opacity = 0;

    // document.getElementById(infoArr[infoCounter]).style.display = 'none';
    infoCounter++;

    const infodot1full = document.getElementById('infodot1full');
    const infodot1 = document.getElementById('infodot1');
    const infodot2full = document.getElementById('infodot2full');
    const infodot2 = document.getElementById('infodot2');

    if (infoCounter == 1) {
        infodot1full.style.display = 'none';
        infodot1.style.display = 'inline-block';

        infodot2.style.display = 'none';
        infodot2full.style.display = 'inline-block';
    };

    if (infoCounter == 2) {
        infoCounter = 0;

       infodot1full.style.display = 'inline-block';
        infodot1.style.display = 'none';

        infodot2.style.display = 'inline-block';
        infodot2full.style.display = 'none';
    };

    let b = document.getElementById(infoArr[infoCounter]);
    b.style.opacity = 0;
    b.style.transition = '0.15s ease-in-out';
    setTimeout(() => {b.style.display = 'inline-block';}, 150);
    b.style.opacity = 1;
};

ipcRenderer.on('serverDisconnect', () => {
    canButtonBeUsed = false;
    ipcRenderer.send('syncStop');
});

ipcRenderer.on('serverConnect', () => {
    canButtonBeUsed = true;
    ipcRenderer.send('syncGo');
});