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
        
    });

    // Step 2: Create a .wxs template file
    await msiCreator.create();

    // Step 3: Compile the template to a .msi file
    await msiCreator.compile();
};

main();