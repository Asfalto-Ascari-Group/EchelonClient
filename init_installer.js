const electronInstaller = require('electron-winstaller');

    // NB: Use this syntax within an async function, Node does not have support for
    //     top-level await as of Node 12.
    try {
        electronInstaller.createWindowsInstaller({
        appDirectory: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/echelon-win32-x64',
        outputDirectory: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/installer',
        description: 'description',
        authors: 'author1',
        exe: 'echelon.exe'
        });
        console.log('It worked!');
    } catch (e) {
        console.log(`No dice: ${e.message}`);
    };