const { MSICreator } = require('electron-wix-msi');

const main = async () => {

    console.log('Creating Windows installer...');

    // Step 1: Instantiate the MSICreator
    const msiCreator = new MSICreator({
        appDirectory: 'E:\\SoftwareDev\\AA\\src4\\EchelonClient-Release-Stable\\Echelon-win32-x64',
        description: 'Project Echelon',
        exe: 'Echelon.exe',
        name: 'Echelon',
        manufacturer: 'Asfalto Ascari',
        version: '1.0.0',
        outputDirectory: 'E:\\SoftwareDev\\AA\\src4\\EchelonClient_Installer',
        cultures: 'en-us',
        appIconPath: 'E:\\SoftwareDev\\AA\\src4\\EchelonClient-Release-Stable\\Echelon-win32-x64\\resources\\app\\root\\src\\images\\thumb.ico',
        features: {
            autoLaunch: true,
            autoUpdate: true
        },
        ui: {
            enabled: true,
            chooseDirectory: true,
            images: {
                background: 'E:\\SoftwareDev\\AA\\src4\\EchelonClient-Release-Stable\\Echelon-win32-x64\\resources\\app\\root\\src\\images\\bg.png',
                banner: 'E:\\SoftwareDev\\AA\\src4\\EchelonClient-Release-Stable\\Echelon-win32-x64\\resources\\app\\root\\src\\images\\McLaren-P11.jpg',
            }
        }
    });

    // Step 2: Create a .wxs template file
    await msiCreator.create();

    // Step 3: Compile the template to a .msi file
    await msiCreator.compile();
};

main();