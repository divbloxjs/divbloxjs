const fs = require("fs");
const fsAsync = require("fs").promises;
const divbloxRoot = "../..";
const divbloxConfigRoot = divbloxRoot+"/divblox_config";
const dataModelFileName = divbloxConfigRoot+'/data-model.json';
const dxConfigFileName = divbloxConfigRoot+'/dxconfig.json';
const dxExampleScriptFileName = divbloxRoot+'/divblox_example.js';

/**
 * Creates the minimum configuration files needed for Divblox to be initiated
 * @returns {Promise<void>}
 */
async function createDefaults() {
    console.log("Initializing Divblox...");
    if (!fs.existsSync(divbloxConfigRoot)){
        console.log("Creating Divblox config directory...");
        fs.mkdirSync(divbloxConfigRoot);
    }
    if (!fs.existsSync(dataModelFileName)) {
        console.log("Creating Divblox data model...");
        const dxDataModelDefaultStr = await fsAsync.readFile('dx_core_functions/templates/data-model.json');
        await fsAsync.writeFile(dataModelFileName, dxDataModelDefaultStr);
    }
    if (!fs.existsSync(dxConfigFileName)) {
        console.log("Creating Divblox default config file...");
        const dxConfigDefaultStr = await fsAsync.readFile('dx_core_functions/templates/dxconfig.json');
        await fsAsync.writeFile(dxConfigFileName, dxConfigDefaultStr);
    }
    if (!fs.existsSync(dxExampleScriptFileName)) {
        console.log("Creating Divblox example script...");
        const dxExampleScriptStr = await fsAsync.readFile('dx_core_functions/templates/divblox_example.js');
        await fsAsync.writeFile(dxExampleScriptFileName, dxExampleScriptStr);
    }
    console.log("Done! You can now go back to the nodejs root with 'cd ../..'");
}
createDefaults();