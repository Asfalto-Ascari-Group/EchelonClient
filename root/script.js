const { mainWindow, ipcRenderer, remote, ipcMain, app } = require('electron'),
    appStorage = window.localStorage;

// @GLOBALS
const log = console.log.bind(console),
    modulesArr = ['flSpec', 'gtSpec', 'iSpec'],
    eventArr = ['eventcontent1', 'eventcontent2'],
    infoArr = ['infocontent1', 'infocontent2', 'infocontent3'];

var userModulesArr = [],
    notisQueue = [],
    isQueueOpen = true,
    eventCounter = 0,
    infoCounter = 0,
    releaseName,
    canButtonBeUsed = true,
    serverState = false,
    isDownlading = false,
    DateHours,
    DateMinutes,
    DateDay;

// Config appStorage entries
const check = (id, n) => {
    var bool = (appStorage.getItem(n) === 'true');
    document.getElementById(id).checked = bool;
};

// Ease functions for localStorage
const SetLocalItem = (n, c) => {
    localStorage.setItem(n, c);
};
const GetLocalItem = (n) => {
    return localStorage.getItem(n);
};

// Game install path listener
ipcRenderer.on('gamePathStatus', (event, arr) => {
    
    // Configure path on client
    document.getElementById('pathmount').innerHTML = arr.msg;
    appStorage.setItem('gameInstallDir', arr.msg);
});

// Documents path listener
ipcRenderer.on('documentPathStatus', (event, arr) => {

    // Configure path on client
    document.getElementById('documentmount').innerHTML = arr;
    appStorage.setItem('documentsDir', arr);
});

ipcRenderer.on('cout', (event, msg) => {
    log(msg);
});

ipcRenderer.on('downloadProgress', (event, msg) => {
    document.getElementById('demoText').style.display = 'auto';
    document.getElementById('demoText').innerHTML = `${msg}%`;
});

ipcRenderer.on('downloadDone', (event, msg) => {
    confStopButton();
    document.getElementById('demoText2').innerHTML = msg;
    document.getElementById('demoText').innerHTML = '';
    setInterval(() => {
        document.getElementById('demoText2').innerHTML = '';
    }, 10000);
});

ipcRenderer.on('currentInstallPath', (event, path) => {
    document.getElementById('demoText2').innerHTML = '..' + path;
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
    if (bool === true || bool === 'true') {
        document.getElementById('statusIcon').innerHTML = '🟢';
    }
    else if (bool === false || bool === 'false') {
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

const rmLastSync = () => {
    document.getElementById('lastSyncContainer').style.opacity = 0;
};

// When all content is loaded on client side
window.addEventListener('DOMContentLoaded', () => {

    // Send load event to ipcMain
    ipcRenderer.send('windowLoad', {notis: appStorage.getItem('notifications') === 'true'});

    // Send all chosen modules to ipcMain
    for (item of modulesArr) {

        // Get item from appStorage (string), if item is 'true', then set boolean to true
        let p = appStorage.getItem(item),
            bool = false;
        if (p == 'true') {
            bool = true;
        };
        ipcRenderer.send('racingSeries', {type: item, value: bool});
    };

    // Configure & update paths from local storage
    let pathmount = appStorage.getItem('gameInstallDir'),
        documentmount = appStorage.getItem('documentsDir');

    if (!documentmount) {
        document.getElementById('documentmount').innerHTML = `Please choose the documents path for 'assettocorsa'`;
    } else if (documentmount) {
        document.getElementById('documentmount').innerHTML = documentmount;
    };

    if (!pathmount) {
        document.getElementById('pathmount').innerHTML = `Please choose the steam folder for 'assettocorsa'`;
    } else if (pathmount) {
        document.getElementById('pathmount').innerHTML = pathmount;
    };

    ipcRenderer.send('pathmount', pathmount);
    ipcRenderer.send('documentmount', documentmount);

    // Configure checkboxes
    check('cb1', 'flSpec');
    check('cb2', 'gtSpec');
    check('cb3', 'iSpec');
    check('notiCbx', 'notifications');

    // Configure stop button
    confStopButton();

    // Configure last sync date
    if (GetLocalItem('DateDay') == null || GetLocalItem('DateDay') == 0) {
        rmLastSync()
    };
    document.getElementById('lastSyncText').innerHTML = `Last Sync: ${GetLocalItem('DateDay')}<sup>th</sup>   ${GetLocalItem('DateHours')}:${GetLocalItem('DateMinutes')}`;

    // Are you developing ? = true/false
    // -- true = shows content that is NOT in the stable release
    const devBool = false;
    if (!devBool) {

        // -- Hide dev content
        document.getElementById('eventcontent1').style.display = 'none';
        document.getElementById('nextArrowMid').style.pointerEvents = 'auto';
        document.getElementById('eventdot1').style.pointerEvents = 'auto';
        document.getElementById('eventdot2').style.pointerEvents = 'auto';

        document.getElementById('memberinfoContainer').style.display = 'none';
        document.getElementById('settingsCogProfile').style.display = 'none';
        document.getElementById('devMemberContent').style.display = 'inline-block';

        document.getElementById('userContainer').style.display = 'none';
    
        document.getElementById('demoText2').style.display = 'inline-block';
        document.getElementById('demoText2').style.marginTop = '45px';

        document.getElementById('eventdot1').style.display = 'none';
        document.getElementById('eventdot1full').style.display = 'none';
        document.getElementById('eventdot2').style.display = 'none';
        document.getElementById('eventdot2full').style.display = 'none';

        // Remove this to see series versions
        document.getElementById('seriesVersionsContainer').style.display = 'none';
        document.getElementById('seriesNotification').style.display = 'none';
        document.getElementById('menuContainer').style.display = 'none';

        // -- Show release content
        document.getElementById('devEventContent').style.display = 'inline-block';
        document.getElementById('devEventContent').style.marginTop = '5px';
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

    ipcRenderer.send('clientLoaded');
});

const valueParse = (elem) => {
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

const clientNotificationChange = (elem) => {

    if (elem.checked) {
        appStorage.setItem('notifications', true);
        ipcRenderer.send('notisChange', false);
    }
    else if (!elem.checked) {
        appStorage.setItem('notifications', false);
        ipcRenderer.send('notisChange', false);
    };
};

const menuFold = (x) => {
    x.classList.toggle('change');
};

const createBrowserWindow = (url) => {
    const remote = require('electron').remote,
        BrowserWindow = remote.BrowserWindow,
        win = new BrowserWindow({
        height: 600,
        width: 800,
        icon: '.\\src\\images\\thumb.png',
        title: 'Echelon Media',
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true,
            contextIsolation: false
        }
    });

    win.loadURL(url);
};

// Watch for social links click
document.getElementById('discordClick').addEventListener('click', () => {
    ipcRenderer.send('openUrl', 'https://discord.gg/GvB7k7kp7g');
});
document.getElementById('githubClick').addEventListener('click', () => {
    ipcRenderer.send('https://github.com/Asfalto-Ascari-Group/EchelonClient');
});

// Listen for notification event from main
ipcRenderer.on('notification', (event, arr) => {
    // createNotification(arr.title, arr.content, arr.type, arr.ms);
    pushNotification(arr.title, arr.content, arr.type, arr.ms);
});

// Push content of notification to queue array
const pushNotification = (title, content, type, ms) =>{

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
const createNotification = (title, content, type, ms) => {

    // Block container
    isQueueOpen = false;

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

// Animation duration in milliseconds
var transDuration = 150;
const settingsSyncFold = () => {

    var topelem = document.getElementById('contentTL'),
        botelem = document.getElementById('subContentTL');

    topelem.style.transition = `opacity .${transDuration}s`;
    topelem.style.opacity = 0;
    setTimeout(() => {topelem.style.display = 'none';}, transDuration);

    botelem.style.opacity = 0;
    botelem.style.transition = `opacity .${transDuration}s`;
    setTimeout(() => {botelem.style.display = 'block';}, transDuration);
    botelem.style.opacity = 1;
};

const settingsSyncFlip = () => {

    var botelem = document.getElementById('subContentTL'),
        topelem = document.getElementById('contentTL');

    botelem.style.transition = `opacity .${transDuration}s`;
    botelem.style.opacity = 0;
    setTimeout(() => {botelem.style.display = 'none';}, transDuration);

    topelem.style.opacity = 0;
    topelem.style.transition = `opacity .${transDuration}s`;
    setTimeout(() => {topelem.style.display = 'block';}, transDuration);
    topelem.style.opacity = 1;
};

const elipAnim = async () => {

    var foo = ['', '.', '..', '...'],
        ele = document.getElementById('demoText3'),
        eleC = document.getElementById('demoText3Container'),
        x = 0;

    eleC.style.display = 'inline-block';
    ele.style.display = 'inline-block';

    ele.innerHTML = `${ele.innerHTML.split('.')[0]}${foo[x++]}`;
    const anim = setInterval(() => {

        if (isDownloading) {
            ele.innerHTML = `${ele.innerHTML.split('.')[0]}${foo[x++]}`;
            x &= 3;
        }
        else if (!isDownloading) {
            clearInterval(anim);
        };
    }, 650);
};

ipcRenderer.on('elipAnimCallUnzip', (event) => {
    downloadState = 'unzip';
});

ipcRenderer.on('removeStartPos', (event) => {
    document.getElementById('demoText3Container').style.display = 'none';
});

ipcRenderer.on('uiString', (event, msg) => {
    document.getElementById('demoText3').innerHTML = msg;
});

ipcRenderer.on('btnReact', (event, type) => {

    if (type == 'go') {
        const btnGo = document.getElementById('btnGo'),
            btnGoTop = document.getElementById('btnGoTop'),
            btnGoText = document.getElementById('goButtonText');
    
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
        document.getElementById('demoText').style.display = 'auto';
        document.getElementById('demoText').innerHTML = '0%';
        elipAnim();

    }
    else if (type == 'finish') {
        const btnGo = document.getElementById('btnGo'),
            btnGoTop = document.getElementById('btnGoTop'),
            btnGoText = document.getElementById('goButtonText');
    
        // Turn the button off
        btnGo.style.pointerEvents = 'auto';
        btnGoTop.style.pointerEvents = 'auto';
        btnGoText.style.pointerEvents = 'auto';
        btnGo.style.opacity = 1;
        btnGoTop.style.opacity = 1;
        btnGoText.style.opacity = 1;

        // Revert boolean so button can be used again
        canButtonBeUsed = true;

        // Remove UI elements
        document.getElementById('demoText3').style.display = 'none';

        // Change last sync ui
        DateHours = new Date().getHours();
        DateDay = new Date().getDate();
        DateMinutes = new Date().getMinutes();
        SetLocalItem('DateHours', DateHours);
        SetLocalItem('DateDay', DateDay);
        SetLocalItem('DateMinutes', DateMinutes);
        document.getElementById('lastSyncContainer').style.opacity = 1;
        document.getElementById('lastSyncText').innerHTML = `Last Sync: ${DateDay}<sup>th</sup>   ${DateHours}:${DateMinutes}`;
    };
});

const btnGo = () => {
    if (canButtonBeUsed) {
        ipcRenderer.send('syncButton', 'start');
    };
};
const btnStop = () => {
    ipcRenderer.send('syncButton', 'stop');
};

// Button start event
document.getElementById('btnGo').addEventListener('click', () => {
    btnGo();
});

// Button stop event
document.getElementById('btnStop').addEventListener('click', () => {
    btnStop();
});

ipcRenderer.on('buttonStart', () => {

    document.getElementById('demoText').style.opacity = 1;

    var element = document.getElementById('demoText2');
    element.style.opacity = 1;
    element.innerHTML = '<ReactAnimatedEllipsis/>';

    // Swap booleans
    canButtonBeUsed = false;
    isDownloading = true;

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

    // Check if series has been selected initially
    if (array.length == 0) {
        pushNotification('Invalid Series Selection', 'Please choose a racing series to synchronise', 'bad', 10000)
    }
    else if (array.length != 0) {
        ipcRenderer.send('getCurrent', {arr: array, notis: appStorage.getItem('notifications')});
    };
});

ipcRenderer.on('buttonStop', () => {

    confStopButton();
    document.getElementById('demoText').style.opacity = 0;
    document.getElementById('demoText2').style.opacity = 0;
    document.getElementById('demoText3').style.display = 'none';

    setTimeout(() => {
        const btnGo = document.getElementById('btnGo'),
            btnGoTop = document.getElementById('btnGoTop'),
            btnGoText = document.getElementById('goButtonText');
    
        // Turn the go button on
        btnGo.style.pointerEvents = 'auto';
        btnGoTop.style.pointerEvents = 'auto';
        btnGoText.style.pointerEvents = 'auto';
        btnGo.style.opacity = 1;
        btnGoTop.style.opacity = 1;
        btnGoText.style.opacity = 1;

        // Swap booleans
        canButtonBeUsed = true;
        isDownloading = false;

    }, 600);
});

const changeEventSlide = () => {
    let a = document.getElementById(eventArr[eventCounter]);
    a.style.transition = '0.15s ease-in-out';
    a.style.opacity = 1;
    setTimeout(() => {a.style.display = 'none'}, 150);
    a.style.opacity = 0;

    eventCounter++;

    const eventdot1full = document.getElementById('eventdot1full'),
        eventdot1 = document.getElementById('eventdot1'),
        eventdot2full = document.getElementById('eventdot2full'),
        eventdot2 = document.getElementById('eventdot2');

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

    const infodot1full = document.getElementById('infodot1full'),
        infodot1 = document.getElementById('infodot1'),
        infodot2full = document.getElementById('infodot2full'),
        infodot2 = document.getElementById('infodot2');

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