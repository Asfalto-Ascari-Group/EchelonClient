const electronInstaller = require('electron-winstaller');

// NB: Use this syntax within an async function, Node does not have support for
//     top-level await as of Node 12.
try {
    electronInstaller.createWindowsInstaller({
        appDirectory: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/echelon-win32-x64',
        outputDirectory: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/installer',
        title: 'Echelon',
        name: 'Echelon',
        description: 'Project Echelon Executable File',
        authors: 'AsfaltoAscari',
        owners: 'Admin_AsfaltoAscari',
        iconUrl: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/root/src/images/thumb.ico',
        setupIcon: 'E:/SoftwareDev/AA/src4/EchelonClient-Release-Stable/root/src/images/thumb.ico',
        setupExe: 'EchelonSetup.exe',
        exe: 'echelon.exe'
    });
    console.log('It worked!');
} catch (e) {
    console.log(`No dice: ${e.message}`);
};