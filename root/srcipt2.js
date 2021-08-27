const { ipcRenderer, remote, ipcMain } = require('electron');

const appStorage = window.localStorage;
// const modules = require('.././modules.js')

// @GLOBALS
const log = console.log.bind(console);
const modulesArr = ['flSpec', 'gtSpec', 'cSpec'];
var userModulesArr = [];
const eventArr = ['eventcontent1', 'eventcontent2'];
const infoArr = ['infocontent1', 'infocontent2', 'infocontent3'];
var eventCounter = 0;
var infoCounter = 0;
var releaseName;

// Config appStorage entries
const check = (id, n) => {
    var bool = (appStorage.getItem(n) === 'true');
    document.getElementById(id).checked = bool;
};

ipcRenderer.on('getLocalStorage', (event) => {
    // send local storage user choice data to main.js
    var array = [];

    for (const module of modulesArr) {
        let value = appStorage.getItem(module);
        if (value != null) {
            array.push({
                moduleName: module,
                value: value
            });
        };
    };

    // if (array.length <= 0) {}; -- code on main
    ipcMain.send('resLocalStorage', array);
});

ipcRenderer.on('pathStatus', (event, arr) => {
    document.getElementById('pathmount').innerHTML = arr.msg;
});

ipcRenderer.on('log', (event, msg) => {
    log(msg);
});

// ipcRenderer.on('serverState?', (event, rescode) => {
//     // show respective pop-ups for user
//     if (rescode === 404) {
//         // 404 = 'Not Found';
//         log('Reconnecting to server');
//     }else if (rescode === 200) {
//         // 200 = 'OK';
//         log('Connected to server');
//     };
//     // refer to https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#server_error_responses
// });

ipcRenderer.on('downloadState?', (event, rescode) => {
    if (rescode === 200) {
        log('download started');
        // notify user that download has started
    } else if (rescode === 206) {
        log('download stopped');
        // notify user that download has stopped
    } else if (rescode === 201) {
        log('download finished');
        // turn start button opacity back to 1
        const btnGo = document.getElementById('btnGo');
        const btnGoTop = document.getElementById('btnGoTop');
        
        btnGo.style.pointerEvents = 'auto';
        btnGoTop.style.pointerEvents= 'auto';
        btnGo.style.opacity = 1;
        btnGoTop.style.opacity = 1;
    };
});

ipcRenderer.on('versionUpdate', (event, msg) => {
    log(msg)
});

ipcRenderer.on('currentInstallPath', (event, path) => {
    // log('..' + path.split('\\common')[1].replace(/\\/g, '/'));
    document.getElementById('demoText2').innerHTML = '..' + path.split('\\common')[1].replace(/\\/g, '/');
});

ipcRenderer.on('currentInstallPathFinish', (event, msg) => {
    // log('..' + path.split('\\common')[1].replace(/\\/g, '/'));
    document.getElementById('demoText2').innerHTML = msg;
    document.getElementById('demoText2').marginRight = '-40px';
});

// Mount sends path back to ipcMain when user chooses a path
document.getElementById('pathmountButton').addEventListener('click', () => {
    ipcRenderer.send('gamePathMount');
});

document.getElementById('btnClose').addEventListener('click', () => {
    remote.BrowserWindow.getFocusedWindow().close();
});
document.getElementById('btnMin').addEventListener('click', () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
});

ipcRenderer.send('notisChange', appStorage.getItem('notifications'));

ipcRenderer.on('notisStatus', () => {
    ipcRenderer.send('notisStatusRes', appStorage.getItem('notifications'));
});

ipcRenderer.on('notification', (event, arr) => {
    setTimeout(() => {
        createNotification(arr.title, arr.content, arr.type, arr.ms);
    }, 200);
});

ipcRenderer.on('releaseName', (event, rel) => {
    releaseName = rel;
});

window.addEventListener('DOMContentLoaded', () => {

    // Send load event to ipcMain
    ipcRenderer.send('windowLoad', {notis: appStorage.getItem('notifications')});

    ipcRenderer.send('notisChange', appStorage.getItem('notifications'));

    // const check = (id, n) => {
    //     var bool = (appStorage.getItem(n) === 'true');
    //     document.getElementById(id).checked = bool;
    // };

    // Configure checkboxes
    check('cb1', 'flSpec');
    check('cb2', 'gtSpec');
    check('cb3', 'cSpec');
    check('notiCbx', 'notifications');
    
    // var notiCheck = appStorage.getItem('notifications');
    // document.getElementById('notiCbx')

    // Dev console log
    for ( var keyName in appStorage ) {
        // log(keyName)
    };

    for (var i = 0; i < appStorage.length; i++) {
        // log(appStorage.getItem(localStorage.key(i)));
    };

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
        
        document.getElementById('demoText').style.display = 'none';
        document.getElementById('demoText2').style.display = 'inline-block';
        document.getElementById('demoText2').style.marginTop = '45px';

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
    };
});

function valueParse(elem) {
    appStorage.setItem(elem.name, elem.checked);
    // log(`${elem.name} => ` + elem.checked);
};

function notificationChoice(elem) {
    appStorage.setItem('notifications', elem.checked);
    // log('notifications', appStorage.getItem('notifications'));
    ipcRenderer.send('notisChange', elem.checked);
};

function menuFold(x) {
    x.classList.toggle('change');
};

function createNotification(title, content, type, ms) {
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

    if (ms != 'none') {
        setTimeout(() => {
            notification.style.display = 'none';
        }, ms);
    };
    
};

var transDuration = 150;
function settingsSyncFold() {
    // log('settings press');

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
    // log('settings press on cross');

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

function btnGo (el) {
    // log('go', el);

    const btnGo = document.getElementById('btnGo');
    const btnGoTop = document.getElementById('btnGoTop');

    // Turn the button off
    btnGo.style.pointerEvents = 'none';
    btnGoTop.style.pointerEvents = 'none';
    btnGo.style.opacity = 0.3;
    btnGoTop.style.opacity = 0.3;

    document.getElementById('btnStop').style.opacity = 1;
    document.getElementById('btnStopTop').style.opacity = 1;

    // Loop through all keynames for module names and send to ipcMain

    // for ( var keyName in appStorage ) {

    //     var item = appStorage.getItem(keyName);

    //     if (item !== null) {
    //         if (keyName.value == true) {
    //             ipcRenderer.send('getCurrent', {type: keyName});
    //         };
    //     };
    // };

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

    if (array.length == 0) {
        // Send notification here
        log('Please choose a series');
        createNotification('Invalid Series Selection', 'Please choose a racing series to synchronise', 'bad', 10000)
    }
    else if (array.length != 0) {
        ipcRenderer.send('getCurrent', {arr: array});
    };
    
};

function btnStop (el) {
    // log('stop', el);

    document.getElementById('btnStop').style.opacity = 0.3;
    document.getElementById('btnStopTop').style.opacity = 0.3;

    document.getElementById('btnGo').style.opacity = 1;
    document.getElementById('btnGoTop').style.opacity = 1;

    // Send event to main to destroy request object
    ipcRenderer.send('downloadStop');
};

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

    // log(eventCounter);
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
    // document.getElementById(infoArr[infoCounter]).style.display = 'inline-block';

    // log('info', infoCounter);
};